// ============================================================
// STEP 1 — READ THE HUNTER  +  STEP 2 — DIAGNOSE THE PATTERN
// Pure, no AI. This is the intelligence: before any book is opened we read the
// hunter's live state and name the real situation. Everything downstream
// (which books to open, what the plan and boss task become) flows from here.
// ============================================================
import { AppState, HabitId, DailyPlan } from "./types";
import { ALL_HABIT_IDS, HABIT_BY_ID } from "./habits";
import { rankForXP } from "./ranks";
import { dayNumber, yesterdaySummary, completionRate, todayStr } from "./store";
export type { Domain } from "./books";

export type Phase =
  | "onboarding" // brand new, everything overwhelming
  | "recovering" // came back after missing multiple days
  | "discipline_breaking" // strong physically, mind breaking on discipline
  | "plateau" // showing up daily but physically plateauing
  | "playing_safe" // doing well across the board but not pushing limits
  | "momentum"; // streaks climbing, rank advancing

export type Archetype = "King" | "Warrior" | "Magician" | "Lover";
export type GymStage = "adherence" | "volume" | "intensity" | "frequency" | "selection";

export interface Diagnosis {
  day: number;
  rank: string;
  rankIndex: number;
  phase: Phase;
  summary: string; // one human sentence describing the real situation
  archetype: Archetype;
  activeMentors: string[]; // mentor keys emphasised today
  // domain readouts
  gymStage: GymStage;
  trainingAge: number; // gym sessions completed
  studyLevel: number; // ladder index (0..)
  skincareLevel: number; // skincare sessions completed
  social: "isolating" | "steady" | "expanding";
  // raw reads (STEP 1)
  completion7: number;
  streaks: Record<HabitId, number>;
  mostMissed: HabitId[];
  completedYesterday: HabitId[];
  missedYesterday: HabitId[];
  // memory (STEP 6 inputs)
  recentTeachings: string[]; // mentor keys used in the last 1-2 plans
  usedChunkIds: string[]; // chunk ids used in the last 7 plans
  bossReady: boolean;
}

const STUDY_HABITS: HabitId[] = ["study", "maths"];

