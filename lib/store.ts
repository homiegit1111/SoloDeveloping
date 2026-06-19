// Pure state helpers — safe to import on both server and client.
// localStorage access is guarded by `typeof window` checks.
import { AppState, DayRecord, HabitId, BookChunk, BookMeta, StatKey } from "./types";
import { ALL_HABIT_IDS, HABIT_BY_ID, dayXP } from "./habits";
import { rankForXP } from "./ranks";

const KEY = "solo-developing-state-v1";
export const STATE_VERSION = 1;

// LOCAL calendar date (YYYY-MM-DD). The app is single-user and lives in the
// user's timezone, so the day must roll at LOCAL midnight — never UTC midnight.
// (Using UTC caused an off-by-one for any timezone ahead of/behind UTC: e.g. in
// IST the day only flipped at 05:30 local, so early-morning quests logged to the
// previous day.) All day math below is anchored on this same local convention.
export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: string, b: string): number {
  // Parse both as LOCAL midnight so the difference is whole calendar days,
  // independent of timezone offset.
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
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
    journal: {},
    freezeDays: [],
    settings: { aiEnabled: true, soundEnabled: true, remindersEnabled: false, reminderHour: 20 },
  };
}

export function addDays(dateStr: string, n: number): string {
  // Operate in LOCAL time to stay consistent with daysBetween() and todayStr(),
  // which both anchor on local midnight — avoids timezone off-by-one bugs.
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    return sanitizeState(parsed);
  } catch {
    return defaultState();
  }
}

// Merge an arbitrary (possibly old or imported) state object onto a fresh
// default so newly-added fields are always present and never undefined.
export function sanitizeState(parsed: Partial<AppState>): AppState {
  const base = defaultState(parsed.name || "Ravi");
  const merged: AppState = {
    ...base,
    ...parsed,
    habits: { ...base.habits, ...(parsed.habits || {}) },
    stats: { ...base.stats, ...(parsed.stats || {}) },
    settings: { ...base.settings, ...(parsed.settings || {}) },
    history: parsed.history || {},
    plans: parsed.plans || {},
    reports: parsed.reports || {},
    books: parsed.books || [],
    bookChunks: parsed.bookChunks || {},
    journal: parsed.journal || {},
    freezeDays: Array.isArray(parsed.freezeDays) ? parsed.freezeDays : [],
    version: STATE_VERSION,
  };
  // Recompute all derived values from history so XP/streaks/stats are always correct.
  merged.totalXP = Object.values(merged.history).reduce((s, r) => s + (r.xpEarned || 0), 0);
  merged.rankIndex = rankForXP(merged.totalXP).index;
  recomputeDerived(merged);
  return merged;
}

// Strip preloaded book chunks from a state object. They can be several MB and
// are always re-fetchable from /books-data on load, so they never need to be
// persisted (localStorage) or synced (cloud) — only uploaded books' chunks do.
// This keeps us well under the ~5MB localStorage quota and keeps cloud saves tiny
// no matter how many preloaded books ship.
export function slimState(state: AppState): AppState {
  const preloadedSlugs = new Set(state.books.filter((b) => b.preloaded).map((b) => b.slug));
  const slimChunks: Record<string, BookChunk[]> = {};
  for (const [slug, chunks] of Object.entries(state.bookChunks)) {
    if (!preloadedSlugs.has(slug)) slimChunks[slug] = chunks;
  }
  return { ...state, bookChunks: slimChunks };
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const toSave: AppState = slimState(state);
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
  }, 400);
}

// Recompute streaks/XP/stats from a habit toggle for a given date (today only).
export function toggleHabit(state: AppState, habitId: HabitId, date = todayStr()): AppState {
  const rec: DayRecord = state.history[date] || { date, completed: [], xpEarned: 0 };
  const has = rec.completed.includes(habitId);
  const completed = has
    ? rec.completed.filter((h) => h !== habitId)
    : [...rec.completed, habitId];
  const nextRec: DayRecord = { ...rec, completed, xpEarned: dayXP(completed) };

  const next: AppState = {
    ...state,
    history: { ...state.history, [date]: nextRec },
    habits: { ...state.habits },
    stats: { ...state.stats },
  };

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
  const frozen = new Set(state.freezeDays || []);

  // A gap between two completion dates is "bridged" (doesn't break the streak)
  // if EVERY calendar day strictly between them is a Streak Freeze day.
  const bridged = (from: string, to: string): boolean => {
    const gap = daysBetween(from, to);
    if (gap <= 1) return true;
    for (let k = 1; k < gap; k++) {
      if (!frozen.has(addDays(from, k))) return false;
    }
    return true;
  };

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
        if (prev && bridged(prev, d)) streak += 1;
        else streak = 1;
        best = Math.max(best, streak);
        last = d;
        prev = d;
        const stat = HABIT_BY_ID[id].stat;
        state.stats[stat] += 1;
      }
    }
    // Current streak is broken only if the stretch from the last completion to
    // today is NOT fully covered by freeze days (today itself may still be open).
    const today = todayStr();
    if (last && daysBetween(last, today) > 1 && !bridged(last, today)) streak = 0;
    state.habits[id] = { streak, best, lastCompleted: last, totalDone: total };
  }
}

// ============================================================
// LIVING CONDITION MODEL
// The Hunter is alive: each stat has a "condition" (0..1) based on
// how consistently you've fed it in the last 7 days, recency-weighted.
// Neglect a quest → that stat's condition DECAYS toward 0 (he weakens
// there). Keep feeding it → it climbs toward 1 (he grows strong & blazes).
// This drives the character's aura, flames, pose, and the stat bars.
// ============================================================
const STAT_ORDER: StatKey[] = ["STR", "INT", "WIL", "CHA", "VIT", "CRE"];

export function statCondition(state: AppState): Record<StatKey, number> {
  const days = 7;
  const now = Date.now();
  const byStat: Partial<Record<StatKey, HabitId[]>> = {};
  for (const id of ALL_HABIT_IDS) {
    const s = HABIT_BY_ID[id].stat;
    (byStat[s] ||= []).push(id);
  }
  const out = {} as Record<StatKey, number>;
  for (const stat of STAT_ORDER) {
    const ids = byStat[stat] || [];
    if (!ids.length) { out[stat] = 0; continue; }
    let num = 0, den = 0;
    for (let i = 0; i < days; i++) {
      const d = todayStr(new Date(now - i * 86400000));
      const w = Math.pow(0.82, i); // recent days matter most
      const rec = state.history[d];
      for (const id of ids) {
        den += w;
        if (rec?.completed.includes(id)) num += w;
      }
    }
    out[stat] = den > 0 ? num / den : 0;
  }
  return out;
}

// Overall vitality 0..1 — average of stat conditions. Drives the Hunter's
// global aura/flame intensity and his weak↔strong pose.
export function overallCondition(state: AppState): number {
  const c = statCondition(state);
  const v = STAT_ORDER.map((s) => c[s]);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

// ----- Streak Freeze economy -----
// Earn 1 freeze for every 7 days on which at least one quest was completed.
export function freezesEarned(state: AppState): number {
  const activeDays = Object.values(state.history).filter((r) => r.completed.length > 0).length;
  return Math.floor(activeDays / 7);
}
export function freezesAvailable(state: AppState): number {
  return Math.max(0, freezesEarned(state) - (state.freezeDays?.length || 0));
}
export function isFrozen(state: AppState, date: string): boolean {
  return (state.freezeDays || []).includes(date);
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
  return { ...state, books, bookChunks: chunks };
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
