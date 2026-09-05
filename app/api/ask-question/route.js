import { NextResponse } from "next/server";
import { callAI } from "../../../lib/aiClient";
import { ASK_SYSTEM_PROMPT } from "../../../lib/prompts";
import { offlineAnswer } from "../../../lib/offlineAsk";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { question, intake, structuredRecord, conflicts, summary } = body || {};
  if (!question || !question.toString().trim()) {
    return NextResponse.json({ error: "question is required." }, { status: 400 });
  }

  try {
    const { text, provider } = await callAI({
      system: ASK_SYSTEM_PROMPT,
      userContent: JSON.stringify(
        {
          question,
          intake,
          structuredRecord,
          conflicts,
          priorSummary: summary,
        },
        null,
        2
      ),
      maxTokens: 700,
    });
    return NextResponse.json({ answer: text.trim(), mode: "ai", provider });
  } catch (err) {
    console.error("[ask-question] AI call failed, using offline fallback:", err);
    const answer = offlineAnswer(question, structuredRecord, conflicts);
    return NextResponse.json({
      answer,
      mode: "offline",
      offlineReason: err.code || "UNKNOWN_ERROR",
      offlineDetail: (err.message || "").slice(0, 300),
    });
  }
}
