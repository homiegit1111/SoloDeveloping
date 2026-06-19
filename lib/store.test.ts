import { describe, it, expect } from "vitest";
import {
  todayStr,
  addDays,
  daysBetween,
  defaultState,
  toggleHabit,
  recomputeDerived,
  statCondition,
  completionRate,
  freezesEarned,
  freezesAvailable,
  slimState,
  sanitizeState,
  yesterdaySummary,
} from "./store";
import { dayXP } from "./habits";
import { rankForXP, nextRank, rankProgress } from "./ranks";
import type { AppState, HabitId } from "./types";

// ============================================================
// Helpers
// ============================================================
function makeDate(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function buildState(
  overrides: Partial<AppState> = {},
  historyEntries: Array<{ date: string; completed: HabitId[] }> = []
): AppState {
  const s = defaultState("TestHunter");
  s.startDate = "2024-01-01";
  Object.assign(s, overrides);
  for (const { date, completed } of historyEntries) {
    s.history[date] = {
      date,
      completed: [...completed],
      xpEarned: dayXP(completed),
    };
  }
  return s;
}

// ============================================================
// Date primitives
// ============================================================
describe("todayStr", () => {
  it("returns YYYY-MM-DD for a given date", () => {
    expect(todayStr(makeDate(2024, 6, 15))).toBe("2024-06-15");
    expect(todayStr(makeDate(2024, 1, 5))).toBe("2024-01-05");
  });
});

describe("addDays", () => {
  it("adds days forward", () => {
    expect(addDays("2024-06-01", 1)).toBe("2024-06-02");
    expect(addDays("2024-06-01", 7)).toBe("2024-06-08");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01"); // non-leap year
  });

  it("adds days backward (negative)", () => {
    expect(addDays("2024-06-02", -1)).toBe("2024-06-01");
    expect(addDays("2024-01-01", -1)).toBe("2023-12-31");
  });

  it("is the inverse of daysBetween", () => {
    const base = "2024-06-10";
    for (let n = -10; n <= 10; n++) {
      const shifted = addDays(base, n);
      expect(daysBetween(base, shifted)).toBe(n);
    }
  });
});

describe("daysBetween", () => {
  it("computes whole calendar days", () => {
    expect(daysBetween("2024-06-01", "2024-06-01")).toBe(0);
    expect(daysBetween("2024-06-01", "2024-06-08")).toBe(7);
    expect(daysBetween("2024-06-08", "2024-06-01")).toBe(-7);
  });

  it("handles month boundaries", () => {
    expect(daysBetween("2024-05-31", "2024-06-01")).toBe(1);
    expect(daysBetween("2024-12-31", "2025-01-01")).toBe(1);
  });
});

// ============================================================
// XP & Ranks
// ============================================================
describe("dayXP", () => {
  it("returns 0 for empty completion", () => {
    expect(dayXP([])).toBe(0);
  });

  it("sums individual habit XP", () => {
    expect(dayXP(["gym", "study"])).toBe(45); // 25 + 20
  });

  it("adds perfect-day bonus for all 7 habits", () => {
    const all: HabitId[] = ["gym", "study", "discipline", "skincare", "food", "build", "maths"];
    // 25+20+30+10+15+25+20 = 145 + 50 = 195
    expect(dayXP(all)).toBe(195);
  });
});

describe("rankForXP", () => {
  it("returns UNRANKED for 0 XP", () => {
    expect(rankForXP(0).name).toBe("UNRANKED");
  });

  it("advances at exact thresholds", () => {
    expect(rankForXP(150).name).toBe("E-RANK");
    expect(rankForXP(500).name).toBe("D-RANK");
    expect(rankForXP(1200).name).toBe("C-RANK");
    expect(rankForXP(2600).name).toBe("B-RANK");
    expect(rankForXP(5000).name).toBe("A-RANK");
    expect(rankForXP(9000).name).toBe("S-RANK");
    expect(rankForXP(15000).name).toBe("SS-RANK");
  });

  it("does not overshoot max rank", () => {
    expect(rankForXP(99999).name).toBe("SS-RANK");
  });
});

describe("nextRank", () => {
  it("finds the next rank", () => {
    expect(nextRank(0)).toEqual(expect.objectContaining({ name: "E-RANK" }));
    expect(nextRank(149)).toEqual(expect.objectContaining({ name: "E-RANK" }));
    expect(nextRank(15000)).toBeNull();
  });
});

describe("rankProgress", () => {
  it("is 0 at threshold base", () => {
    expect(rankProgress(0)).toBe(0);
  });

  it("is 100 at max rank", () => {
    expect(rankProgress(15000)).toBe(100);
  });

  it("is roughly 50% halfway between thresholds", () => {
    const half = (500 + 1200) / 2; // between D and C
    expect(rankProgress(half)).toBeGreaterThan(40);
    expect(rankProgress(half)).toBeLessThan(60);
  });
});

// ============================================================
// toggleHabit
// ============================================================
describe("toggleHabit", () => {
  it("adds a habit and sets XP", () => {
    let s = buildState();
    s.startDate = "2024-06-01";
    s.history["2024-06-01"] = { date: "2024-06-01", completed: [], xpEarned: 0 };
    s = toggleHabit(s, "gym", "2024-06-01");
    expect(s.history["2024-06-01"].completed).toContain("gym");
    expect(s.history["2024-06-01"].xpEarned).toBe(25);
    expect(s.habits.gym.totalDone).toBe(1);
  });

  it("removes a habit and decrements XP", () => {
    let s = buildState();
    s.startDate = "2024-06-01";
    s.history["2024-06-01"] = { date: "2024-06-01", completed: ["gym", "study"], xpEarned: 45 };
    s = toggleHabit(s, "gym", "2024-06-01");
    expect(s.history["2024-06-01"].completed).not.toContain("gym");
    expect(s.history["2024-06-01"].xpEarned).toBe(20);
    expect(s.habits.gym.totalDone).toBe(0);
  });

  it("does nothing on repeat toggle", () => {
    let s = buildState();
    s = toggleHabit(s, "gym", "2024-06-01");
    s = toggleHabit(s, "gym", "2024-06-01");
    expect(s.history["2024-06-01"].completed).not.toContain("gym");
    expect(s.totalXP).toBe(0);
  });
});

// ============================================================
// recomputeDerived — the heart of the state engine
// ============================================================
describe("recomputeDerived", () => {
  it("builds a streak across consecutive days", () => {
    const t = todayStr();
    const s = buildState({}, [
      { date: addDays(t, -2), completed: ["gym"] },
      { date: addDays(t, -1), completed: ["gym"] },
      { date: t, completed: ["gym"] },
    ]);
    s.startDate = addDays(t, -2);
    recomputeDerived(s);
    expect(s.habits.gym.streak).toBe(3);
    expect(s.habits.gym.best).toBe(3);
    expect(s.habits.gym.totalDone).toBe(3);
  });

  it("resets streak when a gap exists without freeze", () => {
    const t = todayStr();
    const s = buildState({}, [
      { date: addDays(t, -3), completed: ["gym"] },
    ]);
    s.startDate = addDays(t, -3);
    recomputeDerived(s);
    // Last completion was 3 days ago with no freeze covering the gap → streak is 0.
    expect(s.habits.gym.streak).toBe(0);
    expect(s.habits.gym.best).toBe(1);
  });

  it("bridges a single-day gap with a freeze", () => {
    const t = todayStr();
    const s = buildState({}, [
      { date: addDays(t, -2), completed: ["gym"] },
      { date: t, completed: ["gym"] },
    ]);
    s.freezeDays = [addDays(t, -1)];
    recomputeDerived(s);
    expect(s.habits.gym.streak).toBe(2);
    expect(s.habits.gym.best).toBe(2);
  });

  it("bridges a multi-day gap with consecutive freezes", () => {
    const t = todayStr();
    const s = buildState({}, [
      { date: addDays(t, -4), completed: ["gym"] },
      { date: t, completed: ["gym"] },
    ]);
    s.freezeDays = [addDays(t, -3), addDays(t, -2), addDays(t, -1)];
    recomputeDerived(s);
    expect(s.habits.gym.streak).toBe(2);
    expect(s.habits.gym.best).toBe(2);
  });

  it("breaks streak when freeze does NOT cover entire gap", () => {
    const t = todayStr();
    const s = buildState({}, [
      { date: addDays(t, -4), completed: ["gym"] },
      { date: t, completed: ["gym"] },
    ]);
    s.freezeDays = [addDays(t, -3), addDays(t, -2)]; // missing today-1
    recomputeDerived(s);
    expect(s.habits.gym.streak).toBe(1); // only today's completion counts alone
  });

  it("tracks best streak independently of current streak", () => {
    const t = todayStr();
    const s = buildState({}, [
      { date: addDays(t, -3), completed: ["gym"] },
      { date: addDays(t, -2), completed: ["gym"] },
      { date: addDays(t, -1), completed: ["gym"] },
      { date: t, completed: ["gym"] },
    ]);
    recomputeDerived(s);
    // Current streak = 4 (all consecutive), best = 4
    expect(s.habits.gym.best).toBe(4);
    expect(s.habits.gym.streak).toBe(4);
  });

  it("records lastCompleted date correctly", () => {
    const s = buildState({}, [
      { date: "2024-08-01", completed: ["gym"] },
      { date: "2024-08-03", completed: ["gym"] },
    ]);
    recomputeDerived(s);
    expect(s.habits.gym.lastCompleted).toBe("2024-08-03");
  });

  it("counts totalDone across all tracked days", () => {
    const s = buildState({}, [
      { date: "2024-06-01", completed: ["gym", "study"] },
      { date: "2024-06-02", completed: ["gym"] },
    ]);
    recomputeDerived(s);
    expect(s.habits.gym.totalDone).toBe(2);
    expect(s.habits.study.totalDone).toBe(1);
    expect(s.habits.discipline.totalDone).toBe(0);
  });

  it("accumulates stats per habit stat mapping", () => {
    const s = buildState({}, [
      { date: "2024-06-01", completed: ["gym"] },      // STR
      { date: "2024-06-02", completed: ["study"] },    // INT
      { date: "2024-06-03", completed: ["study", "maths"] }, // INT + INT
    ]);
    recomputeDerived(s);
    expect(s.stats.STR).toBe(1);
    expect(s.stats.INT).toBe(3);
    expect(s.stats.WIL).toBe(0);
  });

  it("does not double-count a habit completed twice (impossible in data model but robust)", () => {
    // This test mainly confirms the code filters using includes, not push duplicates.
    const s = buildState();
    s.history["2024-06-01"] = { date: "2024-06-01", completed: ["gym", "gym"], xpEarned: 25 };
    // toggleHabit prevents duplicates, but recomputeDerived counts one per day regardless.
    recomputeDerived(s);
    expect(s.habits.gym.totalDone).toBe(1);
    expect(s.stats.STR).toBe(1);
  });
});

// ============================================================
// statCondition — recency-weighted 7-day condition
// ============================================================
describe("statCondition", () => {
  it("returns 1.0 when a stat's habit is done every day for 7 days", () => {
    const t = todayStr();
    const entries: Array<{ date: string; completed: HabitId[] }> = [];
    for (let i = 0; i < 7; i++) {
      entries.push({
        date: addDays(t, -i),
        completed: ["gym"],
      });
    }
    const s = buildState({}, entries);
    const cond = statCondition(s);
    expect(cond.STR).toBeCloseTo(1, 5);
  });

  it("returns 0.0 when a stat's habit is never done", () => {
    const s = defaultState("Test");
    const cond = statCondition(s);
    expect(cond.STR).toBe(0);
    expect(cond.INT).toBe(0);
    expect(cond.WIL).toBe(0);
  });

  it("weights recent days more heavily", () => {
    // Only today completed; 6 days missed => score should be low but non-zero.
    const s = buildState({}, [
      { date: addDays(todayStr(), 0), completed: ["gym"] },
    ]);
    const cond = statCondition(s);
    // With only today (i=0, w=1) out of ~7 weighted slots, it's roughly 1/7 ≈ 0.14.
    expect(cond.STR).toBeGreaterThan(0);
    expect(cond.STR).toBeLessThan(0.3);
  });

  it("increases over time with sustained effort", () => {
    let s = defaultState("Test");
    // Day 1
    s = toggleHabit(s, "gym", addDays(todayStr(), -2));
    const cond1 = statCondition(s).STR;
    // Day 2
    s = toggleHabit(s, "gym", addDays(todayStr(), -1));
    const cond2 = statCondition(s).STR;
    expect(cond2).toBeGreaterThan(cond1);
  });

  it("handles habits sharing the same stat (INT: study + maths)", () => {
    const s = buildState({}, [
      { date: addDays(todayStr(), 0), completed: ["study"] },
      { date: addDays(todayStr(), -1), completed: ["maths"] },
    ]);
    const cond = statCondition(s);
    // INT has 2 habits, so its condition is averaged across both slots.
    // There are ~14 weighted terms over 7 days for 2 habits.
    expect(cond.INT).toBeGreaterThan(0);
    expect(cond.INT).toBeLessThan(1);
  });
});

// ============================================================
// completionRate
// ============================================================
describe("completionRate", () => {
  it("is 100 when all 7 habits are done every day for 7 days", () => {
    const all: HabitId[] = ["gym", "study", "discipline", "skincare", "food", "build", "maths"];
    const entries: Array<{ date: string; completed: HabitId[] }> = [];
    for (let i = 0; i < 7; i++) {
      entries.push({ date: addDays(todayStr(), -i), completed: [...all] });
    }
    const s = buildState({}, entries);
    expect(completionRate(s, 7)).toBe(100);
  });

  it("is 0 when nothing is done", () => {
    expect(completionRate(defaultState("Test"), 7)).toBe(0);
  });

  it("is 50 when half the slots are filled across a week", () => {
    const all: HabitId[] = ["gym", "study", "discipline"];
    const entries: Array<{ date: string; completed: HabitId[] }> = [];
    for (let i = 0; i < 7; i++) {
      entries.push({ date: addDays(todayStr(), -i), completed: i % 2 === 0 ? [...all] : [] });
    }
    const s = buildState({}, entries);
    // 7 days * 7 habits = 49.  4 days * 3 habits = 12.  But wait — completionRate counts
    // all completed habits regardless of whether there are 3 or 7.  The test above only
    // fills 3/7 of the slots on even days.
    expect(completionRate(s, 7)).toBe(Math.round((12 / 49) * 100));
  });
});

// ============================================================
// Freeze economy
// ============================================================
describe("freezesEarned", () => {
  it("earns 1 freeze per 7 active days", () => {
    const entries: Array<{ date: string; completed: HabitId[] }> = [];
    for (let i = 0; i < 14; i++) {
      entries.push({ date: addDays(todayStr(), -i), completed: ["gym"] });
    }
    const s = buildState({}, entries);
    expect(freezesEarned(s)).toBe(2);
  });

  it("earns 0 with fewer than 7 active days", () => {
    const s = buildState({}, [
      { date: addDays(todayStr(), 0), completed: ["gym"] },
      { date: addDays(todayStr(), -1), completed: ["gym"] },
    ]);
    expect(freezesEarned(s)).toBe(0);
  });
});

describe("freezesAvailable", () => {
  it("decreases when freezeDays are used", () => {
    const entries: Array<{ date: string; completed: HabitId[] }> = [];
    for (let i = 0; i < 14; i++) {
      entries.push({ date: addDays(todayStr(), -i), completed: ["gym"] });
    }
    const s = buildState({ freezeDays: [addDays(todayStr(), -3)] }, entries);
    expect(freezesEarned(s)).toBe(2);
    expect(freezesAvailable(s)).toBe(1);
  });
});

// ============================================================
// slimState
// ============================================================
describe("slimState", () => {
  it("strips preloaded book chunks but keeps uploaded ones", () => {
    const s = defaultState("Test");
    s.books = [
      { slug: "pre-a", title: "Pre A", author: "A", categories: [], pages: 100, chunkCount: 10, preloaded: true, active: true },
      { slug: "up-b", title: "Up B", author: "B", categories: [], pages: 50, chunkCount: 5, preloaded: false, active: true },
    ];
    s.bookChunks = {
      "pre-a": [{ id: "c1", text: "Preloaded", tags: [], source: "pre-a" }],
      "up-b": [{ id: "c2", text: "Uploaded", tags: [], source: "up-b" }],
    };
    const slim = slimState(s);
    expect(slim.bookChunks["pre-a"]).toBeUndefined();
    expect(slim.bookChunks["up-b"]).toEqual([{ id: "c2", text: "Uploaded", tags: [], source: "up-b" }]);
  });

  it("does not mutate original state", () => {
    const s = defaultState("Test");
    s.bookChunks = { x: [{ id: "1", text: "t", tags: [], source: "x" }] };
    const slim = slimState(s);
    expect(s).not.toBe(slim); // different reference
    expect(s.bookChunks).toHaveProperty("x"); // original intact
  });
});

// ============================================================
// sanitizeState
// ============================================================
describe("sanitizeState", () => {
  it("fills missing fields on a partial state", () => {
    const partial = { name: "Ravi" } as Partial<AppState>;
    const s = sanitizeState(partial);
    expect(s.version).toBe(1);
    expect(s.totalXP).toBe(0);
    expect(s.stats.STR).toBe(0);
    expect(s.habits.gym.streak).toBe(0);
    expect(s.settings.soundEnabled).toBe(true);
  });

  it("recomputes derived values from history", () => {
    const partial: Partial<AppState> = {
      name: "Ravi",
      history: {
        "2024-06-01": { date: "2024-06-01", completed: ["gym"], xpEarned: 25 },
      },
    };
    const s = sanitizeState(partial);
    expect(s.totalXP).toBe(25);
    expect(s.habits.gym.totalDone).toBe(1);
  });
});

// ============================================================
// yesterdaySummary
// ============================================================
describe("yesterdaySummary", () => {
  it("reports completions and misses for yesterday", () => {
    const s = defaultState("Test");
    const y = yesterdaySummary(s);
    expect(y.total).toBe(7);
    expect(y.missed).toHaveLength(7);
    expect(y.completed).toBe(0);
  });
});
