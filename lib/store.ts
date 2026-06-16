// Pure state helpers — safe to import on both server and client.
// localStorage access is guarded by `typeof window` checks.
import { AppState, DayRecord, HabitId, BookChunk, BookMeta } from "./types";
import { ALL_HABIT_IDS, HABIT_BY_ID, dayXP } from "./habits";
import { rankForXP } from "./ranks";

const KEY = "solo-developing-state-v1";
export const STATE_VERSION = 1;

export function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86400000);
}

export function dayNumber(state: AppState): number {
  return daysBetween(state.startDate, todayStr()) + 1;
}

export function defaultState(name = "Ravi"): AppState {
  const habits = {} as AppState["habits"];
  for (const id of ALL_HABIT_IDS) {
    habits[id] = { streak: 0, best: 0, lastCompleted: null, totalDone: 0 };
  }
  return {
    version: STATE_VERSION,
    name,
    startDate: todayStr(),
    totalXP: 0,
    rankIndex: 0,
    history: {},
    habits,
    stats: { STR: 0, INT: 0, WIL: 0, CHA: 0, VIT: 0, CRE: 0 },
    unlocks: [],
    lastPlanDate: null,
    plans: {},
    reports: {},
    books: [],
    bookChunks: {},
    settings: { aiEnabled: true, soundEnabled: true },
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    // shallow migration safety
    const base = defaultState(parsed.name || "Ravi");
    return { ...base, ...parsed, habits: { ...base.habits, ...parsed.habits }, stats: { ...base.stats, ...parsed.stats } };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  // Preloaded book chunks (Aristotle, Goggins, BBLS, etc.) can be several MB and
  // are always re-fetchable from /books-data on load, so we never persist them —
  // only uploaded books' chunks. This keeps us well under the ~5MB localStorage quota
  // no matter how many preloaded books ship.
  const preloadedSlugs = new Set(state.books.filter((b) => b.preloaded).map((b) => b.slug));
  const slimChunks: Record<string, BookChunk[]> = {};
  for (const [slug, chunks] of Object.entries(state.bookChunks)) {
    if (!preloadedSlugs.has(slug)) slimChunks[slug] = chunks;
  }
  const toSave: AppState = { ...state, bookChunks: slimChunks };
  try {
    localStorage.setItem(KEY, JSON.stringify(toSave));
  } catch (e) {
    // QuotaExceededError or similar — retry once without any book chunks so the
    // user's actual progress (habits/XP/streaks) is never lost.
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...toSave, bookChunks: {} }));
    } catch {
      /* give up silently — progress already in memory for this session */
    }
  }
}

// Recompute streaks/XP/stats from a habit toggle for a given date (today only).
export function toggleHabit(state: AppState, habitId: HabitId, date = todayStr()): AppState {
  const next: AppState = JSON.parse(JSON.stringify(state));
  const rec: DayRecord = next.history[date] || { date, completed: [], xpEarned: 0 };
  const has = rec.completed.includes(habitId);

  if (has) {
    rec.completed = rec.completed.filter((h) => h !== habitId);
  } else {
    rec.completed.push(habitId);
  }
  rec.xpEarned = dayXP(rec.completed);
  next.history[date] = rec;

  // Recompute total XP from all history (source of truth)
  next.totalXP = Object.values(next.history).reduce((s, r) => s + r.xpEarned, 0);
  next.rankIndex = rankForXP(next.totalXP).index;

  // Recompute stats & habit streaks from scratch (robust + simple)
  recomputeDerived(next);
  return next;
}

export function recomputeDerived(state: AppState) {
  // reset
  for (const id of ALL_HABIT_IDS) {
    state.habits[id] = { streak: 0, best: 0, lastCompleted: null, totalDone: 0 };
  }
  state.stats = { STR: 0, INT: 0, WIL: 0, CHA: 0, VIT: 0, CRE: 0 };

  const dates = Object.keys(state.history).sort();
  for (const id of ALL_HABIT_IDS) {
    let streak = 0;
    let best = 0;
    let last: string | null = null;
    let total = 0;
    let prev: string | null = null;
    for (const d of dates) {
      const done = state.history[d].completed.includes(id);
      if (done) {
        total += 1;
        if (prev && daysBetween(prev, d) === 1) streak += 1;
        else streak = 1;
        best = Math.max(best, streak);
        last = d;
        prev = d;
        const stat = HABIT_BY_ID[id].stat;
        state.stats[stat] += 1;
      }
    }
    // If the most recent completion isn't today/yesterday, current streak is broken
    const today = todayStr();
    if (last && daysBetween(last, today) > 1) streak = 0;
    state.habits[id] = { streak, best, lastCompleted: last, totalDone: total };
  }
}

export function isCompleted(state: AppState, habitId: HabitId, date = todayStr()): boolean {
  return !!state.history[date]?.completed.includes(habitId);
}

export function completionRate(state: AppState, days = 7): number {
  const today = new Date();
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = todayStr(new Date(today.getTime() - i * 86400000));
    done += state.history[d]?.completed.length || 0;
  }
  return Math.round((done / (days * ALL_HABIT_IDS.length)) * 100);
}

// Did the user miss yesterday? (used for punishment trigger)
export function yesterdaySummary(state: AppState): { date: string; completed: number; total: number; missed: HabitId[] } {
  const y = todayStr(new Date(Date.now() - 86400000));
  const rec = state.history[y];
  const completed = rec?.completed.length || 0;
  const missed = ALL_HABIT_IDS.filter((id) => !rec?.completed.includes(id));
  return { date: y, completed, total: ALL_HABIT_IDS.length, missed };
}

// Book helpers
export function setBooks(state: AppState, books: BookMeta[], chunks: Record<string, BookChunk[]>): AppState {
  const next: AppState = JSON.parse(JSON.stringify(state));
  next.books = books;
  next.bookChunks = chunks;
  return next;
}

export function activeChunks(state: AppState): BookChunk[] {
  const out: BookChunk[] = [];
  for (const b of state.books) {
    if (b.active && state.bookChunks[b.slug]) out.push(...state.bookChunks[b.slug]);
  }
  return out;
}

// Naive keyword retrieval over active book chunks (client-side, localStorage)
export function retrieveChunks(state: AppState, query: string, k = 6): BookChunk[] {
  const chunks = activeChunks(state);
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
  const scored = chunks.map((c) => {
    const low = c.text.toLowerCase();
    let score = 0;
    for (const t of terms) score += low.split(t).length - 1;
    // light boost for matching tags
    for (const tag of c.tags) if (query.toLowerCase().includes(tag)) score += 3;
    return { c, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.c);
}
