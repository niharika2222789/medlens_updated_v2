"use client";

import { computeTrustScore } from "../lib/trustScore";

export default function TrustScore({ record }) {
  const { score, breakdown } = computeTrustScore(record);
  if (score === null) return null;

  const color = score >= 80 ? "var(--teal)" : score >= 55 ? "var(--amber)" : "var(--brick)";

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div className="trust-score">
        <span className="num" style={{ color }}>
          {score}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)", maxWidth: 130, lineHeight: 1.3 }}>
          Provenance score
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, flex: 1 }}>
        {breakdown} This score reflects how much of the record rests on high-confidence extraction or
        human-verified values, not clinical risk.
      </div>
    </div>
  );
}
