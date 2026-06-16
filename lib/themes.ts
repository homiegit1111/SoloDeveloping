// ============================================================
// THEME OF THE DAY
// Rotates the spotlight across all 9 legend voices + the full book
// library over a 9-day cycle, so the daily planner's book retrieval
// surfaces every domain (gym, identity/purpose, toughness, social,
// wisdom, habits, grooming, ambition) instead of the same few.
// ============================================================

import { LegendKey } from "./legends";

export interface DayTheme {
  key: string;
  label: string;
  icon: string;
  legend: LegendKey;
  legendName: string;
  // extra retrieval terms injected into the daily book search
  query: string;
  // one-line framing shown in the UI + fed to the AI
  intent: string;
}

const THEMES: Omit<DayTheme, "legendName">[] = [
  {
    key: "body",
    label: "Body & Iron",
    icon: "",
    legend: "arnold",
    query:
      "gym training muscle strength hypertrophy volume reps sets progression rest nutrition protein recovery deload",
    intent: "Forge the body. Earn every rep — the last ones build the man.",
  },
  {
    key: "discipline",
    label: "The Warrior's Discipline",
    icon: "",
    legend: "marcus",
    query:
      "discipline urge control willpower desire temptation focus stoic warrior aggression restraint nofap self-mastery",
    intent: "Master the urge. Disciplined aggression aimed at a worthy goal.",
  },
  {
    key: "identity",
    label: "Identity & Purpose",
    icon: "",
    legend: "moore",
    query:
      "king warrior magician lover archetype masculine identity purpose maturity manhood boyhood initiation blessing order",
    intent: "Step out of boy psychology. Claim the mature king within.",
  },
  {
    key: "toughness",
    label: "Mental Toughness",
    icon: "",
    legend: "goggins",
    query:
      "pain suffering hard mental toughness callus mind 40 percent accountability mirror cookie jar take souls stay hard",
    intent: "Callus the mind. You're at 40% — reach for the rest.",
  },
  {
    key: "social",
    label: "Presence & Boundaries",
    icon: "",
    legend: "glover",
    query:
      "social confidence boundaries assertive needs approval nice guy covert contract relationship communication integrity",
    intent: "Drop approval-seeking. Make your needs a priority. Set the boundary.",
  },
  {
    key: "wisdom",
    label: "Wisdom & Study",
    icon: "",
    legend: "aristotle",
    query:
      "virtue character wisdom study habit excellence golden mean knowledge learning maths reason self-mastery courage",
    intent: "Excellence is a habit. Sit with the bitter root of study.",
  },
  {
    key: "habits",
    label: "Habits & Systems",
    icon: "",
    legend: "clear",
    query:
      "habit system identity small consistent compound streak routine vote trajectory never miss twice atomic",
    intent: "You fall to the level of your systems. Cast a good vote today.",
  },
  {
    key: "presence",
    label: "Skin & Presence",
    icon: "",
    legend: "glover",
    query:
      "skincare skin glow grooming hygiene cleanse moisturise SPF appearance presence grooming barber posture confidence",
    intent: "Look like the man you're becoming. Presence is a discipline.",
  },
  {
    key: "ambition",
    label: "Ambition & The Long War",
    icon: "",
    legend: "alexander",
    query:
      "ambition conquer empire fear lead vision legacy battlefield courage destiny relentless march purpose",
    intent: "The battlefield is your day. Take the ground in front of you.",
  },
];

// Stable rotation by day number (1-indexed). All 9 surface every 9 days.
export function themeForDay(day: number): DayTheme {
  const idx = ((Math.max(1, day) - 1) % THEMES.length + THEMES.length) % THEMES.length;
  const t = THEMES[idx];
  // legendName filled in by caller via LEGENDS to avoid a circular import here
  return { ...t, legendName: "" };
}

export const THEME_COUNT = THEMES.length;
