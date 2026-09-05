"use client";

import { useState } from "react";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function CompareView({ reportText, structuredRecord }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (!reportText) {
    return (
      <div className="card">
        <h2>Source vs. structured</h2>
        <div className="empty-state">No report text yet.</div>
      </div>
    );
  }

  const hoveredRow = structuredRecord.find((r) => r.id === hoveredId);

  let rendered = reportText;
  if (hoveredRow?.rawSnippet && reportText.includes(hoveredRow.rawSnippet)) {
    const parts = reportText.split(hoveredRow.rawSnippet);
    rendered = (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && <mark className="snippet-highlight">{hoveredRow.rawSnippet}</mark>}
          </span>
        ))}
      </>
    );
  }

  return (
    <div className="card">
      <h2>Source vs. structured</h2>
      <p className="card-subtitle">Hover a row on the right to see exactly where it came from in the original text.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div className="snippet-source">{rendered}</div>
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {structuredRecord.length === 0 ? (
            <div className="empty-state">No extracted parameters yet.</div>
          ) : (
            structuredRecord.map((row) => (
              <div
                key={row.id}
                onMouseEnter={() => setHoveredId(row.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                  marginBottom: 6,
                  fontSize: 13,
                  background: hoveredId === row.id ? "var(--teal-soft)" : "transparent",
                  cursor: "default",
                }}
              >
                <strong>{row.canonicalParameter || row.parameter}</strong>: {row.value} {row.unit || ""}
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  {row.rawSnippet ? `from: "${row.rawSnippet}"` : "no source snippet recorded"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
