"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { DailyPlan } from "@/lib/types";
import { todayStr, activeChunks } from "@/lib/store";
import { diagnose } from "@/lib/diagnosis";
import { retrieveAll, domainChunksOf, Passage } from "@/lib/retrieval";
import { IconGym, IconMaths, IconSkincare, IconComms, IconBrain } from "@/components/icons";

type IconT = (p: any) => JSX.Element;

const SECTIONS: { key: keyof DailyPlan; label: string; code: string; Icon: IconT }[] = [
  { key: "gym", label: "Physical Conditioning", code: "GYM", Icon: IconGym },
  { key: "maths", label: "Cognitive Drill", code: "STUDY", Icon: IconMaths },
  { key: "skincare", label: "Presentation", code: "SKIN", Icon: IconSkincare },
  { key: "communication", label: "Field Comms", code: "COMMS", Icon: IconComms },
  { key: "mindset", label: "Mental Fortitude", code: "MIND", Icon: IconBrain },
];

const PHASE_LABEL: Record<string, string> = {
  onboarding: "AWAKENING",
  recovering: "THE COMEBACK",
  discipline_breaking: "THE 40% WALL",
  plateau: "THE PLATEAU",
  playing_safe: "PLAYING IT SAFE",
  momentum: "MOMENTUM RISING",
};

// Break a detail blob into clear sub-objectives. Honours real line breaks first;
// otherwise splits on sentence boundaries / semicolons so each step reads cleanly.
function toSteps(detail: string): string[] {
  if (!detail) return [];
  let parts = detail.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) {
    parts = detail.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])|;\s+/).map((s) => s.trim()).filter(Boolean);
  }
  return parts.map((p) => p.replace(/^[\-•▸◦*\d.)\s]+/, "").trim()).filter((p) => p.length > 1);
}

function ZoneLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      <span
        className="term text-[11px] w-5 h-5 grid place-items-center rounded-sm"
        style={{ background: "color-mix(in srgb, var(--rank) 18%, transparent)", color: "var(--rank)", border: "1px solid var(--line-strong)" }}
      >
        {n}
      </span>
      <p className="label">{children}</p>
      <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
    </div>
  );
}

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

  const questCount = SECTIONS.filter((s) => (plan?.[s.key] as any)?.title).length + (plan?.bossTask ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* ===== ZONE 1 · THE SYSTEM'S READ ===== */}
      <div className="dossier sys-corner p-5 relative overflow-hidden">
        <div className="scanline" />
        <div className="relative z-10 flex items-start justify-between mb-2">
          <div>
            <p className="label !text-[#b59b6a]">CLASSIFIED · HUNTER DIRECTIVE</p>
            <h2 className="title-font text-lg text-[#ece3cf] mt-1">TODAY&rsquo;S ORDERS</h2>
          </div>
          <span className="dossier-stamp text-[10px]">{dx.day < 1 ? "DAY 1" : `DAY ${dx.day}`}</span>
        </div>

        <div className="relative z-10 mb-4 p-3 border-l-2" style={{ borderColor: "var(--rank)", background: "color-mix(in srgb, var(--rank) 9%, transparent)" }}>
          <p className="title-font text-[11px] tracking-widest" style={{ color: "var(--rank)" }}>
            ◈ DIAGNOSIS — {PHASE_LABEL[dx.phase] || dx.phase.toUpperCase()} · {dx.archetype.toUpperCase()}
          </p>
          <p className="mono text-[14px] text-[#e2d8c0] mt-1 leading-relaxed">{dx.summary}</p>
          <p className="mono text-[12px] text-[#a89e86] mt-2">
            Gym stage: {dx.gymStage} · 7-day adherence: {dx.completion7}% · mentors: {dx.activeMentors.slice(0, 4).join(", ")}
          </p>
        </div>

        <button onClick={generate} disabled={loading} className="relative z-10 sys-btn w-full py-3 text-sm disabled:opacity-50">
          {loading ? "THE SYSTEM IS READING THE BOOKS…" : plan ? "REGENERATE ORDERS" : "GENERATE TODAY'S ORDERS"}
        </button>
        {err && <p className="relative z-10 mono text-xs text-[#ff7b7b] mt-2">{err}</p>}
      </div>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          {/* ===== LEFT — TRANSMISSION + QUESTS ===== */}
          <div className="space-y-4 min-w-0">
            {/* System transmission (the AI/System's words — clearly flagged) */}
            <div className="sys-window sys-corner p-4 relative overflow-hidden">
              <div className="scanline" />
              <div className="relative z-10 flex items-center justify-between mb-1.5">
                <p className="label" style={{ color: "var(--rank)" }}>⟁ SYSTEM TRANSMISSION</p>
                <span className="term text-[10px] px-2 py-0.5 border" style={{ borderColor: "var(--line)", color: source === "ai" ? "var(--rank)" : "#828c9e" }}>
                  {source === "ai" ? "AI-FORGED" : "SYSTEM-FORGED"}
                </span>
              </div>
              <p className="relative z-10 title-font text-[15px] text-[#eaf1ff] leading-snug">{plan.greeting}</p>
              <p className="relative z-10 mono text-[13.5px] text-[#aeb6c6] leading-relaxed mt-1.5">{plan.verdictOnYesterday}</p>
              <div className="relative z-10 mt-3 px-3 py-2 border-l-2" style={{ borderColor: "var(--rank)", background: "color-mix(in srgb, var(--rank) 10%, transparent)" }}>
                <p className="label mb-0.5" style={{ color: "var(--rank)" }}>TODAY&rsquo;S FOCUS</p>
                <p className="mono text-[13.5px] text-[#e7eefc]">{plan.focus}</p>
              </div>
            </div>

            {/* ZONE 2 · QUESTS */}
            <ZoneLabel n="01">TODAY&rsquo;S QUESTS · {questCount}</ZoneLabel>

            {/* BOSS QUEST */}
            {plan.bossTask && (
              <div className="sys-window sys-corner p-4 relative overflow-hidden border-l-2" style={{ borderColor: "#ff4d5e" }}>
                <div className="scanline" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="term text-[10px] px-2 py-0.5" style={{ background: "rgba(255,77,94,0.16)", color: "#ff6b78", border: "1px solid rgba(255,77,94,0.4)" }}>BOSS QUEST</span>
                    <p className="title-font text-[13px] tracking-wide" style={{ color: "#ff8089" }}>⚔ {plan.bossTask.title}</p>
                  </div>
                  <ol className="space-y-1.5 mt-2">
                    {toSteps(plan.bossTask.detail).map((st, i) => (
                      <li key={i} className="flex gap-2.5 mono text-[13.5px] text-[#f1e3e4] leading-relaxed">
                        <span className="term text-[11px] mt-0.5 shrink-0" style={{ color: "#ff6b78" }}>{String(i + 1).padStart(2, "0")}</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mono text-[11px] text-[#a59a82] mt-2.5 italic">Why now: {plan.bossTask.trigger}</p>
                  {plan.bossTask.source && (
                    <p className="label !tracking-[0.1em] !text-[#7e7561] mt-1">SOURCE · {plan.bossTask.source.author} — {plan.bossTask.source.book}</p>
                  )}
                </div>
              </div>
            )}

            {/* Standard quests — expand into sub-objectives */}
            {SECTIONS.map((s, idx) => {
              const block = plan[s.key] as { title: string; detail: string };
              if (!block?.title) return null;
              const isOpen = openSection === (s.key as string);
              const src = plan.sources?.[s.key as keyof NonNullable<DailyPlan["sources"]>];
              const steps = toSteps(block.detail);
              const Icon = s.Icon;
              return (
                <div
                  key={s.key as string}
                  className="glass border-l-2 transition-colors overflow-hidden"
                  style={{ borderColor: isOpen ? "var(--rank)" : "color-mix(in srgb, var(--rank) 30%, transparent)" }}
                >
                  <button
                    onClick={() => setOpenSection(isOpen ? null : (s.key as string))}
                    className="w-full text-left p-4 flex items-center gap-3"
                  >
                    <span
                      className="grid place-items-center shrink-0 w-9 h-9 rounded-sm"
                      style={{ background: "color-mix(in srgb, var(--rank) 12%, transparent)", border: "1px solid var(--line-strong)", color: "var(--rank)" }}
                    >
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="label flex items-center gap-2">
                        QUEST {String(idx + 1).padStart(2, "0")} · {s.code}
                        <span className="term text-[9px]" style={{ color: "#828c9e" }}>{steps.length} STEP{steps.length !== 1 ? "S" : ""}</span>
                      </p>
                      <p className="mono text-[15px] text-[#eef4ff] font-semibold leading-snug mt-0.5 truncate">{block.title}</p>
                    </div>
                    <span className="term text-[11px] shrink-0" style={{ color: isOpen ? "var(--rank)" : "#828c9e" }}>{isOpen ? "▾" : "▸"}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0">
                          <p className="label mb-2" style={{ color: "var(--rank)" }}>SUB-OBJECTIVES</p>
                          <ol className="space-y-2">
                            {steps.map((st, i) => (
                              <li key={i} className="flex gap-2.5 items-start">
                                <span
                                  className="term text-[10px] mt-0.5 w-5 h-5 grid place-items-center shrink-0 rounded-sm"
                                  style={{ border: "1px solid var(--line-strong)", color: "var(--rank)" }}
                                >
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="mono text-[13.5px] text-[#d5dceb] leading-relaxed">{st}</span>
                              </li>
                            ))}
                          </ol>
                          {src && <p className="label !tracking-[0.1em] mt-3" style={{ color: "#717b8d" }}>SOURCE · {src.author} — {src.book}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* ===== RIGHT — INTEL FROM THE BOOKS (knowledge, not tasks) ===== */}
          <div className="space-y-4 min-w-0">
            {readings.length > 0 && (
              <div className="space-y-3">
                <ZoneLabel n="02">FROM THE BOOKS · INTEL</ZoneLabel>
                <div className="dossier p-4 space-y-3">
                  {readings.map((p, i) => (
                    <div key={p.chunk?.id || i} className="border-l-2 pl-3" style={{ borderColor: "color-mix(in srgb, var(--rank) 45%, transparent)" }}>
                      <p className="mono text-[13.5px] text-[#ddd6c4] leading-relaxed">&ldquo;{p.text}&rdquo;</p>
                      <p className="label !tracking-[0.12em] mt-1.5 !text-[#7e7561]">
                        {p.author} · {p.book}{p.page ? ` · p.${p.page}` : ""}
                      </p>
                    </div>
                  ))}
                  <p className="mono text-[11.5px] text-[#8a8270] italic pt-1">
                    These exact passages forged today&rsquo;s quests. This is the knowledge — read it.
                  </p>
                </div>
              </div>
            )}

            {plan.legendStory?.text && (
              <div className="dossier p-4 border-l-2" style={{ borderColor: "#C9A84C" }}>
                <p className="label !text-[#C9A84C] mb-1">❝ FROM {plan.legendStory.legend.toUpperCase()}</p>
                <p className="mono text-[14px] text-[#ddd6c4] italic leading-relaxed">{plan.legendStory.text}</p>
              </div>
            )}

            <div className="sys-window sys-corner p-4 text-center relative overflow-hidden">
              <div className="scanline" />
              <p className="relative z-10 label mb-1" style={{ color: "var(--rank)" }}>THE SYSTEM SPEAKS</p>
              <p className="relative z-10 mono text-[15px] text-[#e7eefc] font-semibold leading-relaxed">{plan.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
