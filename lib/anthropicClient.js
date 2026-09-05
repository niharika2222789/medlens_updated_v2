// Server-side only. Never import this from a client component — it reads
// process.env.ANTHROPIC_API_KEY, which must never reach the browser bundle.
//
// This module only talks to Claude. Routes should generally import
// callAI/parseJsonResponse from lib/aiClient.js instead, which also knows
// how to fall back to Gemini — this file is kept focused and reusable by
// that orchestrator.

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/**
 * Calls the Anthropic Messages API and returns the parsed text content.
 * Throws on any failure (missing key, insufficient balance, network error,
 * non-2xx response) so callers can decide how to fall back — see
 * lib/offlineExtraction.js and lib/offlineSummary.js, which every API route
 * in this app falls back to automatically.
 */
export async function callClaude({ system, userContent, maxTokens = 1500 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error("ANTHROPIC_API_KEY is not set.");
    err.code = "NO_API_KEY";
    throw err;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    const err = new Error(`Anthropic API error ${response.status}: ${bodyText.slice(0, 500)}`);
    err.code = response.status === 429 ? "RATE_LIMIT_OR_BALANCE" : "API_ERROR";
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = (data.content || [])
    .map((block) => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n");

  if (!text) {
    const err = new Error("Anthropic API returned no text content.");
    err.code = "EMPTY_RESPONSE";
    throw err;
  }

  return text;
}

/** Strips ```json fences etc. and parses JSON, throwing a clear error if it fails. */
export function parseJsonResponse(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}
