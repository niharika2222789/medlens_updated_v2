// Small fixed dictionary of common lab-parameter aliases -> canonical name.
// This backs up (never replaces) what the model reports, and is what the
// offline/no-key fallback extractor leans on entirely.

export const PARAMETER_ALIASES = {
  hb: "Hemoglobin",
  haemoglobin: "Hemoglobin",
  hemoglobin: "Hemoglobin",
  hct: "Hematocrit",
  haematocrit: "Hematocrit",
  hematocrit: "Hematocrit",
  wbc: "White Blood Cell Count",
  "wbc count": "White Blood Cell Count",
  "total leukocyte count": "White Blood Cell Count",
  tlc: "White Blood Cell Count",
  plt: "Platelet Count",
  platelets: "Platelet Count",
  "platelet count": "Platelet Count",
  rbc: "Red Blood Cell Count",
  "rbc count": "Red Blood Cell Count",
  glu: "Glucose (Fasting)",
  fbs: "Glucose (Fasting)",
  "fasting blood sugar": "Glucose (Fasting)",
  "fasting glucose": "Glucose (Fasting)",
  hba1c: "HbA1c",
  "glycated hemoglobin": "HbA1c",
  ldl: "LDL Cholesterol",
  hdl: "HDL Cholesterol",
  tc: "Total Cholesterol",
  "total cholesterol": "Total Cholesterol",
  tg: "Triglycerides",
  triglycerides: "Triglycerides",
  tsh: "Thyroid Stimulating Hormone (TSH)",
  alt: "ALT (SGPT)",
  sgpt: "ALT (SGPT)",
  ast: "AST (SGOT)",
  sgot: "AST (SGOT)",
  creatinine: "Creatinine",
  bun: "Blood Urea Nitrogen (BUN)",
  na: "Sodium",
  sodium: "Sodium",
  k: "Potassium",
  potassium: "Potassium",
  ferritin: "Ferritin",
  "vitamin d": "Vitamin D (25-OH)",
  "vit d": "Vitamin D (25-OH)",
  "vitamin b12": "Vitamin B12",
  b12: "Vitamin B12",
  crp: "C-Reactive Protein (CRP)",
  esr: "Erythrocyte Sedimentation Rate (ESR)",
};

export function canonicalizeParameter(name) {
  if (!name) return { canonical: name, wasAliased: false };
  const key = name.trim().toLowerCase();
  if (PARAMETER_ALIASES[key]) {
    return { canonical: PARAMETER_ALIASES[key], wasAliased: true };
  }
  return { canonical: name.trim(), wasAliased: false };
}
