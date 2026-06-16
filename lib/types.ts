// ============================================================
// Core types for the SoloDeveloping system
// ============================================================

export type HabitId =
  | "gym"
  | "study"
  | "discipline"
  | "skincare"
  | "food"
  | "build"
  | "maths";

export interface HabitDef {
  id: HabitId;
  label: string;
  short: string;
  icon: string;
  xp: number;
  stat: StatKey;
  blurb: string;
}

export type StatKey =
  | "STR" // strength  (gym)
  | "INT" // intellect (study, maths)
  | "WIL" // willpower (discipline)
  | "CHA" // charisma  (skincare, social)
  | "VIT" // vitality  (clean food)
  | "CRE"; // creation  (build)

// A single day's record
export interface DayRecord {
  date: string; // YYYY-MM-DD
  completed: HabitId[];
  xpEarned: number;
  note?: string;
}

export interface HabitState {
  streak: number;
  best: number;
  lastCompleted: string | null; // YYYY-MM-DD
  totalDone: number;
}

export interface AppState {
  version: number;
  name: string;
  startDate: string; // day 1
  totalXP: number;
  rankIndex: number;
  history: Record<string, DayRecord>; // keyed by date
  habits: Record<HabitId, HabitState>;
  stats: Record<StatKey, number>;
  unlocks: string[]; // unlocked reward ids
  lastPlanDate: string | null;
  plans: Record<string, DailyPlan>; // keyed by date
  reports: Record<string, WeeklyReport>; // keyed by week-start date
  books: BookMeta[]; // loaded books (preloaded + uploaded)
  bookChunks: Record<string, BookChunk[]>; // slug -> chunks (in localStorage)
  journal: Record<string, string>; // date -> one-line evening reflection
  freezeDays: string[]; // dates protected by a Streak Freeze (bridge the chain, no XP)
  settings: {
    aiEnabled: boolean;
    soundEnabled: boolean;
    remindersEnabled?: boolean; // browser notification opt-in
    reminderHour?: number; // 0-23, when to nudge (default 20)
  };
}

export interface BookChunk {
  id: string;
  book: string;
  page: number;
  text: string;
  tags: string[];
}

export interface BookMeta {
  slug: string;
  title: string;
  author: string;
  categories: string[];
  pages: number;
  chunkCount: number;
  preloaded?: boolean;
  active: boolean;
}

export interface Rank {
  index: number;
  name: string;
  title: string;
  threshold: number; // total XP required
  color: string;
  glow: string;
  aura: string;
  description: string;
}

export interface LegendQuote {
  legend: string;
  domain: string;
  text: string;
}

export interface PlanSource {
  book: string; // book title
  author: string;
  mentor?: string; // mentor key
  page?: number;
}

export type PlanSection = "gym" | "maths" | "skincare" | "communication" | "mindset";

export interface DailyPlan {
  date: string;
  generatedBy: "ai" | "local";
  greeting: string;
  verdictOnYesterday: string;
  focus: string;
  gym: { title: string; detail: string };
  maths: { title: string; detail: string };
  skincare: { title: string; detail: string };
  communication: { title: string; detail: string };
  mindset: { title: string; detail: string };
  legendStory: { legend: string; text: string };
  message: string; // brutal or motivating
  bookCitations?: { book: string; page: number }[];
  // ---- Intelligence layer (books are the only source of truth) ----
  diagnosis?: { phase: string; summary: string; archetype?: string };
  bossTask?: { title: string; detail: string; trigger: string; source?: PlanSource } | null;
  sources?: Partial<Record<PlanSection, PlanSource>>;
  usedChunkIds?: string[]; // chunk ids drawn today (STEP 6 never-repeat tracking)
  teachings?: string[]; // mentor keys used today (no same teaching 2 days running)
}

export interface WeeklyReport {
  weekStart: string;
  weekNumber: number;
  generatedBy: "ai" | "local";
  physical: string;
  mental: string;
  skills: string;
  legendChapter: string;
  verdict: string;
  nextWeekFocus: string;
  stats: { completionRate: number; xpGained: number; bestStreak: number };
}
