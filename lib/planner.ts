import { AppState, BookChunk, DailyPlan, WeeklyReport } from "./types";
import { mathsForDay } from "../data/curriculum/maths";
import { communicationForDay } from "../data/curriculum/communication";
import { skincareTipForDay, isExfoliationDay } from "../data/curriculum/skincare";
import { gymForDay } from "../data/curriculum/gym";
import { LEGEND_LINES, LEGENDS, legendForFocus, pick } from "./legends";
import { dayNumber, yesterdaySummary, completionRate } from "./store";
import { rankForXP, nextRank } from "./ranks";

// ============================================================
// LOCAL (rule-based) DAILY PLANNER
// Always works, no API key required. The AI route uses this as a
// scaffold and rewrites the prose + injects real book quotes.
// ============================================================

// Trim a raw book chunk into a clean, readable passage that ends on a sentence.
function cleanPassage(text: string, max = 300): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  t = t.slice(0, max);
  const lastStop = Math.max(t.lastIndexOf(". "), t.lastIndexOf("! "), t.lastIndexOf("? "));
  if (lastStop > 120) t = t.slice(0, lastStop + 1);
  return t.trim() + (t.endsWith(".") || t.endsWith("!") || t.endsWith("?") ? "" : "…");
}

export function buildLocalPlan(state: AppState, chunks: BookChunk[] = []): DailyPlan {
  const day = dayNumber(state);
  const seed = day + state.totalXP;
  const y = yesterdaySummary(state);
  const rank = rankForXP(state.totalXP);
  const incompleteYesterday = y.completed < y.total && Object.keys(state.history).length > 0;

  const gym = gymForDay(day);
  const maths = mathsForDay(day);
  const comm = communicationForDay(day);

  // pick a focus = the habit with the weakest streak
  const weakest = Object.entries(state.habits).sort((a, b) => a[1].streak - b[1].streak)[0];
  const focusKey = weakest ? weakest[0] : "discipline";
  const legendKey = legendForFocus(focusKey);

  const greeting = incompleteYesterday
    ? `Day ${day}, ${state.name}. Yesterday you left ${y.missed.length} quest(s) undone. The System remembers. Today you correct it.`
    : `Day ${day}, ${state.name}. Rank ${rank.name}. The gate is open. Step through.`;

  const verdict = incompleteYesterday
    ? `Incomplete. Missed: ${y.missed.join(", ")}. No excuses logged — only results. Reclaim the streak today.`
    : Object.keys(state.history).length === 0
    ? `This is the beginning. There is no yesterday to judge. There is only the man you start building right now.`
    : `Yesterday was complete. ${y.completed}/${y.total} quests cleared. This is how Monarchs are made — one full day at a time.`;

  const exfoNote = isExfoliationDay(day) ? " Tonight is an EXFOLIATION night (gentle, 2-3×/week)." : "";

  const message = incompleteYesterday
    ? pick(LEGEND_LINES.goggins, seed)
    : pick(LEGEND_LINES[legendKey], seed);

  // ---- REAL book quotes (no AI needed) ----
  // The client passes relevant passages from the user's actual uploaded books.
  // When present, weave a genuine passage + page citations into the plan so the
  // "without AI" experience still draws on the real books.
  const hasBooks = Array.isArray(chunks) && chunks.length > 0;
  const top = hasBooks ? chunks[0] : null;
  const legendStory = top
    ? { legend: top.book, text: cleanPassage(top.text) }
    : { legend: LEGENDS[legendKey].name, text: pick(LEGEND_LINES[legendKey], seed + 2) };
  const mindsetDetail = top
    ? `${pick(LEGEND_LINES[legendKey], seed + 1)}\n\nFrom your library — ${top.book} (p.${top.page}): "${cleanPassage(top.text, 220)}"`
    : pick(LEGEND_LINES[legendKey], seed + 1);
  const citations = hasBooks
    ? chunks.slice(0, 4).map((c) => ({ book: c.book, page: c.page }))
    : undefined;

  return {
    date: new Date().toISOString().slice(0, 10),
    generatedBy: "local",
    greeting,
    verdictOnYesterday: verdict,
    focus: `Primary focus: ${focusKey.toUpperCase()} (your weakest streak). Bring it back to life today.`,
    gym: {
      title: `${gym.day} — ${gym.focus}`,
      detail: `Warmup: ${gym.warmup}\n` + gym.exercises.map((e) => `• ${e.name}: ${e.sets}×${e.reps}, rest ${e.rest}. ${e.form}`).join("\n") + (gym.finisher ? `\nFinisher: ${gym.finisher}` : ""),
    },
    maths: {
      title: `${maths.unit} — ${maths.title}`,
      detail: `${maths.lesson}\nExample: ${maths.example}\nPractice:\n` + maths.practice.map((p, i) => `${i + 1}. ${p.q}  (ans: ${p.a})`).join("\n"),
    },
    skincare: {
      title: "AM: Cleanse → Moisturise → SPF. PM: Cleanse → (Treat) → Moisturise." + exfoNote,
      detail: `Glow tip: ${skincareTipForDay(day)}`,
    },
    communication: {
      title: `${comm.unit} — ${comm.skill}`,
      detail: `Why: ${comm.why}\nToday's drill: ${comm.exercise}${comm.phrase ? `\nDeploy: ${comm.phrase}` : ""}`,
    },
    mindset: {
      title: `Lesson from ${LEGENDS[legendKey].name}`,
      detail: mindsetDetail,
    },
    legendStory,
    message,
    bookCitations: citations,
  };
}

