import { AppState, BookChunk, DailyPlan, WeeklyReport } from "./types";
import { dayNumber, completionRate, todayStr, addDays } from "./store";
import { rankForXP, nextRank } from "./ranks";
import { diagnose } from "./diagnosis";
import { passagesFromDomainChunks } from "./retrieval";
import { buildIntelligentPlan } from "./intelligence";

// ============================================================
// LOCAL (no-AI) DAILY PLANNER
// Always works, no API key required. Delegates to the intelligence engine:
// diagnose the hunter, then build the plan from the passages the client pulled
// out of the books. No curriculum, no fixed weekly schedule — the books are
// the only source of truth. When an AI key is set, the route hands the same
// diagnosis + passages to the model to write the plan in richer prose.
// ============================================================

export function buildLocalPlan(
  state: AppState,
  domainChunks?: Record<string, BookChunk[]>
): DailyPlan {
  const dx = diagnose(state);
  const passages = passagesFromDomainChunks(domainChunks);
  return buildIntelligentPlan(state, dx, passages);
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
  const nxt = nextRank(state.totalXP);

  return {
    weekStart: addDays(todayStr(), -6),
    weekNumber: week,
    generatedBy: "local",
    physical:
      rate >= 70
        ? "Real adaptation is happening. Strength up, conditioning improving, body composition shifting if nutrition held."
        : "Inconsistent training stalls physical change. The body adapts to what you do REPEATEDLY. Tighten the gym + clean food streaks.",
    mental:
      rate >= 70
        ? "Discipline is becoming identity, not effort. Urges have less grip. Self-trust is climbing."
        : "Mental shifts require streaks. Each missed day resets the rewiring. Protect the discipline quest above all.",
    skills: `Maths and study reps are compounding — you advance the ladder by what you actually log, not the calendar.`,
    legendChapter:
      rate >= 70
        ? "You are living the early grind chapter — unknown, unglamorous, out-working everyone in the dark before the world notices."
        : "You are at the chapter every legend faced — the one where it's tempting to quit. The obstacle IS the way.",
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
  const today = todayStr();
  for (let i = 0; i < days; i++) {
    total += state.history[addDays(today, -i)]?.xpEarned || 0;
  }
  return total;
}
