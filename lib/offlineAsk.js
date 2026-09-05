// Template-based fallback for /api/ask-question, used automatically when the
// Anthropic API call fails (no key / low balance / rate limit / network).
// It can't reason freely like Claude, so it sticks to surfacing the relevant
// data points it can find rather than guessing at an answer.

export function offlineAnswer(question, structuredRecord, conflicts) {
  const q = (question || "").toLowerCase();
  const abnormal = (structuredRecord || []).filter((p) => p.status === "low" || p.status === "high");
  const unreviewedConflicts = (conflicts || []).filter((c) => !c.reviewed);

  const lines = [];

  if (q.includes("conflict")) {
    if (unreviewedConflicts.length === 0) {
      lines.push("There are no unreviewed conflicts between the intake info and the extracted report right now.");
    } else {
      lines.push(`There ${unreviewedConflicts.length === 1 ? "is" : "are"} ${unreviewedConflicts.length} unreviewed conflict(s):`);
      for (const c of unreviewedConflicts.slice(0, 6)) lines.push(`• ${c.description}`);
    }
  } else if (abnormal.length > 0 && (q.includes("mean") || q.includes("abnormal") || q.includes("range") || q.includes("normal") || q === "")) {
    lines.push(`Based on the extracted record, ${abnormal.length} value(s) fall outside their printed reference range:`);
    for (const p of abnormal.slice(0, 8)) {
      lines.push(
        `• ${p.canonicalParameter || p.parameter}: ${p.value}${p.unit ? " " + p.unit : ""} was ${p.status}${
          p.referenceRange?.raw ? ` (reference: ${p.referenceRange.raw})` : ""
        }.`
      );
    }
    lines.push("Discuss what these mean and whether follow-up is needed with your clinician.");
  } else {
    lines.push(
      "AI answering is unavailable right now (no API key, insufficient balance, or a request error), so this is a plain, template-based response instead of a reasoned answer to your specific question."
    );
    if (abnormal.length > 0) {
      lines.push(`For reference, ${abnormal.length} value(s) in the structured record are outside their printed range — see the Record tab for details.`);
    } else {
      lines.push("For reference, no values in the structured record are currently flagged outside their printed range.");
    }
  }

  lines.push("This is informational only, not a diagnosis — please bring specific questions to your clinician.");

  return lines.join("\n");
}
