import { newId } from "./id";

// Deterministic, explainable heuristics — not an AI judgment call — for
// flagging places where the patient's intake answers and the report's
// findings seem to disagree. Every conflict is a *question to raise with a
// clinician*, never an accusation or a diagnosis.

function findParam(record, matchers) {
  return record.find((p) =>
    matchers.some((m) => (p.canonicalParameter || p.parameter || "").toLowerCase().includes(m))
  );
}

export function detectConflicts(intake, structuredRecord) {
  const conflicts = [];
  const conditions = (intake?.knownConditions || "").toLowerCase();
  const meds = (intake?.currentMedications || "").toLowerCase();

  const hb = findParam(structuredRecord, ["hemoglobin"]);
  if (hb && hb.status === "low" && !/anemia|anaemia/.test(conditions)) {
    conflicts.push({
      id: newId("conflict"),
      field: "Hemoglobin",
      description: `Patient did not report a history of anemia in intake, but Hemoglobin (${hb.value}${
        hb.unit ? " " + hb.unit : ""
      }) is below the printed reference range.`,
      reviewed: false,
    });
  }
  if (hb && hb.status === "low" && /iron/.test(meds)) {
    conflicts.push({
      id: newId("conflict"),
      field: "Hemoglobin",
      description: `Patient reports currently taking an iron supplement, but Hemoglobin is still below range — worth asking whether dosage, adherence, or absorption should be reviewed.`,
      reviewed: false,
    });
  }

  const glucose = findParam(structuredRecord, ["glucose", "hba1c"]);
  if (glucose && glucose.status === "high" && !/diabet/.test(conditions)) {
    conflicts.push({
      id: newId("conflict"),
      field: glucose.canonicalParameter || glucose.parameter,
      description: `Patient did not report a history of diabetes in intake, but ${
        glucose.canonicalParameter || glucose.parameter
      } (${glucose.value}${glucose.unit ? " " + glucose.unit : ""}) is above the printed reference range.`,
      reviewed: false,
    });
  }

  const tsh = findParam(structuredRecord, ["thyroid"]);
  if (tsh && (tsh.status === "high" || tsh.status === "low") && !/thyroid/.test(conditions)) {
    conflicts.push({
      id: newId("conflict"),
      field: tsh.canonicalParameter || tsh.parameter,
      description: `Patient did not report a known thyroid condition, but TSH is ${tsh.status} relative to the printed reference range.`,
      reviewed: false,
    });
  }

  // Generic: any abnormal parameter not mentioned anywhere in the chief
  // complaint text is surfaced as a soft, informational item — not phrased
  // as a contradiction, just "worth flagging".
  const complaint = (intake?.chiefComplaint || "").toLowerCase();
  for (const p of structuredRecord) {
    if ((p.status === "low" || p.status === "high") && complaint) {
      const name = (p.canonicalParameter || p.parameter || "").toLowerCase();
      const mentioned = name.split(" ").some((word) => word.length > 3 && complaint.includes(word));
      if (!mentioned && !conflicts.some((c) => c.field === (p.canonicalParameter || p.parameter))) {
        conflicts.push({
          id: newId("conflict"),
          field: p.canonicalParameter || p.parameter,
          description: `${p.canonicalParameter || p.parameter} is ${p.status} but wasn't obviously related to the stated reason for visit — may be worth mentioning to the clinician.`,
          reviewed: false,
          soft: true,
        });
      }
    }
  }

  return conflicts;
}
