// Server-side only. This is the single entry point every API route should
// call for AI text generation — it hides which provider actually answered.
//
// Order of attempts:
//   1. Anthropic Claude, if ANTHROPIC_API_KEY is set.
//   2. Google Gemini, if GEMINI_API_KEY is set (this has a free tier — see
//      lib/geminiClient.js for how to get a key at no cost).
//   3. Neither configured (or both failed) → throws, and every API route in
//      this app catches that and falls back to the deterministic offline
//      logic in lib/offline*.js so the app still works with zero AI keys.
//
// Callers get back { text, provider } so the UI/audit trail can say exactly
// which model answered ("Claude" vs "Gemini" vs the offline fallback).

import { callClaude } from "./anthropicClient";
import { callGemini } from "./geminiClient";

export async function callAI({ system, userContent, maxTokens = 1500 }) {
  const attempts = [];

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const text = await callClaude({ system, userContent, maxTokens });
      return { text, provider: "claude" };
    } catch (err) {
      attempts.push(`Claude: ${err.message}`);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await callGemini({ system, userContent, maxTokens });
      return { text, provider: "gemini" };
    } catch (err) {
      attempts.push(`Gemini: ${err.message}`);
    }
  }

  const err = new Error(
    attempts.length
      ? `All configured AI providers failed — ${attempts.join(" | ")}`
      : "No AI provider is configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env.local (Gemini has a free tier — see lib/geminiClient.js)."
  );
  err.code = attempts.length ? "PROVIDER_ERROR" : "NO_API_KEY";
  throw err;
}

/** Strips ```json fences etc. and parses JSON, throwing a clear error if it fails. */
export function parseJsonResponse(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}
