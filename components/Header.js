"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, UserCircle2, LogOut, ChevronDown, Save } from "lucide-react";

export default function Header({ profile, onSaveProfile, onLogout }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile?.displayName || "");
  const [age, setAge] = useState(profile?.age || "");
  const [sex, setSex] = useState(profile?.sex || "");
  const boxRef = useRef(null);

  useEffect(() => {
    setName(profile?.displayName || "");
    setAge(profile?.age || "");
    setSex(profile?.sex || "");
  }, [profile]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSave(e) {
    e.preventDefault();
    onSaveProfile({ displayName: name.trim(), age: age.trim(), sex: sex.trim() });
    setOpen(false);
  }

  function handleLogout() {
    if (confirm("Log out on this device? This clears your personal profile (name/age/sex) only — none of your patients or records are deleted.")) {
      onLogout();
      setOpen(false);
    }
  }

  return (
    <div className="topbar no-print">
      <div className="brand">
        <div className="brand-mark">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1>MedLens</h1>
          <span className="tagline">Clinical information intelligence — not a diagnostic tool</span>
        </div>
      </div>
      <div className="topbar-right" ref={boxRef} style={{ position: "relative" }}>
        <button className="user-chip user-chip-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <UserCircle2 size={15} />
          {profile?.displayName || "Account"}
          <ChevronDown size={13} style={{ opacity: 0.7 }} />
        </button>

        {open ? (
          <div className="account-dropdown">
            <div className="account-dropdown-header">
              {profile?.displayName ? `Signed in as ${profile.displayName}` : "No personal profile yet"}
            </div>
            <p className="card-subtitle" style={{ margin: "2px 0 12px" }}>
              Stored only on this device/browser — used to pre-fill records you mark as "myself".
            </p>
            <form onSubmit={handleSave}>
              <div className="field" style={{ marginBottom: 8 }}>
                <label htmlFor="acct-name">Full name</label>
                <input id="acct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Menon" />
              </div>
              <div className="field-grid" style={{ marginBottom: 10 }}>
                <div className="field">
                  <label htmlFor="acct-age">Age</label>
                  <input id="acct-age" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 29" />
                </div>
                <div className="field">
                  <label htmlFor="acct-sex">Sex</label>
                  <input id="acct-sex" value={sex} onChange={(e) => setSex(e.target.value)} placeholder="e.g. Female" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
                <Save size={14} /> Save profile
              </button>
            </form>
            <button className="btn btn-quiet account-logout-btn" onClick={handleLogout} disabled={!profile?.displayName}>
              <LogOut size={14} /> Log out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
