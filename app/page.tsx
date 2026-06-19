"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { rankForXP } from "@/lib/ranks";
import { dayNumber, yesterdaySummary, overallCondition, todayStr, isFrozen } from "@/lib/store";
import { LEGEND_LINES, LEGENDS, pick } from "@/lib/legends";
import HunterStage from "@/components/HunterStage";
import StatBars from "@/components/StatBars";
import HabitTracker from "@/components/HabitTracker";
import DailyPlanView from "@/components/DailyPlanView";
import WeeklyReportView from "@/components/WeeklyReportView";
import LibraryView from "@/components/LibraryView";
import LessonCard from "@/components/LessonCard";
import Onboarding from "@/components/Onboarding";
import JournalCard from "@/components/JournalCard";
import HeaderTools from "@/components/HeaderTools";
import { RewardOverlay, PunishmentOverlay } from "@/components/Overlays";
import RankUpCeremony from "@/components/RankUpCeremony";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NAV_ICON } from "@/components/icons";
import { setSoundEnabled } from "@/lib/sound";

type Tab = "home" | "plan" | "library" | "report";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "home", label: "HQ", sub: "Status" },
  { id: "plan", label: "Plan", sub: "Today" },
  { id: "library", label: "Codex", sub: "Books" },
  { id: "report", label: "Report", sub: "Weekly" },
];

