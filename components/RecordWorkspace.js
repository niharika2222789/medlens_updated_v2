"use client";

import { useState } from "react";
import { Printer, User, Users, FileDown } from "lucide-react";
import { exportRecordToPdf } from "../lib/pdfExport";
import IntakeForm from "./IntakeForm";
import ReportTab from "./ReportTab";
import RecordTable, { makeManualRow } from "./RecordTable";
import ConflictPanel from "./ConflictPanel";
import SummaryPanel from "./SummaryPanel";
import CompareView from "./CompareView";
import AuditTrail from "./AuditTrail";
import TrustScore from "./TrustScore";
import AskAI from "./AskAI";
import { buildStructuredRecord } from "../lib/buildStructuredRecord";
import { detectConflicts } from "../lib/conflictDetector";
import { newId, nowIso } from "../lib/id";

const TABS = ["Intake", "Report", "Record", "Conflicts", "Summary", "Ask AI", "Compare", "Audit"];

export default function RecordWorkspace({ record, onUpdateRecord }) {
  const [tab, setTab] = useState("Intake");
  const [extracting, setExtracting] = useState(false);
  const [extractionBanner, setExtractionBanner] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      await exportRecordToPdf(record);
    } catch (err) {
      alert(`PDF export failed: ${err.message}`);
    } finally {
      setExportingPdf(false);
    }
  }

  function commit(patch, auditDetail) {
    const updated = {
      ...record,
      ...patch,
      updatedAt: nowIso(),
    };
    if (auditDetail) {
      updated.audit = [{ id: newId("audit"), timestamp: nowIso(), detail: auditDetail }, ...(record.audit || [])];
    }
    onUpdateRecord(updated);
  }

  function handleIntakeChange(key, value) {
    const nextIntake = { ...record.intake, [key]: value };
    const conflicts = detectConflicts(nextIntake, record.structuredRecord || []);
    commit({ intake: nextIntake, conflicts });
  }

  async function handleExtract() {
    setExtracting(true);
    setExtractionBanner(null);
    try {
      const res = await fetch("/api/extract-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportText: record.reportText }),
      });
      const data = await res.json();
      const structuredRecord = buildStructuredRecord(data.parameters);
      const conflicts = detectConflicts(record.intake, structuredRecord);

      const providerLabel = data.provider === "gemini" ? "Gemini" : "Claude";

      if (data.mode === "offline") {
        const detail = data.offlineDetail ? ` (${data.offlineDetail})` : "";
        setExtractionBanner({ text: `${data.offlineMessage}${detail}`, severe: true });
      } else {
        setExtractionBanner({ text: `Extraction complete using ${providerLabel}.`, severe: false });
      }

      commit(
        {
          structuredRecord,
          conflicts,
          extractionMode: data.mode,
        },
        data.mode === "offline"
          ? `Extracted ${structuredRecord.length} parameter(s) using the offline pattern-matching fallback (AI unavailable: ${data.offlineReason || "unknown"}).`
          : `Extracted ${structuredRecord.length} parameter(s) using ${providerLabel}.`
      );
      setTab("Record");
    } catch (err) {
      setExtractionBanner({ text: `Extraction failed: ${err.message}`, severe: true });
    } finally {
      setExtracting(false);
    }
  }

  function handleEditValue(rowId, patch) {
    const structuredRecord = record.structuredRecord.map((r) => (r.id === rowId ? { ...r, ...patch } : r));
    const conflicts = detectConflicts(record.intake, structuredRecord);
    commit({ structuredRecord, conflicts }, `Edited "${structuredRecord.find((r) => r.id === rowId)?.canonicalParameter}" to ${patch.value}.`);
  }

  function handleAddRow() {
    const structuredRecord = [...(record.structuredRecord || []), makeManualRow()];
    commit({ structuredRecord }, "Added a manual parameter row.");
  }

  function handleRemoveRow(rowId) {
    const removed = record.structuredRecord.find((r) => r.id === rowId);
    const structuredRecord = record.structuredRecord.filter((r) => r.id !== rowId);
    const conflicts = detectConflicts(record.intake, structuredRecord);
    commit({ structuredRecord, conflicts }, `Removed parameter "${removed?.canonicalParameter || removed?.parameter}".`);
  }

  function handleToggleReviewed(conflictId) {
    const conflicts = record.conflicts.map((c) => (c.id === conflictId ? { ...c, reviewed: !c.reviewed } : c));
    const target = conflicts.find((c) => c.id === conflictId);
    commit({ conflicts }, `${target.reviewed ? "Marked reviewed" : "Reopened"}: ${target.field}.`);
  }

  async function handleGenerateSummary() {
    setSummarizing(true);
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: record.intake,
          structuredRecord: record.structuredRecord,
          conflicts: record.conflicts,
        }),
      });
      const summary = await res.json();
      const providerLabel = summary.provider === "gemini" ? "Gemini" : "Claude";
      commit(
        { summary },
        summary.mode === "offline"
          ? "Generated summary using the offline template fallback (AI unavailable)."
          : `Generated AI summary using ${providerLabel}.`
      );
    } catch (err) {
      alert(`Summary generation failed: ${err.message}`);
    } finally {
      setSummarizing(false);
    }
  }

  async function handleAskQuestion(question) {
    const userMsg = { id: newId("msg"), role: "user", text: question, timestamp: nowIso() };
    const historyWithUser = [...(record.chatHistory || []), userMsg];
    commit({ chatHistory: historyWithUser });
    setAsking(true);
    try {
      const res = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          intake: record.intake,
          structuredRecord: record.structuredRecord,
          conflicts: record.conflicts,
          summary: record.summary,
        }),
      });
      const data = await res.json();
      const providerLabel = data.provider === "gemini" ? "Gemini" : "Claude";
      const assistantMsg = {
        id: newId("msg"),
        role: "assistant",
        text: data.answer,
        mode: data.mode,
        detail: data.offlineDetail,
        timestamp: nowIso(),
      };
      commit(
        { chatHistory: [...historyWithUser, assistantMsg] },
        data.mode === "offline"
          ? "Answered a question using the offline fallback (AI unavailable)."
          : `Answered a question using ${providerLabel}.`
      );
    } catch (err) {
      const assistantMsg = {
        id: newId("msg"),
        role: "assistant",
        text: `Sorry, something went wrong answering that: ${err.message}`,
        mode: "error",
        timestamp: nowIso(),
      };
      commit({ chatHistory: [...historyWithUser, assistantMsg] });
    } finally {
      setAsking(false);
    }
  }

  return (
    <div>
      <div className="workspace-header">
        <TrustScore record={record} />
        <span className={`subject-badge subject-${record.subject || "other"}`}>
          {record.subject === "self" ? <User size={13} /> : <Users size={13} />}
          {record.subject === "self" ? "Your personal record" : "Patient record"}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 6 }} className="no-print">
        <button className="btn" onClick={handleExportPdf} disabled={exportingPdf}>
          <FileDown size={14} /> {exportingPdf ? "Building PDF…" : "Download PDF"}
        </button>
        <button className="btn" onClick={() => window.print()}>
          <Printer size={14} /> Print
        </button>
      </div>

      <div className="tabs no-print">
        {TABS.map((t) => (
          <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      {tab === "Intake" && (
        <IntakeForm
          intake={record.intake}
          subject={record.subject}
          onChange={handleIntakeChange}
          onContinue={() => setTab("Report")}
        />
      )}

      {tab === "Report" && (
        <ReportTab
          reportText={record.reportText || ""}
          onChangeText={(text) => commit({ reportText: text })}
          onExtract={handleExtract}
          extracting={extracting}
          extractionBanner={extractionBanner}
        />
      )}

      {tab === "Record" && (
        <RecordTable
          structuredRecord={record.structuredRecord || []}
          onEditValue={handleEditValue}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
        />
      )}

      {tab === "Conflicts" && <ConflictPanel conflicts={record.conflicts || []} onToggleReviewed={handleToggleReviewed} />}

      {tab === "Summary" && (
        <SummaryPanel
          summary={record.summary}
          generating={summarizing}
          onGenerate={handleGenerateSummary}
          canGenerate={(record.structuredRecord || []).length > 0}
        />
      )}

      {tab === "Ask AI" && (
        <AskAI chatHistory={record.chatHistory || []} onAsk={handleAskQuestion} asking={asking} hasData={(record.structuredRecord || []).length > 0} />
      )}

      {tab === "Compare" && <CompareView reportText={record.reportText || ""} structuredRecord={record.structuredRecord || []} />}

      {tab === "Audit" && <AuditTrail audit={record.audit || []} />}
    </div>
  );
}
