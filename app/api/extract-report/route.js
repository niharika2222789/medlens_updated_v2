import { NextResponse } from "next/server";
import { callAI, parseJsonResponse } from "../../../lib/aiClient";
import { EXTRACTION_SYSTEM_PROMPT } from "../../../lib/prompts";
import { offlineExtract } from "../../../lib/offlineExtraction";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const reportText = (body?.reportText || "").toString();
  if (!reportText.trim()) {
    return NextResponse.json({ error: "reportText is required." }, { status: 400 });
  }

  try {
    const { text, provider } = await callAI({
      system: EXTRACTION_SYSTEM_PROMPT,
      userContent: `Extract structured parameters from this report text:\n\n${reportText}`,
      maxTokens: 2000,
    });
    const parsed = parseJsonResponse(text);
    return NextResponse.json({
      parameters: parsed.parameters || [],
      reportMeta: parsed.reportMeta || {},
      mode: "ai",
      provider,
    });
  } catch (err) {
    // Log the real error server-side (terminal running `npm run dev`, or
    // your host's logs) — the client response only gets a short code, so
    // this is the place to actually see "model not found", "insufficient
    // balance", auth errors, etc.
    console.error("[extract-report] AI call failed, using offline fallback:", err);
    // Any AI failure (no key, low balance, rate limit, network, bad JSON) —
    // fall back to the deterministic offline extractor so the app still
    // produces a usable, clearly-labeled result.
    const fallback = offlineExtract(reportText);
    return NextResponse.json({
      ...fallback,
      mode: "offline",
      offlineReason: err.code || "UNKNOWN_ERROR",
      offlineDetail: (err.message || "").slice(0, 300),
      offlineMessage:
        err.code === "NO_API_KEY"
          ? "No AI provider is configured, so MedLens used its built-in pattern-matching fallback instead. Add ANTHROPIC_API_KEY or a free GEMINI_API_KEY to .env.local to enable AI extraction. Review these values with extra care."
          : "AI extraction was unavailable (rate limit, balance, or a request error), so MedLens used its built-in pattern-matching fallback instead. Review these values with extra care.",
    });
  }
}
