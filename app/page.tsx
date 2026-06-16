"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { rankForXP } from "@/lib/ranks";
import { dayNumber, yesterdaySummary, overallCondition } from "@/lib/store";
import { LEGEND_LINES, LEGENDS, legendForFocus, pick } from "@/lib/legends";
import RankPanel from "@/components/RankPanel";
import StatBars from "@/components/StatBars";
import HabitTracker from "@/components/HabitTracker";
import DailyPlanView from "@/components/DailyPlanView";
import WeeklyReportView from "@/components/WeeklyReportView";
import BookManager from "@/components/BookManager";
import CurriculumView from "@/components/CurriculumView";
import Onboarding from "@/components/Onboarding";
import JournalCard from "@/components/JournalCard";
import FreezePanel from "@/components/FreezePanel";
import BackupPanel from "@/components/BackupPanel";
import ReminderToggle from "@/components/ReminderToggle";
import { RewardOverlay, PunishmentOverlay } from "@/components/Overlays";
import { isFrozen } from "@/lib/store";

type Tab = "home" | "plan" | "curriculum" | "report" | "books";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "HQ", icon: "🏰" },
  { id: "plan", label: "Plan", icon: "⚡" },
  { id: "curriculum", label: "Train", icon: "📚" },
  { id: "report", label: "Report", icon: "📊" },
  { id: "books", label: "Books", icon: "📕" },
];

export default function Home() {
  const { state, ready, reset } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [started, setStarted] = useState(false);

  const [reward, setReward] = useState<{ title: string; subtitle: string; quote?: string } | null>(null);
  const [punish, setPunish] = useState<{ count: number; quote: string; legend: string } | null>(null);
  const punishShown = useRef(false);
  const lastRank = useRef<number>(0);

  const rank = useMemo(() => rankForXP(state.totalXP), [state.totalXP]);
  const day = useMemo(() => (ready ? dayNumber(state) : 1), [state, ready]);
  const condition = useMemo(() => (ready ? overallCondition(state) : 0), [state, ready]);

  // Determine if onboarding is needed (first ever run)
  const needsOnboarding =
    ready && !started && typeof window !== "undefined" && !localStorage.getItem("solo-onboarded");

  // Rank-up detection
  useEffect(() => {
    if (!ready) return;
    if (lastRank.current === 0) {
      lastRank.current = rank.index;
      return;
    }
    if (rank.index > lastRank.current) {
      setReward({
        title: `${rank.name} REACHED`,
        subtitle: `"${rank.title}" — you have ascended.`,
        quote: pick(LEGEND_LINES.alexander, rank.index),
      });
      lastRank.current = rank.index;
    }
  }, [rank.index, ready]);

  // Punishment on missed yesterday (once per session)
  useEffect(() => {
    if (!ready || punishShown.current) return;
    const y = yesterdaySummary(state);
    const hasHistory = Object.keys(state.history).length > 0;
    // A Streak Freeze on yesterday shields you from the punishment.
    if (hasHistory && y.completed < y.total && !isFrozen(state, y.date)) {
      const lk = "goggins" as const;
      setPunish({
        count: y.missed.length,
        quote: pick(LEGEND_LINES[lk], y.missed.length + day),
        legend: LEGENDS[lk].name,
      });
      punishShown.current = true;
    }
  }, [ready, state, day]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="title-font text-mana-glow tracking-widest"
        >
          THE SYSTEM IS WAKING…
        </motion.p>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <Onboarding
        onDone={() => {
          localStorage.setItem("solo-onboarded", "1");
          setStarted(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto px-4 pt-5">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="title-font text-xs text-mana-glow/60 tracking-widest">SOLO·DEVELOPING</p>
          <p className="title-font text-lg text-mana-glow text-glow">Day {day} / 90</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-mana-glow/60">Hunter</p>
          <p className="title-font text-mana-glow">{state.name}</p>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "home" && (
            <div className="space-y-4">
              <RankPanel rank={rank} totalXP={state.totalXP} condition={condition} />
              <HabitTracker
                onAllComplete={() =>
                  setReward({
                    title: "PERFECT DAY",
                    subtitle: "All 7 quests cleared. +50 XP bonus. This is who you are becoming.",
                    quote: pick(LEGEND_LINES.clear, day),
                  })
                }
              />
              <StatBars state={state} />
              <JournalCard />
              <FreezePanel />
              <ReminderToggle />
              <BackupPanel />
              <button
                onClick={() => {
                  if (confirm("Reset all progress? This wipes your save. (Export a backup first!)")) {
                    localStorage.removeItem("solo-onboarded");
                    reset();
                  }
                }}
                className="w-full text-xs text-mana-glow/40 py-2"
              >
                reset progress
              </button>
            </div>
          )}
          {tab === "plan" && <DailyPlanView />}
          {tab === "curriculum" && <CurriculumView />}
          {tab === "report" && <WeeklyReportView />}
          {tab === "books" && <BookManager />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto px-3 pb-3">
          <div className="glass-strong rounded-2xl flex justify-around py-2 no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center px-3 py-1 rounded-xl transition-all ${
                  tab === t.id ? "text-mana-glow" : "text-mana-glow/40"
                }`}
              >
                <span className="text-lg" style={{ filter: tab === t.id ? "drop-shadow(0 0 6px #6fd3ff)" : "none" }}>
                  {t.icon}
                </span>
                <span className="title-font text-[10px] mt-0.5">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <RewardOverlay
        open={!!reward}
        title={reward?.title || ""}
        subtitle={reward?.subtitle || ""}
        quote={reward?.quote}
        onClose={() => setReward(null)}
      />
      <PunishmentOverlay
        open={!!punish}
        missedCount={punish?.count || 0}
        quote={punish?.quote || ""}
        legend={punish?.legend || ""}
        onClose={() => setPunish(null)}
      />
    </div>
  );
}
