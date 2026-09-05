"use client";

import { useState } from "react";
import { User, Users, X, Sparkles } from "lucide-react";

// Replaces the old sign-in gate. Nobody has to log in to use MedLens — but
// when a record is for the person themselves, we quietly create (or reuse)
// a one-time local "personal profile" so future "myself" records are
// pre-filled and grouped together. Records added on behalf of someone else
// never touch the profile at all — no account, no prompt, just a record.
export default function NewPatientModal({ open, existingProfile, onClose, onCreate }) {
  const [step, setStep] = useState("choose"); // choose | profile
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState("");
  const [profileSex, setProfileSex] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  function reset() {
    setStep("choose");
    setProfileName("");
    setProfileAge("");
    setProfileSex("");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function chooseSelf() {
    if (existingProfile?.displayName) {
      onCreate({ subject: "self" });
      reset();
      return;
    }
    setStep("profile");
  }

  function chooseOther() {
    onCreate({ subject: "other" });
    reset();
  }

  function handleCreateProfile(e) {
    e.preventDefault();
    if (!profileName.trim()) {
      setError("Enter your name to set up your personal profile.");
      return;
    }
    onCreate({
      subject: "self",
      profile: { displayName: profileName.trim(), age: profileAge.trim(), sex: profileSex.trim() },
    });
    reset();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close">
          <X size={16} />
        </button>

        {step === "choose" ? (
          <>
            <h2 style={{ marginBottom: 6 }}>Who is this record for?</h2>
            <p className="card-subtitle" style={{ marginBottom: 18 }}>
              This just decides whether MedLens keeps a personal profile for you — it doesn't change what the
              record can do.
            </p>
            <div className="choice-grid">
              <button className="choice-card" onClick={chooseSelf}>
                <User size={22} />
                <div className="choice-title">Myself</div>
                <div className="choice-desc">
                  {existingProfile?.displayName
                    ? `Uses your saved profile (${existingProfile.displayName}).`
                    : "Sets up a quick personal profile, automatically — no sign-in."}
                </div>
              </button>
              <button className="choice-card" onClick={chooseOther}>
                <Users size={22} />
                <div className="choice-title">Someone else</div>
                <div className="choice-desc">A patient you're helping. No profile needed — just fill in their details.</div>
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateProfile}>
            <h2 style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} style={{ color: "var(--teal)" }} /> Set up your profile
            </h2>
            <p className="card-subtitle" style={{ marginBottom: 16 }}>
              Created automatically on this device, right now — no password, no sign-in screen. Only you use this
              browser will see it.
            </p>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="pname">Your full name</label>
              <input id="pname" autoFocus value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="e.g. Priya Menon" />
            </div>
            <div className="field-grid" style={{ marginBottom: 12 }}>
              <div className="field">
                <label htmlFor="page">Age</label>
                <input id="page" value={profileAge} onChange={(e) => setProfileAge(e.target.value)} placeholder="e.g. 29" />
              </div>
              <div className="field">
                <label htmlFor="psex">Sex</label>
                <input id="psex" value={profileSex} onChange={(e) => setProfileSex(e.target.value)} placeholder="e.g. Female" />
              </div>
            </div>
            {error ? <div className="banner">{error}</div> : null}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
              <button type="button" className="btn" onClick={() => setStep("choose")}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Create profile &amp; continue
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
