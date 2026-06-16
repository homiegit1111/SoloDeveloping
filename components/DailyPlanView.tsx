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

const SECTIONS: { key: keyof DailyPlan; label: string; icon: string }[] = [
  { key: "gym", label: "Gym", icon: "🏋️" },
  { key: "maths", label: "Maths", icon: "🧮" },
  { key: "skincare", label: "Skincare", icon: "✨" },
  { key: "communication", label: "Communication", icon: "🗣️" },
  { key: "mindset", label: "Mindset", icon: "🧠" },
];

export default function DailyPlanView() {
  const { state, savePlan, retrieve } = useApp();
  const today = todayStr();
  const existing = state.plans[today];
  const [plan, setPlan] = useState<DailyPlan | null>(existing || null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>(existing?.generatedBy || "");
  const [err, setErr] = useState("");

  async function generate() {
    setLoading(true);
    setErr("");
    try {
      const day = dayNumber(state);
      const gym = gymForDay(day);
      const maths = mathsForDay(day);
      const comm = communicationForDay(day);
      // retrieve book chunks relevant to today's focuses
      const query = `${gym.focus} ${maths.title} skincare grooming ${comm.skill} discipline mindset`;
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
      <div className="glass-strong system-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="title-font text-lg text-mana-glow text-glow">AI DAILY PLAN</h2>
          {source && (
            <span className="text-[10px] title-font px-2 py-0.5 rounded-full border border-mana/30 text-mana-glow/70">
              {source === "ai" ? "⚡ AI" : "◆ LOCAL"}
            </span>
          )}
        </div>
        <p className="text-sm text-mana-glow/70 mb-4">
          The System reads yesterday, your rank, your weak areas, and your books — then forges today's orders.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 rounded-xl title-font tracking-wider bg-mana/20 border border-mana/50 text-mana-glow hover:bg-mana/30 disabled:opacity-50 shadow-mana"
        >
          {loading ? "THE SYSTEM IS THINKING…" : plan ? "REGENERATE TODAY'S PLAN" : "GENERATE TODAY'S PLAN"}
        </button>
        {err && <p className="text-xs text-ember/80 mt-2">{err}</p>}
      </div>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <p className="title-font text-mana-glow text-glow mb-1">{plan.greeting}</p>
            <p className="text-sm text-mana-glow/75">{plan.verdictOnYesterday}</p>
            <div className="mt-3 rounded-lg bg-arise/10 border border-arise/30 p-3">
              <p className="text-sm text-arise/90 title-font">🎯 {plan.focus}</p>
            </div>
          </div>

          {SECTIONS.map((s) => {
            const block = plan[s.key] as { title: string; detail: string };
            if (!block?.title) return null;
            return (
              <div key={s.key as string} className="glass rounded-2xl p-4">
                <p className="title-font text-sm text-mana-glow/80 mb-1">
                  {s.icon} {s.label.toUpperCase()}
                </p>
                <p className="text-sm text-mana-glow font-semibold mb-1">{block.title}</p>
                <p className="text-sm text-mana-glow/75 whitespace-pre-line leading-relaxed">{block.detail}</p>
              </div>
            );
          })}

          {plan.legendStory?.text && (
            <div className="glass rounded-2xl p-4 border-l-2 border-gold/50">
              <p className="title-font text-xs text-gold/80 mb-1">📜 STORY OF {plan.legendStory.legend.toUpperCase()}</p>
              <p className="text-sm text-mana-glow/85 italic leading-relaxed">{plan.legendStory.text}</p>
            </div>
          )}

          <div className="glass-strong rounded-2xl p-4 text-center">
            <p className="title-font text-xs text-mana-glow/60 mb-1">THE SYSTEM SPEAKS</p>
            <p className="text-base text-mana-glow font-semibold leading-relaxed">{plan.message}</p>
          </div>

          {plan.bookCitations && plan.bookCitations.length > 0 && (
            <p className="text-[10px] text-mana-glow/40 text-center">
              Grounded in: {plan.bookCitations.map((c) => `${c.book} p.${c.page}`).join(" · ")}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
