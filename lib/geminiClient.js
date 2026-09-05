// Server-side only. Never import this from a client component — it reads
// process.env.GEMINI_API_KEY, which must never reach the browser bundle.
//
// Google's Gemini API has a genuinely free tier: create a key in Google AI
// Studio (https://aistudio.google.com/app/apikey) and drop it in .env.local
// as GEMINI_API_KEY — no billing setup required for the Flash models. This
// is the "free AI" path for anyone who doesn't have an Anthropic key.
//
// Note: a *Gemini app / Gemini Advanced subscription* (the consumer chat
// app) is a different product from an API key and does not by itself grant
// API access — you still need a key from Google AI Studio (or a
// billing-enabled Google Cloud project) to call this endpoint.

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

export async function callGemini({ system, userContent, maxTokens = 1500 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY is not set.");
    err.code = "NO_API_KEY";
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: system ? { parts: [{ text: system }] } : undefined,
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    const err = new Error(`Gemini API error ${response.status}: ${bodyText.slice(0, 500)}`);
    err.code = response.status === 429 ? "RATE_LIMIT_OR_BALANCE" : "API_ERROR";
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  // Gemini uses finishReason to flag safety blocks / truncation instead of
  // an HTTP error — surface that clearly rather than returning empty text.
  if (!candidate) {
    const err = new Error(
      `Gemini returned no candidates (${data.promptFeedback?.blockReason || "unknown reason"}).`
    );
    err.code = "EMPTY_RESPONSE";
    throw err;
  }

  const text = (candidate.content?.parts || [])
    .map((part) => part.text || "")
    .filter(Boolean)
    .join("\n");

  if (!text) {
    const err = new Error(`Gemini returned no text content (finishReason: ${candidate.finishReason || "unknown"}).`);
    err.code = "EMPTY_RESPONSE";
    throw err;
  }

  return text;
}
