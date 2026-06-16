import { NextRequest, NextResponse } from "next/server";
import { AppState, BookChunk, DailyPlan } from "@/lib/types";
import { callAI, extractJSON } from "@/lib/ai";
import { PLANNER_SYSTEM, buildPlannerUser } from "@/lib/prompts";
import { buildLocalPlan } from "@/lib/planner";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { state?: AppState; chunks?: BookChunk[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const state = body.state;
  if (!state) return NextResponse.json({ error: "Missing state" }, { status: 400 });
  const chunks = body.chunks || [];

  // Always compute a strong local plan as the floor / fallback.
  const local = buildLocalPlan(state);

  // If the user disabled AI, return local immediately.
  if (state.settings && state.settings.aiEnabled === false) {
    return NextResponse.json({ plan: local, source: "local" });
  }

  const system = PLANNER_SYSTEM;
  const user = buildPlannerUser(state, chunks);
  const ai = await callAI(system, user, 2200);

  if (!ai.ok) {
    return NextResponse.json({ plan: local, source: "local", aiError: ai.error });
  }

  const parsed = extractJSON(ai.text);
  if (!parsed) {
    return NextResponse.json({ plan: local, source: "local", aiError: "Could not parse AI response" });
  }

  // Merge AI output over the local scaffold so missing fields never break the UI.
  const plan: DailyPlan = {
    ...local,
    ...parsed,
    date: local.date,
    generatedBy: "ai",
    bookCitations: chunks.slice(0, 6).map((c) => ({ book: c.book, page: c.page })),
  };

  return NextResponse.json({ plan, source: "ai", provider: ai.provider });
}
