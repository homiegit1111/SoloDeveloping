import { NextRequest, NextResponse } from "next/server";
import { AppState, BookChunk, WeeklyReport } from "@/lib/types";
import { callAI, extractJSON } from "@/lib/ai";
import { REPORT_SYSTEM, buildReportUser } from "@/lib/prompts";
import { buildLocalReport } from "@/lib/planner";

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

  const local = buildLocalReport(state);

  if (state.settings && state.settings.aiEnabled === false) {
    return NextResponse.json({ report: local, source: "local" });
  }

  const ai = await callAI(REPORT_SYSTEM, buildReportUser(state, chunks), 1800);
  if (!ai.ok) return NextResponse.json({ report: local, source: "local", aiError: ai.error });

  const parsed = extractJSON(ai.text);
  if (!parsed) return NextResponse.json({ report: local, source: "local", aiError: "parse failed" });

  const report: WeeklyReport = {
    ...local,
    ...parsed,
    generatedBy: "ai",
    stats: local.stats,
    weekStart: local.weekStart,
    weekNumber: local.weekNumber,
  };
  return NextResponse.json({ report, source: "ai", provider: ai.provider });
}
