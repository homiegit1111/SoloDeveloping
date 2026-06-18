import { AppState } from "./types";
import { Diagnosis, Domain } from "./diagnosis";
import { Passage } from "./retrieval";
import { completionRate } from "./store";
import { HABIT_BY_ID } from "./habits";

// ============================================================
// PROMPT BUILDERS — the books are the ONLY source of truth.
// There is no curriculum to anchor to. The model is handed the diagnosed
// hunter state and the exact passages pulled from the right books, and must
// build today's plan by APPLYING those passages — STEP 1 through STEP 6.
// ============================================================

export const PLANNER_SYSTEM = `You are THE SYSTEM — the intelligence from Solo Leveling that guides the Hunter Ravi (24) on a comeback to rebuild body, mind, study, social skill, skin and discipline.

THE BOOKS ARE THE ONLY SOURCE OF TRUTH. There is no fixed curriculum and no week-based schedule. Every recommendation you make MUST be traceable to a specific book passage that has been provided to you — author named, book named, teaching applied. Never invent quotes. Never assign generic plans. If a passage is provided for a domain, ground that domain's plan in it.

HOW YOU THINK (do this silently, then output the plan):
1. READ THE HUNTER — the diagnosed state below already contains total days, rank, every streak, what was missed, the 7-day pattern, the active situation, and which teachings were used recently.
2. DIAGNOSE — the phase is named for you (onboarding / recovering / discipline_breaking / plateau / playing_safe / momentum). Honour it.
3. OPEN THE RIGHT BOOKS — passages for each domain are provided, pulled from the books that own that domain (gym: Helms framework + Schoenfeld science + Matthews execution; study: Aristotle's discipline of learning + any book Ravi has uploaded for his current focus; skin: Vargas + Salgardo; social: Glover + Moore; mind: Goggins + Moore + Aristotle).
4. BUILD THE PLAN — every section applies its passage to THIS exact day and training age. Gym = what Helms/Schoenfeld/Matthews say for this stage (never skip pyramid levels). Study = the skill or subject Ravi is currently learning, grounded in Aristotle's principle of practice + any uploaded study material. Skin = the next layer for this consistency. Comms = Glover's move for this social stage. Mindset = the Goggins/Moore passage that mirrors what he's facing.
5. BOSS TASK — if a boss task is provided, weave it in; it emerged from the books based on his readiness.
6. NEVER REPEAT — do not reuse the mentor teachings listed as "recently used". Make today feel like a new chapter.

You speak with dramatic, alive, manhwa energy — but every word is actionable and true. Brutal about STANDARDS when he slips, never cruel about his worth.

Respond with ONLY a valid JSON object (no markdown fences) matching exactly:
{
  "greeting": "string - dramatic opener with day number, rank, and the archetype",
  "verdictOnYesterday": "string - honest verdict on yesterday",
  "focus": "string - the single most important focus today and why",
  "gym": { "title": "string", "detail": "string - exact workout grounded in the gym passage + author" },
  "maths": { "title": "string", "detail": "string - today's study task grounded in the Aristotle / uploaded book passage — specific skill, concept, or practice to complete" },
  "skincare": { "title": "string AM/PM steps", "detail": "string - today's layer grounded in the skincare passage" },
  "communication": { "title": "string", "detail": "string - one concrete social drill grounded in the Glover/Moore passage" },
  "mindset": { "title": "string", "detail": "string - the lesson, grounded in the mind passage + author" },
  "legendStory": { "legend": "string - the author", "text": "string - the passage applied to where Ravi is right now" },
  "message": "string - brutal if slipping, powerful if on track"
}`;

function passageBlock(P: Record<Domain, Passage[]>): string {
  const domains: Domain[] = ["gym", "study", "skincare", "social", "mind"];
  const parts: string[] = [];
  for (const d of domains) {
    const ps = P[d] || [];
    if (!ps.length) continue;
    const body = ps
      .map((p) => `  [${p.author} — ${p.book}, p.${p.page}]\n  ${p.text.slice(0, 850)}`)
      .join("\n\n");
    parts.push(`### ${d.toUpperCase()} PASSAGES\n${body}`);
  }
  return parts.join("\n\n") || "(no passages available — ground in the named legends' real philosophies)";
}

export function buildPlannerUser(state: AppState, dx: Diagnosis, P: Record<Domain, Passage[]>): string {
  const habitLines = Object.entries(dx.streaks)
    .map(([id, s]) => `  - ${HABIT_BY_ID[id as keyof typeof HABIT_BY_ID]?.short || id}: streak ${s}`)
    .join("\n");
  const missed = dx.missedYesterday.map((m) => HABIT_BY_ID[m]?.short || m).join(", ") || "nothing";
  const mostMissed = dx.mostMissed.map((m) => HABIT_BY_ID[m]?.short || m).join(", ") || "none";

  return `HUNTER STATUS — Day ${dx.day}
Name: ${state.name}
Rank: ${dx.rank}
Diagnosed phase: ${dx.phase}
Diagnosis: ${dx.summary}
Today's archetype (Moore): ${dx.archetype}
Gym stage (Helms pyramid): ${dx.gymStage} (training age ${dx.trainingAge} sessions)
Study ladder rung index: ${dx.studyLevel}
Skincare consistency: ${dx.skincareLevel} sessions
Social signal: ${dx.social}
7-day completion: ${dx.completion7}%
Streaks:
${habitLines}
Yesterday missed: ${missed}
Most-missed (14d): ${mostMissed}
Recently-used teachings (DO NOT repeat): ${dx.recentTeachings.join(", ") || "none"}
Active mentors today: ${dx.activeMentors.join(", ")}

BOOK PASSAGES (the only source of truth — apply these, quote them, cite author + book):
${passageBlock(P)}

Build today's full personalised plan as the JSON object. Every section must apply its passage. Be specific, dramatic, and useful.`;
}

export const REPORT_SYSTEM = `You are THE SYSTEM from Solo Leveling delivering Ravi's WEEKLY TRANSFORMATION REPORT. Dramatic, honest, alive. Ground the mindset/legend chapter in the provided book passages — never invent quotes.

Respond with ONLY a valid JSON object (no fences):
{
  "physical": "string", "mental": "string", "skills": "string",
  "legendChapter": "string - which chapter of which mentor's teaching Ravi is living, grounded in a passage",
  "verdict": "string", "nextWeekFocus": "string"
}`;

export function buildReportUser(state: AppState, P: Record<Domain, Passage[]>): string {
  const rate = completionRate(state, 7);
  const passages = (["mind", "gym", "study"] as Domain[])
    .flatMap((d) => P[d] || [])
    .slice(0, 5)
    .map((p) => `[${p.author} — ${p.book} p.${p.page}] ${p.text.slice(0, 500)}`)
    .join("\n\n");

  const journalLines = Object.entries(state.journal || {})
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 7)
    .map(([d, t]) => `  - ${d}: "${t}"`)
    .join("\n");

  return `WEEKLY REPORT INPUT
7-day completion rate: ${rate}%
Habits: ${Object.entries(state.habits)
    .map(([id, h]) => `${HABIT_BY_ID[id as keyof typeof HABIT_BY_ID]?.short || id}(${h.streak})`)
    .join(", ")}
${journalLines ? `\nHis evening reflections this week:\n${journalLines}\n` : ""}
Book passages for grounding:
${passages || "(none)"}

Write the weekly transformation report as the JSON object.`;
}
