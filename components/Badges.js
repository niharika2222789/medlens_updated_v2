export function ConfidenceDot({ level }) {
  const cls = level === "high" ? "confidence-high" : level === "medium" ? "confidence-medium" : "confidence-low";
  return <span className={`confidence-dot ${cls}`} title={`Extraction confidence: ${level || "unknown"}`} />;
}

export function SourceBadge({ source }) {
  const label =
    source === "ai_extracted" ? "AI-extracted" : source === "user_provided" ? "User-provided" : "AI-generated";
  return <span className={`source-badge source-${source}`}>{label}</span>;
}

export function StatusPill({ status }) {
  const label = { low: "Low", high: "High", normal: "Normal", unknown: "No range", abnormal: "Abnormal" }[status] || "Unknown";
  return <span className={`status-pill status-${status}`}>{label}</span>;
}
