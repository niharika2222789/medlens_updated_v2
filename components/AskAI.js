"use client";

import { useState } from "react";
import { Sparkles, Send, Bot, UserRound } from "lucide-react";

const SUGGESTIONS = [
  "What do these results mean in plain terms?",
  "Which values are outside the normal range, and by how much?",
  "What should I ask my doctor at the next visit?",
  "Are there any conflicts between what I reported and the report?",
];

export default function AskAI({ chatHistory, onAsk, asking, hasData }) {
  const [draft, setDraft] = useState("");

  function send(text) {
    const q = (text ?? draft).trim();
    if (!q || asking) return;
    onAsk(q);
    setDraft("");
  }

  return (
    <div className="card">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={17} style={{ color: "var(--teal)" }} /> Ask AI about this record
      </h2>
      <p className="card-subtitle">
        Ask questions about the intake, extracted values, or conflicts. This is informational only — it will never
        diagnose or recommend treatment; for that, talk to a clinician.
      </p>

      {!hasData ? (
        <div className="banner" style={{ marginBottom: 14 }}>
          There's no extracted report data yet, so answers will be based only on the intake info you've entered.
          Extract a report on the Report tab for richer answers.
        </div>
      ) : null}

      <div className="chat-thread">
        {chatHistory.length === 0 ? (
          <div className="empty-state" style={{ padding: "20px 4px" }}>
            No questions yet — try one of the suggestions below, or type your own.
          </div>
        ) : (
          chatHistory.map((m) => (
            <div key={m.id} className={`chat-bubble-row ${m.role}`}>
              <div className="chat-avatar">{m.role === "user" ? <UserRound size={14} /> : <Bot size={14} />}</div>
              <div className="chat-bubble">
                {m.text}
                {m.mode === "offline" ? (
                  <div className="chat-mode-tag" title={m.detail || undefined}>
                    offline fallback{m.detail ? " — hover for why" : ""}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
        {asking ? (
          <div className="chat-bubble-row assistant">
            <div className="chat-avatar">
              <Bot size={14} />
            </div>
            <div className="chat-bubble chat-typing">Thinking…</div>
          </div>
        ) : null}
      </div>

      <div className="chat-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)} disabled={asking}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question about this record…"
          disabled={asking}
        />
        <button type="submit" className="btn btn-primary" disabled={asking || !draft.trim()}>
          <Send size={14} /> Send
        </button>
      </form>
    </div>
  );
}
