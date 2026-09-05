"use client";

// Builds a real, downloadable PDF of a patient record on the client.
// jsPDF is imported dynamically so it never touches the server bundle.

function statusLabel(status) {
  return { low: "Low", high: "High", normal: "Normal", unknown: "No range", abnormal: "Abnormal" }[status] || "Unknown";
}

export async function exportRecordToPdf(record) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 48;

  function ensureSpace(lineHeight = 14) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 48;
    }
    return (y += lineHeight);
  }

  function heading(text) {
    ensureSpace(22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
  }

  function paragraph(text, opts = {}) {
    const lines = doc.splitTextToSize(text, pageWidth - marginX * 2);
    lines.forEach((line) => {
      ensureSpace(opts.lineHeight || 14);
      doc.text(line, marginX, y);
    });
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("MedLens — Patient Record", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(90);
  ensureSpace(16);
  doc.text("Clinical information intelligence — not a diagnostic tool.", marginX, y);
  doc.setTextColor(20);
  ensureSpace(10);

  // Intake
  heading("Intake");
  const intake = record.intake || {};
  paragraph(`Name: ${intake.fullName || "—"}    Age: ${intake.age || "—"}    Sex: ${intake.sex || "—"}`);
  if (intake.chiefComplaint) paragraph(`Chief complaint: ${intake.chiefComplaint}`);
  if (intake.knownConditions) paragraph(`Known conditions: ${intake.knownConditions}`);
  if (intake.currentMedications) paragraph(`Current medications: ${intake.currentMedications}`);
  ensureSpace(6);

  // Structured record
  heading("Structured record");
  const params = record.structuredRecord || [];
  if (params.length === 0) {
    paragraph("No extracted parameters.");
  } else {
    params.forEach((p) => {
      const line = `${p.canonicalParameter || p.parameter}: ${p.value ?? "—"} ${p.unit || ""}  |  ref: ${
        p.referenceRange?.raw || "not printed"
      }  |  ${statusLabel(p.status)}  |  ${p.source === "user_provided" ? "user-provided" : "AI-extracted"} (${p.confidence || "n/a"} confidence)`;
      paragraph(line, { lineHeight: 13 });
    });
  }
  ensureSpace(6);

  // Conflicts
  heading("Conflicts & clarifications");
  const conflicts = record.conflicts || [];
  if (conflicts.length === 0) {
    paragraph("No conflicts detected between intake and the structured record.");
  } else {
    conflicts.forEach((c) => {
      paragraph(`${c.reviewed ? "[Reviewed] " : "[Open] "}${c.field}: ${c.description}`);
    });
  }
  ensureSpace(6);

  // Summary
  if (record.summary?.summary || record.summary?.text) {
    heading("Summary");
    paragraph(record.summary.summary || record.summary.text);
    ensureSpace(6);
  }

  // Trust / provenance note
  heading("Provenance");
  paragraph(
    `Extraction mode: ${record.extractionMode || "n/a"}. This document assists with organizing medical information and is not a substitute for professional diagnosis or treatment.`
  );

  // Audit trail (most recent first, capped so the PDF stays readable)
  heading("Timeline & audit history");
  const audit = (record.audit || []).slice(0, 25);
  if (audit.length === 0) {
    paragraph("No activity recorded yet.");
  } else {
    audit.forEach((a) => {
      paragraph(`${new Date(a.timestamp).toLocaleString()} — ${a.detail}`, { lineHeight: 13 });
    });
  }

  const filename = `medlens-${(intake.fullName || "patient").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
  doc.save(filename);
}
