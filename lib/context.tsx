"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AppState, HabitId, BookMeta, BookChunk, DailyPlan, WeeklyReport } from "./types";
import { loadState, saveState, defaultState, toggleHabit, todayStr, retrieveChunks } from "./store";

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
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

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

  return (
    <AppCtx.Provider value={{ state, ready, toggle, update, setBooks, savePlan, saveReport, reset, retrieve }}>
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
