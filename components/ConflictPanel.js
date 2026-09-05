"use client";

import { ShieldAlert, CheckCircle2 } from "lucide-react";

export default function ConflictPanel({ conflicts, onToggleReviewed }) {
  return (
    <div className="card">
      <h2>Conflicts &amp; clarifications</h2>
      <p className="card-subtitle">
        Places where intake and the report seem to disagree. These are questions to raise with a clinician, never a
        diagnosis.
      </p>
      {(!conflicts || conflicts.length === 0) && (
        <div className="empty-state">No conflicts detected between intake and the structured record.</div>
      )}
      {(conflicts || []).map((c) => (
        <div key={c.id} className={`conflict-row ${c.reviewed ? "reviewed" : ""}`}>
          <div style={{ display: "flex", gap: 8 }}>
            <ShieldAlert size={16} color={c.soft ? "var(--ink-soft)" : "var(--amber)"} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <strong>{c.field}</strong>
              <div>{c.description}</div>
            </div>
          </div>
          <button className="btn btn-quiet" onClick={() => onToggleReviewed(c.id)} style={{ flexShrink: 0 }}>
            <CheckCircle2 size={14} color={c.reviewed ? "var(--teal)" : "var(--ink-soft)"} />
            {c.reviewed ? "Reviewed" : "Mark reviewed"}
          </button>
        </div>
      ))}
    </div>
  );
}