function recentPlans(state: AppState, days: number): DailyPlan[] {
  const plans = Object.values(state.plans || {});
  const cutoff = todayStr(new Date(Date.now() - days * 86400000));
  return plans
    .filter((p) => p.date >= cutoff)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function activeDayCount(state: AppState): number {
  return Object.values(state.history).filter((r) => r.completed.length > 0).length;
}

// how many of the last `n` days had ZERO completions
function recentZeroDays(state: AppState, n: number): number {
  let zero = 0;
  for (let i = 1; i <= n; i++) {
    const d = todayStr(new Date(Date.now() - i * 86400000));
    const rec = state.history[d];
    if (!rec || rec.completed.length === 0) zero++;
  }
  return zero;
}

function missCounts(state: AppState, days = 14): Record<HabitId, number> {
  const counts = {} as Record<HabitId, number>;
  for (const id of ALL_HABIT_IDS) counts[id] = 0;
  for (let i = 1; i <= days; i++) {
    const d = todayStr(new Date(Date.now() - i * 86400000));
    const rec = state.history[d];
    // only count days that exist in history (he was "in the system")
    if (!rec) continue;
    for (const id of ALL_HABIT_IDS) if (!rec.completed.includes(id)) counts[id]++;
  }
  return counts;
}

function gymStageFor(trainingAge: number): GymStage {
  if (trainingAge < 7) return "adherence";
  if (trainingAge < 21) return "volume";
  if (trainingAge < 45) return "intensity";
  if (trainingAge < 75) return "frequency";
  return "selection";
}

export function diagnose(state: AppState): Diagnosis {
  const day = dayNumber(state);
  const rankObj = rankForXP(state.totalXP);
  const y = yesterdaySummary(state);
  const completion7 = completionRate(state, 7);

  const streaks = {} as Record<HabitId, number>;
  for (const id of ALL_HABIT_IDS) streaks[id] = state.habits[id]?.streak || 0;

  const counts = missCounts(state, 14);
  const mostMissed = [...ALL_HABIT_IDS]
    .sort((a, b) => counts[b] - counts[a])
    .filter((id) => counts[id] > 0)
    .slice(0, 3);

  const trainingAge = state.habits.gym?.totalDone || 0;
  const skincareLevel = state.habits.skincare?.totalDone || 0;
  const studyDone = (state.habits.study?.totalDone || 0) + (state.habits.maths?.totalDone || 0);
  const studyLevel = Math.floor(studyDone / 4); // advances with reps done, not the calendar

  const gymStreak = streaks.gym;
  const disciplineStreak = streaks.discipline;
  const activeDays = activeDayCount(state);
  const zero3 = recentZeroDays(state, 3);

  // ---- STEP 2: classify the real situation (priority order matters) ----
  let phase: Phase;
  if (day <= 3 || activeDays < 3) {
    phase = "onboarding";
  } else if (zero3 >= 2) {
    phase = "recovering";
  } else if (gymStreak >= 4 && (disciplineStreak <= 1 || mostMissed.includes("discipline"))) {
    phase = "discipline_breaking";
  } else if (completion7 >= 88 && trainingAge >= 7) {
    phase = "playing_safe";
  } else if (gymStreak >= 10 && completion7 >= 70) {
    phase = "plateau";
  } else {
    phase = "momentum";
  }

  // ---- archetype (Moore) ----
  const studyIsWeak = mostMissed.includes("study") || mostMissed.includes("maths");
  let archetype: Archetype;
  if (phase === "onboarding" || phase === "recovering") archetype = "King"; // order, calm, foundation
  else if (phase === "discipline_breaking" || phase === "plateau") archetype = "Warrior"; // disciplined aggression
  else if (studyIsWeak) archetype = "Magician"; // mastery through study
  else if (phase === "playing_safe") archetype = "King"; // ready to bless/build, then escalate
  else archetype = completion7 < 50 ? "Lover" : "Warrior";

  // ---- which mentors lead today ----
  const mentors = new Set<string>();
  switch (phase) {
    case "onboarding":
      ["helms", "matthews", "moore"].forEach((m) => mentors.add(m));
      break;
    case "recovering":
      ["goggins", "matthews", "moore"].forEach((m) => mentors.add(m));
      break;
    case "discipline_breaking":
      ["goggins", "moore"].forEach((m) => mentors.add(m));
      break;
    case "plateau":
      ["schoenfeld", "helms", "goggins"].forEach((m) => mentors.add(m));
      break;
    case "playing_safe":
      ["goggins", "moore", "schoenfeld"].forEach((m) => mentors.add(m));
      break;
    case "momentum":
      ["schoenfeld", "helms", "moore"].forEach((m) => mentors.add(m));
      break;
  }

  // social signal — no dedicated social quest exists, so infer from overall
  // engagement (isolation shows up as collapse across the board).
  const social: Diagnosis["social"] =
    completion7 < 40 ? "isolating" : completion7 > 75 ? "expanding" : "steady";
  if (social === "isolating") mentors.add("glover");
  mentors.add("aristotle"); // study mindset always present
  mentors.add("ssc");
  mentors.add("vargas");

  // ---- memory for never-repeat (STEP 6) ----
  const last7 = recentPlans(state, 7);
  const usedChunkIds = Array.from(new Set(last7.flatMap((p) => p.usedChunkIds || [])));
  const recentTeachings = Array.from(
    new Set(recentPlans(state, 2).flatMap((p) => p.teachings || []))
  );

  const bossReady =
    day >= 5 &&
    (phase === "momentum" || phase === "playing_safe" || phase === "plateau" || phase === "discipline_breaking");

  const summary = buildSummary(phase, { day, rank: rankObj.name, completion7, gymStreak, disciplineStreak, mostMissed });

  return {
    day,
    rank: rankObj.name,
    rankIndex: rankObj.index,
    phase,
    summary,
    archetype,
    activeMentors: Array.from(mentors),
    gymStage: gymStageFor(trainingAge),
    trainingAge,
    studyLevel,
    skincareLevel,
    social,
    completion7,
    streaks,
    mostMissed,
    completedYesterday: y.completed > 0 ? ALL_HABIT_IDS.filter((id) => !y.missed.includes(id)) : [],
    missedYesterday: y.missed,
    recentTeachings,
    usedChunkIds,
    bossReady,
  };
}

function buildSummary(
  phase: Phase,
  d: { day: number; rank: string; completion7: number; gymStreak: number; disciplineStreak: number; mostMissed: HabitId[] }
): string {
  const missed = d.mostMissed.map((m) => HABIT_BY_ID[m]?.short || m).join(", ");
  switch (phase) {
    case "onboarding":
      return `Day ${d.day}. Everything is new. The only job is to build the smallest possible win and show up — adherence before all else.`;
    case "recovering":
      return `You missed multiple days. The rule now is the only rule: never miss twice. One small disciplined action — not a grand gesture.`;
    case "discipline_breaking":
      return `Body is showing up (gym streak ${d.gymStreak}) but the mind is breaking on discipline. This is a 40%-rule day — the body is far from done.`;
    case "plateau":
      return `You show up every day but you've plateaued. Time for progressive overload — add tension, not just reps.`;
    case "playing_safe":
      return `${d.completion7}% across the board — strong, but safe. Legends never consolidated when they could advance. Time to escalate.`;
    case "momentum":
    default:
      return `Momentum is real (${d.completion7}% this week). Now we go deeper — the next level of hard.`;
  }
}
