"use client";

import { useRef, useState } from "react";
import { ScanLine, Upload } from "lucide-react";

export default function ReportTab({ reportText, onChangeText, onExtract, extracting, extractionBanner }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file) {
    if (!file) return;
    const isText = file.type.startsWith("text/") || file.name.endsWith(".txt");
    if (!isText) {
      alert(
        "For this demo build, upload a plain-text (.txt) export of the report, or paste the text directly. PDF/image OCR isn't wired up in this pass — see README."
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChangeText(e.target.result);
    reader.readAsText(file);
  }

  return (
    <div className="card">
      <h2>Lab / medical report</h2>
      <p className="card-subtitle">Paste the report text below, or drop a .txt export of it.</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        style={{
          border: `1.5px dashed ${dragOver ? "var(--teal)" : "var(--line-strong)"}`,
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        }}
      >
        <textarea
          value={reportText}
          onChange={(e) => onChangeText(e.target.value)}
          rows={10}
          placeholder="Paste the raw report text here (e.g. Hemoglobin  10.2 g/dL  (13.0-17.0))..."
          style={{ width: "100%", border: "none", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 13 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-quiet" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Upload .txt
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/plain"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {extractionBanner ? (
        <div className={`banner ${extractionBanner.severe ? "banner-strong" : ""}`}>{extractionBanner.text}</div>
      ) : null}

      <button className="btn btn-primary" onClick={onExtract} disabled={extracting || !reportText.trim()}>
        <ScanLine size={15} /> {extracting ? "Extracting…" : "Extract structured data"}
      </button>
    </div>
  );
}
