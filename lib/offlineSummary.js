// Template-based fallback summary, used automatically when the Anthropic API
// call in /api/generate-summary fails (no key / low balance / rate limit /
// network). Keeps the same JSON shape as the AI summary so the UI doesn't
// need to branch, and is tagged mode: "offline".

export function offlineSummarize(structuredRecord, conflicts) {
  const abnormal = structuredRecord.filter((p) => p.status === "low" || p.status === "high");
  const unknownRange = structuredRecord.filter((p) => p.status === "unknown");

  const keyPoints = [];
  if (abnormal.length === 0) {
    keyPoints.push("All parameters with a printed reference range fell within that range.");
  } else {
    for (const p of abnormal.slice(0, 8)) {
      keyPoints.push(
        `${p.canonicalParameter || p.parameter} was ${p.status} (${p.value}${p.unit ? " " + p.unit : ""}${
          p.referenceRange?.raw ? `, reference: ${p.referenceRange.raw}` : ""
        }).`
      );
    }
  }
  if (unknownRange.length > 0) {
    keyPoints.push(
      `${unknownRange.length} parameter(s) had no printed reference range, so status could not be determined.`
    );
  }

  const clarificationQuestions = abnormal.map(
    (p) => `What might explain the ${p.status} ${p.canonicalParameter || p.parameter} result, and does it need follow-up?`
  );
  for (const c of conflicts || []) {
    clarificationQuestions.push(c.description + " Can we go over this together?");
  }
  if (clarificationQuestions.length === 0) {
    clarificationQuestions.push("Is there anything in this report I should keep an eye on going forward?");
  }

  return {
    overview:
      abnormal.length === 0
        ? "Based on the values extracted from this report, everything that had a printed reference range fell within it. This is a plain, template-generated summary (AI summary mode was unavailable) — please still review the full structured record below with your clinician."
        : `This report has ${abnormal.length} value(s) outside the printed reference range. This is a plain, template-generated summary (AI summary mode was unavailable) — please review the full structured record below and discuss it with your clinician.`,
    keyPoints,
    clarificationQuestions,
    disclaimer:
      "This summary is generated to help you organize your health information. It is not a diagnosis and does not replace advice from a qualified clinician. Please discuss these results with your doctor.",
    mode: "offline",
  };
}
