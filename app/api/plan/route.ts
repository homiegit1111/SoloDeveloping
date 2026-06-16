import { NextRequest, NextResponse } from "next/server";
import { AppState, BookChunk, DailyPlan } from "@/lib/types";
import { callAI, extractJSON } from "@/lib/ai";
import { PLANNER_SYSTEM, buildPlannerUser } from "@/lib/prompts";
import { diagnose } from "@/lib/diagnosis";
import { passagesFromDomainChunks, flattenPassages } from "@/lib/retrieval";
import { buildIntelligentPlan } from "@/lib/intelligence";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { state?: AppState; domainChunks?: Record<string, BookChunk[]> } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const state = body.state;
  if (!state) return NextResponse.json({ error: "Missing state" }, { status: 400 });

  // STEP 1-3: diagnose the hunter and rebuild the per-domain passages the client pulled.
  const dx = diagnose(state);
  const passages = passagesFromDomainChunks(body.domainChunks);

  // STEP 4-6: deterministic floor that always works (the books are the source of truth).
  const local = buildIntelligentPlan(state, dx, passages);

  if (state.settings && state.settings.aiEnabled === false) {
    return NextResponse.json({ plan: local, source: "local" });
  }

  const user = buildPlannerUser(state, dx, passages);
  const ai = await callAI(PLANNER_SYSTEM, user, 2200);

  if (!ai.ok) {
    return NextResponse.json({ plan: local, source: "local", aiError: ai.error });
  }
  const parsed = extractJSON(ai.text);
  if (!parsed) {
    return NextResponse.json({ plan: local, source: "local", aiError: "Could not parse AI response" });
  }

  // Merge AI prose over the intelligent scaffold. Keep the diagnosis, boss task,
  // sources and never-repeat tracking from the engine so memory persists.
  const flat = flattenPassages(passages);
  const plan: DailyPlan = {
    ...local,
    ...parsed,
    date: local.date,
    generatedBy: "ai",
    diagnosis: local.diagnosis,
    bossTask: local.bossTask,
    sources: local.sources,
    usedChunkIds: local.usedChunkIds,
    teachings: local.teachings,
    bookCitations: flat.slice(0, 6).map((c) => ({ book: c.book, page: c.page })),
  };

  return NextResponse.json({ plan, source: "ai", provider: ai.provider });
}