export default function Home() {
  const { state, ready, reset, update } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [started, setStarted] = useState(false);
  const [libSlug, setLibSlug] = useState<string | null>(null);

  const openLibrary = (slug: string) => {
    setLibSlug(slug);
    setTab("library");
  };

  const [reward, setReward] = useState<{ title: string; subtitle: string; quote?: string } | null>(null);
  const [punish, setPunish] = useState<{ count: number; quote: string; legend: string } | null>(null);
  const [ceremony, setCeremony] = useState(false);
  const punishShown = useRef(false);
  const lastRank = useRef<number>(0);

  const rank = useMemo(() => rankForXP(state.totalXP), [state.totalXP]);
  const day = useMemo(() => (ready ? dayNumber(state) : 1), [state, ready]);
  const condition = useMemo(() => (ready ? overallCondition(state) : 0), [state, ready]);

  // penalty zone — yesterday missed and today not yet cleared
  const penaltyActive = useMemo(() => {
    if (!ready) return false;
    const y = yesterdaySummary(state);
    const hasHistory = Object.keys(state.history).length > 0;
    const todayDone = state.history[todayStr()]?.completed.length || 0;
    return hasHistory && y.completed < y.total && !isFrozen(state, y.date) && todayDone < 7;
  }, [state, ready]);

  const needsOnboarding =
    ready && !started && typeof window !== "undefined" && !localStorage.getItem("solo-onboarded");

  // ---- rank color bleeds into the whole UI ----
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--rank", rank.color);
    root.style.setProperty("--rank-glow", rank.glow);
    document.body.setAttribute("data-rank", rank.name);
  }, [rank.color, rank.glow, rank.name]);

  // ---- sound mute setting ----
  useEffect(() => {
    setSoundEnabled(state.settings?.soundEnabled !== false);
  }, [state.settings?.soundEnabled]);

  useEffect(() => {
    if (!ready) return;
    if (lastRank.current === 0) {
      lastRank.current = rank.index;
      return;
    }
    if (rank.index > lastRank.current) {
      setCeremony(true);
      lastRank.current = rank.index;
    }
  }, [rank.index, ready]);

  useEffect(() => {
    if (!ready || punishShown.current) return;
    const y = yesterdaySummary(state);
    const hasHistory = Object.keys(state.history).length > 0;
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
      <div className="bg-system min-h-screen flex items-center justify-center">
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="label !text-base !tracking-[0.4em]"
          style={{ color: "var(--rank)" }}
        >
          THE SYSTEM IS WAKING
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

  const resetBtn = (
    <button
      onClick={() => {
        if (confirm("Reset all progress? This wipes your save. (Export a backup first!)")) {
          localStorage.removeItem("solo-onboarded");
          reset();
          setStarted(false); // so onboarding shows again immediately, not after a reload
        }
      }}
      className="label hover:text-[#ff7b7b] transition-colors"
    >
      reset progress
    </button>
  );

  const homeContent = (
    <>
      {/* ===== THE HUNTER — full-stage centerpiece. He IS the screen. ===== */}
      <HunterStage rank={rank} name={state.name} totalXP={state.totalXP} condition={condition} penalty={penaltyActive} />

      <div className="flex items-center gap-3 max-w-xl mx-auto px-2">
        <span className="flex-1 h-px shrink" style={{ background: "var(--line)" }} />
        <p className="mono text-[12px] sm:text-[12.5px] text-center text-[#9aa6bd] leading-snug">
          {rank.description}
        </p>
        <span className="flex-1 h-px shrink" style={{ background: "var(--line)" }} />
      </div>

      {/* ===== Functional panels below the Hunter ===== */}
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-7 space-y-4">
          <HabitTracker
            onAllComplete={() =>
              setReward({
                title: "ALL QUESTS CLEARED",
                subtitle: "Every quest cleared. +50 XP bonus. This is who you are becoming.",
                quote: pick(LEGEND_LINES.clear, day),
              })
            }
          />
        </div>
        <div className="lg:col-span-5 space-y-4">
          <StatBars state={state} />
          <LessonCard onOpenLibrary={openLibrary} />
        </div>
      </div>

      {/* Evening reflection — full-width night log */}
      <JournalCard />

      <div className="flex justify-center lg:justify-end gap-5 pt-1">
        {resetBtn}
      </div>
    </>
  );

  return (
    <div className={`bg-system min-h-screen ${penaltyActive ? "penalty-zone" : ""}`}>
      {/* ===== Desktop nav rail ===== */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[244px] border-r bg-[rgba(4,5,11,0.7)] backdrop-blur-md z-40" style={{ borderColor: "var(--line)" }}>
        <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: "var(--line)" }}>
          <p className="label">SOLO·DEVELOPING</p>
          <p className="title-font text-2xl text-glow mt-1" style={{ color: "var(--rank)" }}>
            DAY <span className="num">{day}</span>
            <span className="opacity-40 text-lg"> / 90</span>
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map((t) => {
            const Icon = NAV_ICON[t.id];
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} data-active={active} className="rail-item w-full text-left">
                <Icon size={20} style={{ filter: active ? "drop-shadow(0 0 6px var(--rank))" : "none" }} />
                <span className="flex flex-col leading-none">
                  <span className="title-font text-sm">{t.label}</span>
                  <span className="label !tracking-[0.15em] mt-1">{t.sub}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t" style={{ borderColor: "var(--line)" }}>
          <p className="label">Hunter</p>
          <p className="title-font text-[#eaf6ff] mt-0.5">{state.name}</p>
          <p className="num text-[12px] mt-2" style={{ color: rank.color }}>
            {rank.name}
          </p>
          <div className="mt-3 flex flex-col gap-1.5">{resetBtn}</div>
        </div>
      </aside>

      {/* ===== Main column ===== */}
      <div className="lg:pl-[244px]">
        <header className="lg:hidden flex items-center justify-between gap-3 px-4 pt-5 pb-3 max-w-md mx-auto">
          <div className="min-w-0">
            <p className="label">SOLO·DEVELOPING</p>
            <p className="title-font text-lg text-glow leading-none mt-1" style={{ color: "var(--rank)" }}>
              DAY <span className="num">{day}</span>
              <span className="opacity-40 text-sm"> / 90</span>
            </p>
          </div>
          <HeaderTools compact />
        </header>

        <header className="hidden lg:flex items-center justify-between px-8 pt-7 pb-4 max-w-[1200px] mx-auto">
          <div className="flex items-baseline gap-3">
            <h1 className="title-font text-xl text-[#eef4ff]">{TABS.find((t) => t.id === tab)?.label}</h1>
            <span className="label">{TABS.find((t) => t.id === tab)?.sub}</span>
          </div>
          <div className="flex items-center gap-4">
            <HeaderTools />
            <div className="flex items-center gap-2">
              <span className="label">RANK</span>
              <span
                className="num text-sm px-3 py-1 border"
                style={{ color: rank.color, borderColor: `${rank.color}55`, boxShadow: `0 0 18px -8px ${rank.glow}` }}
              >
                {rank.name}
              </span>
            </div>
          </div>
        </header>

        <ErrorBoundary>
          <main className="px-4 lg:px-8 pb-28 lg:pb-12 max-w-md lg:max-w-[1200px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {tab === "home" && homeContent}
                {tab === "plan" && <DailyPlanView />}
                {tab === "library" && <LibraryView initialSlug={libSlug} clearInitial={() => setLibSlug(null)} />}
                {tab === "report" && <WeeklyReportView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </ErrorBoundary>
      </div>

      {/* ===== Mobile bottom nav ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div
          className="flex justify-around items-stretch px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t backdrop-blur-xl"
          style={{ borderColor: "var(--line-strong)", background: "rgba(4,5,11,0.92)" }}
        >
          {TABS.map((t) => {
            const Icon = NAV_ICON[t.id];
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-label={t.label}
                className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors"
                style={{ color: active ? "var(--rank)" : "rgba(150,160,180,0.55)" }}
              >
                {active && (
                  <motion.span
                    layoutId="mnav"
                    className="absolute top-0 h-[2px] w-8 rounded-full"
                    style={{ background: "var(--rank)", boxShadow: "0 0 10px var(--rank)" }}
                  />
                )}
                <Icon size={20} style={{ filter: active ? "drop-shadow(0 0 6px var(--rank))" : "none" }} />
                <span className="title-font text-[10px] tracking-wide">{t.label}</span>
              </button>
            );
          })}
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
      <RankUpCeremony rank={rank} open={ceremony} onClose={() => setCeremony(false)} />
    </div>
  );
}
