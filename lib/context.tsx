"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AppState, HabitId, BookMeta, BookChunk, DailyPlan, WeeklyReport } from "./types";
import {
  loadState,
  saveState,
  defaultState,
  toggleHabit,
  togglePlanCompletion,
  todayStr,
  retrieveChunks,
  sanitizeState,
  recomputeDerived,
} from "./store";

interface Ctx {
  state: AppState;
  ready: boolean;
  toggle: (id: HabitId) => void;
  update: (patch: Partial<AppState>) => void;
  setBooks: (books: BookMeta[], chunks: Record<string, BookChunk[]>) => void;
  savePlan: (plan: DailyPlan) => void;
  saveReport: (report: WeeklyReport) => void;
  reset: () => void;
  retrieve: (query: string, k?: number) => BookChunk[];
  setJournal: (date: string, text: string) => void;
  applyFreeze: (date: string) => void;
  removeFreeze: (date: string) => void;
  togglePlanCompletion: (date: string, stepId: string) => void;
  importState: (raw: unknown) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  // Hydrate preloaded book chunks into memory on startup. They are intentionally
  // NOT persisted to localStorage (see saveState), so we always re-fetch them here.
  // This runs app-wide (not just on the Books tab) so the AI planner/report can
  // always retrieve from them.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const idx: { books: { slug: string; title: string; author: string; categories: string[]; pages: number; chunkCount: number; file: string; preloaded: boolean }[] } = await fetch("/books-data/index.json").then((r) => r.json());
        const metas: BookMeta[] = [];
        const chunks: Record<string, BookChunk[]> = {};
        // Fetch every book in PARALLEL — sequential awaits made cold start scale
        // linearly with book count (10 books = 10 round-trips back-to-back).
        const loaded = await Promise.all(
          idx.books.map(async (b) => {
            try {
              const data = await fetch(`/books-data/${b.file}`).then((r) => r.json());
              return { b, chunks: (data.chunks as BookChunk[]) || [] };
            } catch {
              return { b, chunks: [] as BookChunk[] };
            }
          }),
        );
        if (cancelled) return;
        for (const { b, chunks: ch } of loaded) {
          metas.push({
            slug: b.slug,
            title: b.title,
            author: b.author,
            categories: b.categories,
            pages: b.pages,
            chunkCount: b.chunkCount,
            preloaded: true,
            active: true,
          });
          chunks[b.slug] = ch;
        }
        setState((s) => {
          // Preserve the user's active/inactive choice for already-known books.
          const known = new Map(s.books.map((b) => [b.slug, b]));
          const mergedMetas = metas.map((m) => {
            const prev = known.get(m.slug);
            return prev ? { ...m, active: prev.active } : m;
          });
          const uploaded = s.books.filter((b) => !b.preloaded);
          return { ...s, books: [...mergedMetas, ...uploaded], bookChunks: { ...s.bookChunks, ...chunks } };
        });
      } catch {
        /* preloaded books are optional — ignore fetch errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const toggle = useCallback((id: HabitId) => {
    setState((s) => toggleHabit(s, id));
  }, []);

  const update = useCallback((patch: Partial<AppState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const setBooks = useCallback((books: BookMeta[], chunks: Record<string, BookChunk[]>) => {
    setState((s) => ({ ...s, books, bookChunks: { ...s.bookChunks, ...chunks } }));
  }, []);

  const savePlan = useCallback((plan: DailyPlan) => {
    setState((s) => ({ ...s, plans: { ...s.plans, [plan.date]: plan }, lastPlanDate: plan.date }));
  }, []);

  const saveReport = useCallback((report: WeeklyReport) => {
    setState((s) => ({ ...s, reports: { ...s.reports, [report.weekStart]: report } }));
  }, []);

  const reset = useCallback(() => {
    const fresh = defaultState(state.name);
    setState(fresh);
  }, [state.name]);

  const retrieve = useCallback((query: string, k = 6) => retrieveChunks(state, query, k), [state]);

  const setJournal = useCallback((date: string, text: string) => {
    setState((s) => ({ ...s, journal: { ...s.journal, [date]: text } }));
  }, []);

  const applyFreeze = useCallback((date: string) => {
    setState((s) => {
      if ((s.freezeDays || []).includes(date)) return s;
      const next: AppState = {
        ...s,
        freezeDays: [...(s.freezeDays || []), date].sort(),
        habits: { ...s.habits },
        stats: { ...s.stats },
      };
      recomputeDerived(next); // bridge the streak
      return next;
    });
  }, []);

  const removeFreeze = useCallback((date: string) => {
    setState((s) => {
      if (!(s.freezeDays || []).includes(date)) return s;
      const next: AppState = {
        ...s,
        freezeDays: (s.freezeDays || []).filter((d) => d !== date),
        habits: { ...s.habits },
        stats: { ...s.stats },
      };
      recomputeDerived(next);
      return next;
    });
  }, []);

  const togglePlanCompletionCb = useCallback((date: string, stepId: string) => {
    setState((s) => togglePlanCompletion(s, date, stepId));
  }, []);

  const importState = useCallback((raw: unknown) => {
    const next = sanitizeState((raw || {}) as Partial<AppState>);
    setState(next);
  }, []);

  return (
    <AppCtx.Provider
      value={{
        state,
        ready,
        toggle,
        update,
        setBooks,
        savePlan,
        saveReport,
        reset,
        retrieve,
        setJournal,
        applyFreeze,
        removeFreeze,
        togglePlanCompletion: togglePlanCompletionCb,
        importState,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { todayStr };
