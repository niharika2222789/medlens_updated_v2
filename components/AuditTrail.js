"use client";

export default function AuditTrail({ audit }) {
  return (
    <div className="card">
      <h2>Timeline &amp; audit history</h2>
      <p className="card-subtitle">Every extraction, edit, and review action on this patient, newest first.</p>
      {(!audit || audit.length === 0) && <div className="empty-state">No activity recorded yet.</div>}
      {(audit || []).map((a) => (
        <div className="audit-item" key={a.id}>
          <div className="audit-time">{new Date(a.timestamp).toLocaleString()}</div>
          <div>{a.detail}</div>
        </div>
      ))}
    </div>
  );
}
