// Sample data only — never claims to be a real extraction. Loading any of
// these tags the resulting record isDemo: true and every value keeps its
// normal source/confidence badges so the pipeline is shown exactly as it
// would run on a real report.

export const DEMO_PATIENTS = [
  {
    key: "anemia",
    label: "Demo: Unexplained fatigue (possible anemia)",
    intake: {
      fullName: "Asha Rao",
      age: "34",
      sex: "Female",
      chiefComplaint: "Fatigue and shortness of breath on exertion for 3 weeks",
      knownConditions: "None reported",
      currentMedications: "Multivitamin",
    },
    reportText: `CENTRAL DIAGNOSTIC LABORATORY
Patient: Asha Rao   Age/Sex: 34/F   Report Date: 2026-08-02

COMPLETE BLOOD COUNT (CBC)
Hemoglobin        10.2   g/dL    (13.0-17.0)
Hematocrit        32     %       (38-50)
RBC Count         3.6    mill/uL (4.2-5.9)
WBC Count         7200   /uL     (4000-11000)
Platelet Count    250000 /uL     (150000-450000)
Ferritin          8      ng/mL   (15-150)
Vitamin B12       210    pg/mL   (200-900)`,
  },
  {
    key: "glucose",
    label: "Demo: Routine checkup (elevated glucose)",
    intake: {
      fullName: "David Chen",
      age: "51",
      sex: "Male",
      chiefComplaint: "Annual routine health checkup, feeling generally well",
      knownConditions: "Hypertension, on medication",
      currentMedications: "Amlodipine 5mg daily",
    },
    reportText: `SUNRISE PATHOLOGY LABS
Patient: David Chen   Age/Sex: 51/M   Report Date: 2026-07-18

BIOCHEMISTRY PANEL
Glucose Fasting    142    mg/dL   (70-100)
HbA1c              6.8    %       (4.0-5.6)
Total Cholesterol  210    mg/dL   (<200)
LDL Cholesterol    138    mg/dL   (<100)
HDL Cholesterol    42     mg/dL   (>40)
Triglycerides      190    mg/dL   (<150)
Creatinine         1.0    mg/dL   (0.6-1.3)
TSH                2.1    uIU/mL  (0.4-4.0)`,
  },
  {
    key: "wellness",
    label: "Demo: Wellness panel (mostly normal, one borderline)",
    intake: {
      fullName: "Priya Menon",
      age: "27",
      sex: "Female",
      chiefComplaint: "General wellness screening, no specific complaints",
      knownConditions: "None reported",
      currentMedications: "None",
    },
    reportText: `GREEN VALLEY DIAGNOSTICS
Patient: Priya Menon   Age/Sex: 27/F   Report Date: 2026-08-20

CBC & METABOLIC PANEL
Hemoglobin         13.4   g/dL   (12.0-15.5)
WBC Count          6100   /uL    (4000-11000)
Platelet Count     310000 /uL    (150000-450000)
Glucose Fasting    88     mg/dL  (70-100)
TSH                5.2    uIU/mL (0.4-4.0)
Vitamin D (25-OH)  18     ng/mL  (30-100)
Creatinine         0.8    mg/dL  (0.5-1.1)`,
  },
];

export function getDemoByKey(key) {
  return DEMO_PATIENTS.find((d) => d.key === key) || null;
}
