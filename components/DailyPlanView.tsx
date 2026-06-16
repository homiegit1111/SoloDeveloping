"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { DailyPlan } from "@/lib/types";
import { todayStr } from "@/lib/store";
import { mathsForDay } from "@/data/curriculum/maths";
import { communicationForDay } from "@/data/curriculum/communication";
import { gymForDay } from "@/data/curriculum/gym";
import { dayNumber } from "@/lib/store";
import { themeForDay } from "@/lib/themes";
import { LEGENDS } from "@/lib/legends";

const SECTIONS: { key: keyof DailyPlan; label: string; code: string }[] = [
  { key: "gym", label: "Physical Conditioning", code: "DOSSIER · GYM" },
  { key: "maths", label: "Cognitive Drill", code: "DOSSIER · MATHS" },
  { key: "skincare", label: "Presentation", code: "DOSSIER · SKIN" },
  { key: "communication", label: "Field Comms", code: "DOSSIER · COMMS" },
  { key: "mindset", label: "Mental Fortitude", code: "DOSSIER · MIND" },
];

export default function DailyPlanView() {
  const { state, savePlan, retrieve } = useApp();
  const today = todayStr();
  const existing = state.plans[today];
  const [plan, setPlan] = useState<DailyPlan | null>(existing || null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>(existing?.generatedBy || "");
  const [err, setErr] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const day = dayNumber(state);
  const theme = themeForDay(day);
  const themeLegend = LEGENDS[theme.legend];

  async function generate() {
    setLoading(true);
    setErr("");
    try {
      const day = dayNumber(state);
      const gym = gymForDay(day);
      const maths = mathsForDay(day);
      const comm = communicationForDay(day);
      const theme = themeForDay(day);
      const query = `${theme.query} ${gym.focus} ${maths.title} ${comm.skill}`;
      const chunks = retrieve(query, 6);
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, chunks }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        savePlan(data.plan);
        setSource(data.source);
        if (data.aiError) setErr(`AI unavailable (${data.aiError}). Showing local plan.`);
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
                {source === "ai" ? "AI" : "LOCAL"}
              </span>
            )}
            <span className="dossier-stamp text-[10px]">{day < 1 ? "DAY 1" : `DAY ${day}`}</span>
          </div>
        </div>
        <p className="mono text-sm text-[#b9b29e] mb-3">
          The System reads yesterday, your rank, your weak areas, and your books — then forges today&rsquo;s orders.
        </p>

        {/* theme / legend voice indicator */}
        <div className="mb-4 p-3 border-l-2" style={{ borderColor: themeLegend.color, background: `${themeLegend.color}12` }}>
          <p className="title-font text-[11px] tracking-widest" style={{ color: themeLegend.color }}>
            THEME · DAY {day} — {theme.label.toUpperCase()}
          </p>
          <p className="mono text-sm text-[#ddd6c4] mt-0.5">{theme.intent}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: themeLegend.color, boxShadow: `0 0 6px ${themeLegend.color}` }} />
            <p className="mono text-[11px] text-[#a59a82]">VOICE: {themeLegend.name}</p>
          </div>
        </div>

        <button onClick={generate} disabled={loading} className="sys-btn w-full py-3 text-sm disabled:opacity-50">
          {loading ? "THE SYSTEM IS THINKING…" : plan ? "REGENERATE ORDERS" : "GENERATE TODAY'S ORDERS"}
        </button>
        {err && <p className="mono text-xs text-[#ff7b7b] mt-2">{err}</p>}
      </div>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="dossier p-4 border-l-2" style={{ borderColor: "var(--rank)" }}>
            <p className="title-font text-[#ece3cf] mb-1">{plan.greeting}</p>
            <p className="mono text-sm text-[#b9b29e]">{plan.verdictOnYesterday}</p>
            <div className="mt-3 p-3" style={{ background: "color-mix(in srgb, var(--rank) 10%, transparent)", borderLeft: "2px solid var(--rank)" }}>
              <p className="mono text-sm" style={{ color: "var(--rank)" }}>▸ {plan.focus}</p>
            </div>
          </div>

          {SECTIONS.map((s) => {
            const block = plan[s.key] as { title: string; detail: string };
            if (!block?.title) return null;
            const isOpen = openSection === (s.key as string);
            return (
              <button
                key={s.key as string}
                onClick={() => setOpenSection(isOpen ? null : (s.key as string))}
                className="dossier p-4 w-full text-left block"
              >
                <div className="flex items-center justify-between">
                  <p className="label !text-[#b59b6a]">{s.code}</p>
                  <span className="mono text-xs text-[#a59a82]">{isOpen ? "▾" : "▸"}</span>
                </div>
                <p className="mono text-sm text-[#ece3cf] font-bold mt-1">{block.title}</p>
                <motion.div initial={false} animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
                  <p className="mono text-sm text-[#b9b29e] whitespace-pre-line leading-relaxed mt-2">{block.detail}</p>
                </motion.div>
              </button>
            );
          })}

          {plan.legendStory?.text && (
            <div className="dossier p-4 border-l-2" style={{ borderColor: "#C9A84C" }}>
              <p className="title-font text-xs text-[#C9A84C] mb-1">STORY OF {plan.legendStory.legend.toUpperCase()}</p>
              <p className="mono text-sm text-[#ddd6c4] italic leading-relaxed">{plan.legendStory.text}</p>
            </div>
          )}

          <div className="sys-window sys-corner p-4 text-center relative overflow-hidden">
            <div className="scanline" />
            <p className="relative z-10 label mb-1">THE SYSTEM SPEAKS</p>
            <p className="relative z-10 mono text-base text-[#e7eefc] font-bold leading-relaxed">{plan.message}</p>
          </div>

          {plan.bookCitations && plan.bookCitations.length > 0 && (
            <p className="mono text-[10px] text-[#7c8aa3] text-center">
              Grounded in: {plan.bookCitations.map((c) => `${c.book} p.${c.page}`).join(" · ")}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
