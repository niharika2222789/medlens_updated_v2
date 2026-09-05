"use client";

import { ArrowRight } from "lucide-react";

const FIELDS = [
  ["fullName", "Full name", "text"],
  ["age", "Age", "text"],
  ["sex", "Sex", "text"],
  ["chiefComplaint", "Reason for visit / chief complaint", "textarea"],
  ["knownConditions", "Known conditions (patient-reported)", "textarea"],
  ["currentMedications", "Current medications", "textarea"],
];

export default function IntakeForm({ intake, subject, onChange, onContinue }) {
  return (
    <div className="card">
      <h2>Patient intake</h2>
      <p className="card-subtitle">
        Everything here is tagged "user-provided" and is used to cross-check the report.
        {subject === "self" ? " This record is marked as your own personal information." : ""}
      </p>
      <div className="field-grid">
        {FIELDS.map(([key, label, type]) => (
          <div className="field" key={key} style={type === "textarea" ? { gridColumn: "1 / -1" } : undefined}>
            <label htmlFor={key}>{label}</label>
            {type === "textarea" ? (
              <textarea
                id={key}
                value={intake?.[key] || ""}
                onChange={(e) => onChange(key, e.target.value)}
                rows={2}
              />
            ) : (
              <input id={key} value={intake?.[key] || ""} onChange={(e) => onChange(key, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      <div className="intake-footer">
        <p>
          Done here? Next, paste or upload the lab/medical report so MedLens can extract and generate the
          structured record and summary.
        </p>
        <button className="btn btn-primary" onClick={onContinue}>
          Continue to report <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
