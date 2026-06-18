import { HabitDef, HabitId, StatKey } from "./types";

// ============================================================
// THE 7 DAILY HABITS — Ravi's daily quests
// Each grants XP and feeds a core stat.
// ============================================================

export const HABITS: HabitDef[] = [
  {
    id: "gym",
    label: "Gym",
    short: "Train",
    icon: "🏋️",
    xp: 25,
    stat: "STR",
    blurb: "Forge the body. Iron never lies.",
  },
  {
    id: "study",
    label: "Study",
    short: "Study",
    icon: "📖",
    xp: 20,
    stat: "INT",
    blurb: "Sharpen the mind. Knowledge compounds.",
  },
  {
    id: "discipline",
    label: "Discipline",
    short: "Discipline",
    icon: "🛡️",
    xp: 30,
    stat: "WIL",
    blurb: "Master the urge, master the man.",
  },
  {
    id: "skincare",
    label: "Skincare",
    short: "Skincare",
    icon: "✨",
    xp: 10,
    stat: "CHA",
    blurb: "Become ready. Present your best face.",
  },
  {
    id: "food",
    label: "Clean Food",
    short: "Clean Food",
    icon: "🥗",
    xp: 15,
    stat: "VIT",
    blurb: "Fuel the machine. Greens feed the glow.",
  },
  {
    id: "build",
    label: "Build",
    short: "Build",
    icon: "⚒️",
    xp: 25,
    stat: "CRE",
    blurb: "Create value. Build the weapon that pays.",
  },
  {
    id: "maths",
    label: "Learn & Grow",
    short: "Learn",
    icon: "🧠",
    xp: 20,
    stat: "INT",
    blurb: "One hour of deep learning. Compound the mind.",
  },
];

export const HABIT_BY_ID: Record<HabitId, HabitDef> = HABITS.reduce(
  (acc, h) => {
    acc[h.id] = h;
    return acc;
  },
  {} as Record<HabitId, HabitDef>,
);

export const STAT_LABELS: Record<StatKey, { name: string; icon: string }> = {
  STR: { name: "Strength", icon: "💪" },
  INT: { name: "Intellect", icon: "🧠" },
  WIL: { name: "Willpower", icon: "🛡️" },
  CHA: { name: "Charisma", icon: "🌟" },
  VIT: { name: "Vitality", icon: "❤️" },
  CRE: { name: "Creation", icon: "⚒️" },
};

export const ALL_HABIT_IDS: HabitId[] = HABITS.map((h) => h.id);

// Daily streak bonus: completing ALL 7 habits grants a perfect-day bonus
export const PERFECT_DAY_BONUS = 50;

export function dayXP(completed: HabitId[]): number {
  let xp = completed.reduce((sum, id) => sum + (HABIT_BY_ID[id]?.xp ?? 0), 0);
  if (completed.length === ALL_HABIT_IDS.length) xp += PERFECT_DAY_BONUS;
  return xp;
}
