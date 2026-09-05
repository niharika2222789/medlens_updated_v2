"use client";

import { Sparkles } from "lucide-react";

export default function SummaryPanel({ summary, generating, onGenerate, canGenerate }) {
  return (
    <div className="card">
      <h2>Patient summary</h2>
      <p className="card-subtitle">Plain-language recap and clarification questions for the clinician visit.</p>

      <button className="btn btn-primary" onClick={onGenerate} disabled={generating || !canGenerate} style={{ marginBottom: 14 }}>
        <Sparkles size={15} /> {generating ? "Generating…" : summary ? "Regenerate summary" : "Generate summary"}
      </button>

      {!canGenerate && !summary ? (
        <div className="empty-state">Extract at least one parameter first.</div>
      ) : null}

      {summary ? (
        <div>
          {summary.mode === "offline" ? (
            <div className="banner">
              {summary.offlineMessage}
              {summary.offlineDetail ? ` (${summary.offlineDetail})` : ""}
            </div>
          ) : null}
          <p style={{ lineHeight: 1.6, fontSize: 14.5 }}>{summary.overview}</p>

          <h3 style={{ fontSize: 14, marginTop: 14, marginBottom: 6 }}>Key points</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
            {(summary.keyPoints || []).map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>

          <h3 style={{ fontSize: 14, marginTop: 14, marginBottom: 6 }}>Questions to ask your clinician</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
            {(summary.clarificationQuestions || []).map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>

          <div className="banner" style={{ marginTop: 14 }}>
            {summary.disclaimer}
          </div>
        </div>
      ) : null}
    </div>
  );
}
