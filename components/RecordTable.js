"use client";

import { ConfidenceDot, SourceBadge, StatusPill } from "./Badges";
import { computeStatus } from "../lib/rangeParser";
import { AlertTriangle } from "lucide-react";

export default function RecordTable({ structuredRecord, onEditValue, onAddRow, onRemoveRow }) {
  if (!structuredRecord || structuredRecord.length === 0) {
    return (
      <div className="card">
        <h2>Structured record</h2>
        <div className="empty-state">No parameters yet — extract a report or add a row manually.</div>
        <button className="btn" onClick={onAddRow} style={{ marginTop: 10 }}>
          + Add parameter manually
        </button>
      </div>
    );
  }

  function handleValueEdit(row, newValue) {
    const status = computeStatus(newValue, row.referenceRange);
    onEditValue(row.id, { value: newValue, status, source: "user_provided", confidence: "high" });
  }

  return (
    <div className="card">
      <h2>Structured record</h2>
      <p className="card-subtitle">
        Editing a value re-tags it "user-provided" — the badge always reflects who's vouching for the number.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="ledger-table">
          <thead>
            <tr>
              <th></th>
              <th>Parameter</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {structuredRecord.map((row) => (
              <tr key={row.id}>
                <td>
                  <ConfidenceDot level={row.confidence} />
                </td>
                <td>
                  {row.canonicalParameter || row.parameter}
                  {row.aliasApplied ? (
                    <div style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>as "{row.parameter}"</div>
                  ) : null}
                  {row.severity > 0.5 ? (
                    <span title="More than 50% outside the printed reference range" style={{ marginLeft: 4 }}>
                      <AlertTriangle size={12} color="var(--brick)" style={{ verticalAlign: "-2px" }} />
                    </span>
                  ) : null}
                </td>
                <td>
                  <input value={row.value ?? ""} onChange={(e) => handleValueEdit(row, e.target.value)} />
                </td>
                <td className="mono">{row.unit || "—"}</td>
                <td className="mono">{row.referenceRange?.raw || "not printed"}</td>
                <td>
                  <StatusPill status={row.status} />
                </td>
                <td>
                  <SourceBadge source={row.source} />
                </td>
                <td>
                  <button className="btn btn-quiet" onClick={() => onRemoveRow(row.id)} title="Remove row">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn" onClick={onAddRow} style={{ marginTop: 12 }}>
        + Add parameter manually
      </button>
    </div>
  );
}

export function makeManualRow() {
  return {
    id: `param_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    parameter: "New parameter",
    canonicalParameter: "New parameter",
    aliasApplied: false,
    value: "",
    unit: null,
    referenceRange: null,
    status: "unknown",
    severity: 0,
    confidence: "high",
    source: "user_provided",
    rawSnippet: "",
  };
}
