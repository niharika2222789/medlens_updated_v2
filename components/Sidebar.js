"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, Trash2 } from "lucide-react";
import { DEMO_PATIENTS } from "../lib/demoData";

export default function Sidebar({ records, selectedId, onSelect, onNew, onLoadDemo, onDelete }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | conflicts | demo

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const name = r.intake?.fullName || "Unnamed patient";
      const matchesQuery = query.trim() === "" || name.toLowerCase().includes(query.toLowerCase());
      const hasUnreviewedConflict = (r.conflicts || []).some((c) => !c.reviewed);
      if (filter === "conflicts" && !hasUnreviewedConflict) return false;
      if (filter === "demo" && !r.isDemo) return false;
      return matchesQuery;
    });
  }, [records, query, filter]);

  const totalAbnormal = records.reduce(
    (sum, r) => sum + (r.structuredRecord || []).filter((p) => p.status === "low" || p.status === "high").length,
    0
  );
  const totalUnreviewed = records.reduce(
    (sum, r) => sum + (r.conflicts || []).filter((c) => !c.reviewed).length,
    0
  );

  return (
    <div className="sidebar no-print">
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: 10 }} onClick={onNew}>
        <UserPlus size={15} /> New patient
      </button>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onLoadDemo(e.target.value);
            e.target.value = "";
          }}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid var(--line-strong)",
            background: "var(--paper)",
            fontSize: 13,
          }}
        >
          <option value="" disabled>
            Load sample data…
          </option>
          {DEMO_PATIENTS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="stat-row" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
        <div className="stat-box">
          <div className="label">Patients</div>
          <div className="value">{records.length}</div>
        </div>
        <div className="stat-box">
          <div className="label">Flags open</div>
          <div className="value">{totalUnreviewed}</div>
        </div>
      </div>

      <div style={{ position: "relative", margin: "14px 0 8px" }}>
        <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "var(--ink-soft)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients…"
          style={{
            width: "100%",
            padding: "7px 10px 7px 28px",
            borderRadius: 6,
            border: "1px solid var(--line-strong)",
            fontSize: 13,
            background: "var(--paper)",
          }}
        />
      </div>

      <div className="tabs" style={{ marginBottom: 10 }}>
        {[
          ["all", "All"],
          ["conflicts", "Flagged"],
          ["demo", "Sample"],
        ].map(([key, label]) => (
          <div key={key} className={`tab ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>
            {label}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: "24px 4px" }}>
          No patients match. Try clearing the search or filter.
        </div>
      ) : (
        filtered.map((r) => {
          const unreviewed = (r.conflicts || []).filter((c) => !c.reviewed).length;
          return (
            <div
              key={r.id}
              className={`record-list-item ${selectedId === r.id ? "active" : ""}`}
              onClick={() => onSelect(r.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="name">{r.intake?.fullName || "Unnamed patient"}</div>
                  <div className="meta">
                    {new Date(r.updatedAt || r.createdAt).toLocaleDateString()} · {(r.structuredRecord || []).length}{" "}
                    parameters {unreviewed > 0 ? `· ${unreviewed} flag(s)` : ""}
                  </div>
                </div>
                <button
                  className="btn btn-quiet"
                  title="Delete patient (you can undo right after)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(r.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {r.subject === "self" ? <span className="self-tag">personal</span> : null}
                {r.isDemo ? <span className="demo-tag">sample data</span> : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
