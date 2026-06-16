import { AppState, DailyPlan, BookChunk } from "./types";
import { rankForXP } from "./ranks";
import { dayNumber, yesterdaySummary, completionRate } from "./store";
import { mathsForDay } from "../data/curriculum/maths";
import { communicationForDay } from "../data/curriculum/communication";
import { gymForDay } from "../data/curriculum/gym";
import { skincareTipForDay, isExfoliationDay } from "../data/curriculum/skincare";

// ============================================================
// PROMPT BUILDERS — feed real state + real book chunks to the model.
// The system message defines the legend voices and the JSON contract.
// ============================================================

export const PLANNER_SYSTEM = `You are THE SYSTEM — the intelligent force from Solo Leveling that guides a Hunter's ascension. Your Hunter is Ravi, 24, on a 90-day comeback to rebuild body, mind, money, social skills and discipline.

You speak with dramatic, alive, manhwa energy — but every word is actionable and true. You are not soft. You care whether he shows up.

THE LEGENDS speak in their OWN voices when you quote them:
- Arnold Schwarzenegger coaches the GYM and the body.
- Alexander the Great coaches AMBITION and the battlefield of life.
- Buddha and Marcus Aurelius handle DISCIPLINE, desire and the mind.
- James Clear handles HABITS and systems.
- David Goggins handles PAIN and mental toughness (the Accountability Mirror, callusing the mind, the 40% rule, the cookie jar, taking souls).
- Aristotle handles VIRTUE, CHARACTER and WISDOM — study, self-mastery, and the golden mean (excellence is a habit; virtue is the mean between excess and deficiency).
When BOOK EXCERPTS are provided, pull the legend's ACTUAL words and ideas from them — quote and apply them to THIS specific day. Never invent fake quotes; if you use a book excerpt, ground it in the provided text.

You MUST respond with ONLY a valid JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "greeting": "string - dramatic day opener addressing Ravi by name with day number and rank",
  "verdictOnYesterday": "string - honest verdict on yesterday's performance",
  "focus": "string - the single most important focus for today and why",
  "gym": { "title": "string", "detail": "string - exact workout with sets/reps/rest + one form cue from the gym book if provided" },
  "maths": { "title": "string", "detail": "string - today's topic, a simple explanation, and 3 practice problems with answers" },
  "skincare": { "title": "string - AM/PM steps", "detail": "string - today's glow tip grounded in the skincare book" },
  "communication": { "title": "string", "detail": "string - today's skill + one concrete drill to do today" },
  "mindset": { "title": "string", "detail": "string - a mindset lesson pulled from a biography/psychology book or legend" },
  "legendStory": { "legend": "string - which legend", "text": "string - ONE short story from that legend's life that parallels where Ravi is right now" },
  "message": "string - a BRUTAL message if yesterday was incomplete, or a powerful motivating one if he is on track"
}`;

export function buildPlannerUser(state: AppState, chunks: BookChunk[]): string {
  const day = dayNumber(state);
  const rank = rankForXP(state.totalXP);
  const y = yesterdaySummary(state);
  const rate = completionRate(state, 7);
  const gym = gymForDay(day);
  const maths = mathsForDay(day);
  const comm = communicationForDay(day);

  const habitLines = Object.entries(state.habits)
    .map(([id, h]) => `  - ${id}: streak ${h.streak}, best ${h.best}, done ${h.totalDone}×`)
    .join("\n");

  const weak = Object.entries(state.habits)
    .sort((a, b) => a[1].streak - b[1].streak)
    .slice(0, 2)
    .map(([id]) => id)
    .join(", ");

  const bookBlock =
    chunks.length > 0
      ? chunks
          .map((c, i) => `[EXCERPT ${i + 1} — ${c.book}, p.${c.page}, tags:${c.tags.join("/")}]\n${c.text.slice(0, 900)}`)
          .join("\n\n")
      : "(No book excerpts available for today's focus yet — use your own grounded knowledge and the legends' real philosophies.)";

  return `HUNTER STATUS — Day ${day} of 90
Name: ${state.name}
Rank: ${rank.name} (${rank.title}) — total XP ${state.totalXP}
7-day completion rate: ${rate}%
Weakest habits (need attention): ${weak || "none yet"}

Habit streaks:
${habitLines}

YESTERDAY (${y.date}): completed ${y.completed}/${y.total} quests. Missed: ${y.missed.join(", ") || "nothing"}.

TODAY'S CURRICULUM SCAFFOLD (anchor your plan to these — you may enrich them):
- GYM: ${gym.day} — ${gym.focus}. Exercises: ${gym.exercises.map((e) => `${e.name} ${e.sets}x${e.reps}`).join("; ")}.
- MATHS: ${maths.unit} — ${maths.title}. Lesson: ${maths.lesson} Practice ideas: ${maths.practice.map((p) => p.q).join(" | ")}.
- COMMUNICATION: ${comm.unit} — ${comm.skill}. Drill: ${comm.exercise}.
- SKINCARE: AM cleanse→moisturise→SPF, PM cleanse→treat→moisturise${isExfoliationDay(day) ? " (EXFOLIATION night)" : ""}. Glow tip seed: ${skincareTipForDay(day)}.

RELEVANT BOOK EXCERPTS (inject these — quote/apply real text):
${bookBlock}

Generate today's full personalised plan as the JSON object. Be specific, dramatic, and useful. If yesterday was incomplete, make the message genuinely brutal (but never cruel about his worth — brutal about his STANDARDS).`;
}

export const REPORT_SYSTEM = `You are THE SYSTEM from Solo Leveling delivering Ravi's WEEKLY TRANSFORMATION REPORT after 7 days of his 90-day comeback. Dramatic, honest, alive. 

Respond with ONLY a valid JSON object (no fences) of this shape:
{
  "physical": "string - what should be physically different by now given his consistency",
  "mental": "string - mental shifts that should have happened",
  "skills": "string - skills gained this week (maths, communication, etc.)",
  "legendChapter": "string - which chapter of which legend's life Ravi is currently living, and why",
  "verdict": "string - blunt verdict on the week",
  "nextWeekFocus": "string - the focus for next week"
}`;

export function buildReportUser(state: AppState, chunks: BookChunk[]): string {
  const day = dayNumber(state);
  const week = Math.ceil(day / 7);
  const rate = completionRate(state, 7);
  const best = Math.max(0, ...Object.values(state.habits).map((h) => h.best));
  const rank = rankForXP(state.totalXP);

  const bookBlock =
    chunks.length > 0
      ? chunks.map((c) => `[${c.book} p.${c.page}] ${c.text.slice(0, 500)}`).join("\n\n")
      : "(no excerpts)";

  return `WEEK ${week} REPORT INPUT
Rank: ${rank.name}, total XP ${state.totalXP}
7-day completion rate: ${rate}%
Best streak this period: ${best}
Habits: ${Object.entries(state.habits).map(([id, h]) => `${id}(${h.streak})`).join(", ")}

Relevant book excerpts for grounding mindset/legend chapter:
${bookBlock}

Write the weekly transformation report as the JSON object. Tie the legend chapter to a real moment in a legend's life that parallels week ${week} of a comeback.`;
}