// ============================================================
// LOCAL WEEKLY REPORT
// ============================================================
export function buildLocalReport(state: AppState): WeeklyReport {
  const day = dayNumber(state);
  const week = Math.ceil(day / 7);
  const rate = completionRate(state, 7);
  const xpWeek = sumLastDaysXP(state, 7);
  const bestStreak = Math.max(0, ...Object.values(state.habits).map((h) => h.best));
  const rank = rankForXP(state.totalXP);
  const nxt = nextRank(state.totalXP);

  return {
    weekStart: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    weekNumber: week,
    generatedBy: "local",
    physical:
      rate >= 70
        ? "Real adaptation is happening. Strength up, conditioning improving, body composition shifting if nutrition held. Sleep and recovery are compounding."
        : "Inconsistent training stalls physical change. The body adapts to what you do REPEATEDLY. Tighten the gym + clean food streaks.",
    mental:
      rate >= 70
        ? "Discipline is becoming identity, not effort. Urges have less grip. Focus and self-trust are climbing."
        : "Mental shifts require streaks. Each missed day resets the rewiring. Protect the discipline quest above all.",
    skills: `Maths and communication advanced ~${Math.min(7, day)} topics this week. English/social reps are accumulating — fluency follows volume.`,
    legendChapter:
      rate >= 70
        ? "You are living the EARLY ARNOLD chapter — unknown, unglamorous, but out-working everyone in the dark gym before the world notices."
        : "You are at the chapter every legend faced — the one where it's tempting to quit. Marcus Aurelius would tell you: the obstacle IS the way.",
    verdict:
      rate >= 85
        ? "ELITE WEEK. This is championship behaviour."
        : rate >= 60
        ? "SOLID. The trajectory is upward. Sharpen the weak quests."
        : "WEAK WEEK. The System is unimpressed. Next week is a referendum on whether you're serious.",
    nextWeekFocus: nxt
      ? `Push toward ${nxt.name} (${nxt.threshold - state.totalXP} XP to go). Lock the weakest habit's streak to 7/7.`
      : "You are at the summit rank. Now the mission is to never become who you were.",
    stats: { completionRate: rate, xpGained: xpWeek, bestStreak },
  };
}

function sumLastDaysXP(state: AppState, days: number): number {
  let total = 0;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
    total += state.history[d]?.xpEarned || 0;
  }
  return total;
}
