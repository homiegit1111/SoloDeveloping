"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { DailyPlan } from "@/lib/types";
import { todayStr, activeChunks } from "@/lib/store";
import { diagnose } from "@/lib/diagnosis";
import { retrieveAll, domainChunksOf, Passage } from "@/lib/retrieval";

const SECTIONS: { key: keyof DailyPlan; label: string; code: string }[] = [
  { key: "gym", label: "Physical Conditioning", code: "DOSSIER · GYM" },
  { key: "maths", label: "Cognitive Drill", code: "DOSSIER · STUDY" },
  { key: "skincare", label: "Presentation", code: "DOSSIER · SKIN" },
  { key: "communication", label: "Field Comms", code: "DOSSIER · COMMS" },
  { key: "mindset", label: "Mental Fortitude", code: "DOSSIER · MIND" },
];

const PHASE_LABEL: Record<string, string> = {
  onboarding: "AWAKENING",
  recovering: "THE COMEBACK",
  discipline_breaking: "THE 40% WALL",
  plateau: "THE PLATEAU",
  playing_safe: "PLAYING IT SAFE",
  momentum: "MOMENTUM RISING",
};

export default function DailyPlanView() {
  const { state, savePlan } = useApp();
  const today = todayStr();
  const existing = state.plans[today];
  const [plan, setPlan] = useState<DailyPlan | null>(existing || null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>(existing?.generatedBy || "");
  const [err, setErr] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [readings, setReadings] = useState<Passage[]>([]);

  const dx = diagnose(state);

  async function generate() {
    setLoading(true);
    setErr("");
    try {
      // STEP 1-3 on the client: diagnose, then open the right books and pull
      // the passages (never-repeat aware), and hand them to the System.
      const d = diagnose(state);
      const passages = retrieveAll(activeChunks(state), d);
      const domainChunks = domainChunksOf(passages);
      setReadings(Object.values(passages).flat() as Passage[]);
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, domainChunks }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        savePlan(data.plan);
        setSource(data.source);
        if (data.aiError) setErr(`AI unavailable (${data.aiError}). Showing the System's grounded plan.`);
      } else {
        setErr(data.error || "Failed to generate plan.");
      }
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* dossier header */}
      <div className="dossier sys-corner p-5 relative overflow-hidden">
        <div className="scanline" />
        <div className="relative z-10 flex items-start justify-between mb-2">
          <div>
            <p className="label !text-[#b59b6a]">CLASSIFIED · HUNTER DIRECTIVE</p>
            <h2 className="title-font text-lg text-[#ece3cf] mt-1">TODAY&rsquo;S ORDERS</h2>
          </div>
          <div className="flex items-center gap-2">
            {source && (
              <span className="mono text-[10px] px-2 py-0.5 border" style={{ borderColor: "var(--line)", color: "#b59b6a" }}>
                {source === "ai" ? "AI" : "SYSTEM"}
              </span>
            )}
            <span className="dossier-stamp text-[10px]">{dx.day < 1 ? "DAY 1" : `DAY ${dx.day}`}</span>
          </div>
        </div>
        <p className="mono text-sm text-[#b9b29e] mb-3">
          The System reads your live state — then opens the right books and forges today&rsquo;s orders from them.
        </p>

        {/* diagnosis indicator (replaces the old fixed theme rotation) */}
        <div className="mb-4 p-3 border-l-2" style={{ borderColor: "var(--rank)", background: "color-mix(in srgb, var(--rank) 9%, transparent)" }}>
          <p className="title-font text-[11px] tracking-widest" style={{ color: "var(--rank)" }}>
            DIAGNOSIS — {PHASE_LABEL[dx.phase] || dx.phase.toUpperCase()} · {dx.archetype.toUpperCase()}
          </p>
          <p className="mono text-[14px] text-[#e2d8c0] mt-1 leading-relaxed">{dx.summary}</p>
          <p className="mono text-[12px] text-[#a89e86] mt-2">
            Gym stage: {dx.gymStage} · 7-day: {dx.completion7}% · mentors: {dx.activeMentors.slice(0, 4).join(", ")}
          </p>
        </div>

        <button onClick={generate} disabled={loading} className="sys-btn w-full py-3 text-sm disabled:opacity-50">
          {loading ? "THE SYSTEM IS READING THE BOOKS…" : plan ? "REGENERATE ORDERS" : "GENERATE TODAY'S ORDERS"}
        </button>
        {err && <p className="mono text-xs text-[#ff7b7b] mt-2">{err}</p>}
      </div>

      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:items-start"
        >
          {/* ===== LEFT COLUMN — the orders ===== */}
          <div className="space-y-3 min-w-0">
          <div className="dossier p-4 border-l-2" style={{ borderColor: "var(--rank)" }}>
            <p className="title-font text-lg text-[#ece3cf] mb-1">{plan.greeting}</p>
            <p className="mono text-[15px] text-[#cabfa6] leading-relaxed">{plan.verdictOnYesterday}</p>
            <div className="mt-3 p-3" style={{ background: "color-mix(in srgb, var(--rank) 10%, transparent)", borderLeft: "2px solid var(--rank)" }}>
              <p className="mono text-sm" style={{ color: "var(--rank)" }}>▸ {plan.focus}</p>
            </div>
          </div>

          {/* BOSS TASK — emerges from the books when the data says he's ready */}
          {plan.bossTask && (
            <div className="dossier sys-corner p-4 relative overflow-hidden border-l-2" style={{ borderColor: "#ff4d5e" }}>
              <div className="scanline" />
              <p className="relative z-10 title-font text-xs tracking-widest" style={{ color: "#ff4d5e" }}>
                ⚔ {plan.bossTask.title}
              </p>
              <p className="relative z-10 mono text-sm text-[#ece3cf] mt-1.5 whitespace-pre-line leading-relaxed">{plan.bossTask.detail}</p>
              <p className="relative z-10 mono text-[11px] text-[#a59a82] mt-2 italic">Why now: {plan.bossTask.trigger}</p>
              {plan.bossTask.source && (
                <p className="relative z-10 mono text-[10px] text-[#7e7561] mt-1">— {plan.bossTask.source.author}, {plan.bossTask.source.book}</p>
              )}
            </div>
          )}

          {SECTIONS.map((s) => {
            const block = plan[s.key] as { title: string; detail: string };
            if (!block?.title) return null;
            const isOpen = openSection === (s.key as string);
            const src = plan.sources?.[s.key as keyof NonNullable<DailyPlan["sources"]>];
            return (
              <button
                key={s.key as string}
                onClick={() => setOpenSection(isOpen ? null : (s.key as string))}
                data-open={isOpen}
                className="dossier p-4 w-full text-left block border-l-2 transition-colors"
                style={{ borderColor: isOpen ? "var(--rank)" : "color-mix(in srgb, var(--rank) 25%, transparent)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="label !text-[#b59b6a]">{s.code}</p>
                  <span
                    className="term text-[9px] px-2 py-0.5 border rounded-sm whitespace-nowrap"
                    style={{
                      borderColor: "color-mix(in srgb, var(--rank) 40%, transparent)",
                      color: isOpen ? "var(--rank)" : "#a59a82",
                    }}
                  >
                    {isOpen ? "CLOSE ▾" : "TAP TO READ ▸"}
                  </span>
                </div>
                <p className="mono text-[15px] text-[#f1ead8] font-semibold mt-1.5 leading-snug">{block.title}</p>
                <motion.div initial={false} animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
                  <p className="mono text-[14px] text-[#d4cab0] whitespace-pre-line leading-relaxed mt-2.5">{block.detail}</p>
                  {src && (
                    <p className="label !tracking-[0.1em] !text-[#7e7561] mt-2.5">SOURCE · {src.author} — {src.book}</p>
                  )}
                </motion.div>
              </button>
            );
          })}
          </div>

          {/* ===== RIGHT COLUMN — knowledge from the books + the System's word ===== */}
          <div className="space-y-3 min-w-0">
            {/* TODAY'S READINGS — the actual passages the System pulled from the books */}
            {readings.length > 0 && (
              <div className="dossier p-4">
                <p className="label !text-[#b59b6a] mb-2">FROM THE BOOKS · TODAY&rsquo;S READINGS</p>
                <div className="space-y-3">
                  {readings.map((p, i) => (
                    <div key={p.chunk?.id || i} className="border-l-2 pl-3" style={{ borderColor: "color-mix(in srgb, var(--rank) 45%, transparent)" }}>
                      <p className="mono text-[14px] text-[#ddd6c4] leading-relaxed">&ldquo;{p.text}&rdquo;</p>
                      <p className="label !tracking-[0.12em] mt-1.5 !text-[#7e7561]">
                        {p.author} · {p.book}{p.page ? ` · p.${p.page}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mono text-[12px] text-[#8a8270] mt-3 italic">
                  These are the exact passages that forged today&rsquo;s orders. Read them — that&rsquo;s the knowledge.
                </p>
              </div>
            )}

            {plan.legendStory?.text && (
              <div className="dossier p-4 border-l-2" style={{ borderColor: "#C9A84C" }}>
                <p className="title-font text-xs text-[#C9A84C] mb-1">FROM {plan.legendStory.legend.toUpperCase()}</p>
                <p className="mono text-[15px] text-[#ddd6c4] italic leading-relaxed">{plan.legendStory.text}</p>
              </div>
            )}

            <div className="sys-window sys-corner p-4 text-center relative overflow-hidden">
              <div className="scanline" />
              <p className="relative z-10 label mb-1">THE SYSTEM SPEAKS</p>
              <p className="relative z-10 mono text-base text-[#e7eefc] font-semibold leading-relaxed">{plan.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
