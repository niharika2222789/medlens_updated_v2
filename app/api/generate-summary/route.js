import { NextResponse } from "next/server";
import { callAI, parseJsonResponse } from "../../../lib/aiClient";
import { SUMMARY_SYSTEM_PROMPT } from "../../../lib/prompts";
import { offlineSummarize } from "../../../lib/offlineSummary";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { intake, structuredRecord, conflicts } = body || {};
  if (!Array.isArray(structuredRecord)) {
    return NextResponse.json({ error: "structuredRecord array is required." }, { status: 400 });
  }

  try {
    const { text, provider } = await callAI({
      system: SUMMARY_SYSTEM_PROMPT,
      userContent: JSON.stringify({ intake, structuredRecord, conflicts }, null, 2),
      maxTokens: 1200,
    });
    const parsed = parseJsonResponse(text);
    return NextResponse.json({ ...parsed, mode: "ai", provider });
  } catch (err) {
    console.error("[generate-summary] AI call failed, using offline fallback:", err);
    const fallback = offlineSummarize(structuredRecord, conflicts);
    return NextResponse.json({
      ...fallback,
      offlineReason: err.code || "UNKNOWN_ERROR",
      offlineDetail: (err.message || "").slice(0, 300),
      offlineMessage:
        err.code === "NO_API_KEY"
          ? "No AI provider is configured, so MedLens used a plain template summary instead. Add ANTHROPIC_API_KEY or a free GEMINI_API_KEY to .env.local to enable AI summaries."
          : "AI summary generation was unavailable (rate limit, balance, or a request error), so MedLens used a plain template summary instead.",
    });
  }
}
