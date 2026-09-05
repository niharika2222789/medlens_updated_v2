"use client";

import { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import RecordWorkspace from "../components/RecordWorkspace";
import NewPatientModal from "../components/NewPatientModal";
import Toast from "../components/Toast";
import {
  getDeviceId,
  getProfile,
  createOrUpdateProfile,
  clearProfile,
  listRecords,
  upsertRecord,
  deleteRecord,
} from "../lib/storage";
import { newId, nowIso } from "../lib/id";
import { getDemoByKey } from "../lib/demoData";
import { buildStructuredRecord } from "../lib/buildStructuredRecord";
import { detectConflicts } from "../lib/conflictDetector";

function blankRecord({ subject = "other", intake } = {}) {
  return {
    id: newId("patient"),
    isDemo: false,
    subject, // "self" | "other" — who this record belongs to
    createdAt: nowIso(),
    updatedAt: nowIso(),
    intake: intake || { fullName: "", age: "", sex: "", chiefComplaint: "", knownConditions: "", currentMedications: "" },
    reportText: "",
    structuredRecord: [],
    extractionMode: null,
    conflicts: [],
    summary: null,
    chatHistory: [],
    audit: [
      {
        id: newId("audit"),
        timestamp: nowIso(),
        detail: subject === "self" ? "Personal patient record created." : "Patient record created.",
      },
    ],
  };
}

async function runFullPipeline(record) {
  let next = { ...record };
  try {
    const res = await fetch("/api/extract-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportText: record.reportText }),
    });
    const data = await res.json();
    const structuredRecord = buildStructuredRecord(data.parameters);
    const conflicts = detectConflicts(record.intake, structuredRecord);
    next = {
      ...next,
      structuredRecord,
      conflicts,
      extractionMode: data.mode,
      audit: [
        {
          id: newId("audit"),
          timestamp: nowIso(),
          detail:
            data.mode === "offline"
              ? `Extracted ${structuredRecord.length} parameter(s) using the offline pattern-matching fallback (AI unavailable: ${data.offlineReason || "unknown"}).`
              : `Extracted ${structuredRecord.length} parameter(s) using ${data.provider === "gemini" ? "Gemini" : "Claude"}.`,
        },
        ...next.audit,
      ],
    };

    const summaryRes = await fetch("/api/generate-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake: next.intake, structuredRecord, conflicts }),
    });
    const summary = await summaryRes.json();
    next = {
      ...next,
      summary,
      audit: [
        {
          id: newId("audit"),
          timestamp: nowIso(),
          detail:
            summary.mode === "offline"
              ? "Generated summary using the offline template fallback (AI unavailable)."
              : `Generated AI summary using ${summary.provider === "gemini" ? "Gemini" : "Claude"}.`,
        },
        ...next.audit,
      ],
    };
  } catch (err) {
    next.audit = [{ id: newId("audit"), timestamp: nowIso(), detail: `Automatic pipeline run failed: ${err.message}` }, ...next.audit];
  }
  next.updatedAt = nowIso();
  return next;
}

export default function Page() {
  const [ready, setReady] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const pendingDeleteRef = useRef(null);

  // No sign-in screen: every device silently gets its own namespace the
  // instant the app loads, and any existing personal profile is picked up.
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    setProfile(getProfile());
    const r = listRecords(id);
    setRecords(r);
    if (r.length > 0) setSelectedId(r[0].id);
    setReady(true);
  }, []);

  if (!ready) return null; // avoid hydration flash

  function persist(record) {
    upsertRecord(deviceId, record);
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
  }

  function handleNew() {
    setShowNewPatientModal(true);
  }

  function handleCreatePatient({ subject, profile: newProfileInfo }) {
    let intake;
    if (subject === "self") {
      const savedProfile = newProfileInfo ? createOrUpdateProfile(newProfileInfo) : profile;
      if (newProfileInfo) setProfile(savedProfile);
      intake = {
        fullName: savedProfile?.displayName || "",
        age: savedProfile?.age || "",
        sex: savedProfile?.sex || "",
        chiefComplaint: "",
        knownConditions: "",
        currentMedications: "",
      };
    }
    const record = blankRecord({ subject, intake });
    persist(record);
    setSelectedId(record.id);
    setShowNewPatientModal(false);
  }

  // Deletes immediately (no blocking native confirm dialog) and keeps the
  // removed record around for a few seconds so an accidental delete can be
  // undone — feels instant while still being safe.
  function handleDelete(id) {
    const record = records.find((r) => r.id === id);
    deleteRecord(deviceId, id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (record) {
      pendingDeleteRef.current = record;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ message: `Deleted "${record.intake?.fullName || "patient"}".` });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        pendingDeleteRef.current = null;
      }, 5000);
    }
  }

  function handleUndoDelete() {
    const record = pendingDeleteRef.current;
    if (!record) return;
    upsertRecord(deviceId, record);
    setRecords((prev) => [record, ...prev]);
    setSelectedId(record.id);
    pendingDeleteRef.current = null;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }

  function handleSaveProfile(fields) {
    const saved = createOrUpdateProfile(fields);
    setProfile(saved);
  }

  function handleLogout() {
    clearProfile();
    setProfile(null);
  }

  async function handleLoadDemo(key) {
    const demo = getDemoByKey(key);
    if (!demo) return;
    setLoadingDemo(true);
    let record = {
      ...blankRecord({ subject: "other" }),
      isDemo: true,
      demoKey: key,
      intake: { ...demo.intake },
      reportText: demo.reportText,
    };
    record.audit.unshift({ id: newId("audit"), timestamp: nowIso(), detail: `Loaded sample data: "${demo.label}".` });
    persist(record);
    setSelectedId(record.id);
    record = await runFullPipeline(record);
    persist(record);
    setLoadingDemo(false);
  }

  const selected = records.find((r) => r.id === selectedId) || null;

  return (
    <div className="app-shell">
      <Header profile={profile} onSaveProfile={handleSaveProfile} onLogout={handleLogout} />
      <div className="layout-main">
        <Sidebar
          records={records}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNew={handleNew}
          onLoadDemo={handleLoadDemo}
          onDelete={handleDelete}
        />
        <div className="workspace">
          {loadingDemo && selected?.isDemo && (!selected.structuredRecord || selected.structuredRecord.length === 0) ? (
            <div className="empty-state">Running the sample report through extraction and summary…</div>
          ) : selected ? (
            <RecordWorkspace record={selected} onUpdateRecord={persist} />
          ) : (
            <div className="empty-state">
              <h2 style={{ marginBottom: 8 }}>No patient selected</h2>
              <p>Create a new patient, or load a sample from the dropdown on the left.</p>
            </div>
          )}
        </div>
      </div>

      <NewPatientModal
        open={showNewPatientModal}
        existingProfile={profile}
        onClose={() => setShowNewPatientModal(false)}
        onCreate={handleCreatePatient}
      />

      <Toast toast={toast} onUndo={handleUndoDelete} onDismiss={() => setToast(null)} />
    </div>
  );
}
