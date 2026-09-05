// A transparent, deterministic "provenance score" for a record — not a
// clinical risk score, just a measure of how much of the record rests on
// high-confidence extraction or human verification vs. shaky AI guesses or
// unresolved conflicts. Entirely arithmetic so it's explainable to a judge
// or a clinician in one sentence.

const CONFIDENCE_POINTS = { high: 100, medium: 62, low: 32 };

export function computeTrustScore(record) {
  const params = record.structuredRecord || [];
  if (params.length === 0) {
    return { score: null, breakdown: "No parameters yet." };
  }

  const paramScores = params.map((p) => {
    if (p.source === "user_provided") return 100; // human has vouched for it
    return CONFIDENCE_POINTS[p.confidence] ?? 50;
  });
  const base = paramScores.reduce((a, b) => a + b, 0) / paramScores.length;

  const unreviewedConflicts = (record.conflicts || []).filter((c) => !c.reviewed).length;
  const conflictPenalty = Math.min(30, unreviewedConflicts * 8);

  const offlinePenalty = record.extractionMode === "offline" ? 10 : 0;

  const score = Math.max(0, Math.round(base - conflictPenalty - offlinePenalty));

  return {
    score,
    breakdown: `${Math.round(base)} base from extraction confidence & human edits, -${conflictPenalty} for ${unreviewedConflicts} open flag(s)${
      offlinePenalty ? `, -${offlinePenalty} for offline-mode extraction` : ""
    }.`,
  };
}
