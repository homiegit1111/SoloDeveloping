"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { dayNumber } from "@/lib/store";
import { mathsForDay } from "@/data/curriculum/maths";
import { communicationForDay } from "@/data/curriculum/communication";
import { gymForDay } from "@/data/curriculum/gym";
import { MORNING_ROUTINE, EVENING_ROUTINE, skincareTipForDay, isExfoliationDay } from "@/data/curriculum/skincare";

type Tab = "gym" | "maths" | "comm" | "skin";

export default function CurriculumView() {
  const { state } = useApp();
  const day = dayNumber(state);
  const [tab, setTab] = useState<Tab>("gym");

  const gym = gymForDay(day);
  const maths = mathsForDay(day);
  const comm = communicationForDay(day);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "gym", label: "Gym", icon: "" },
    { id: "maths", label: "Maths", icon: "" },
    { id: "comm", label: "Speak", icon: "" },
    { id: "skin", label: "Skin", icon: "" },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-strong system-border rounded-2xl p-4">
        <h2 className="title-font text-lg text-mana-glow text-glow mb-1">CURRICULA</h2>
        <p className="text-sm text-mana-glow/70">Day {day} of 90 · built-in progressive programs that level with your rank.</p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl title-font text-xs border ${
              tab === t.id ? "bg-mana/20 border-mana/50 text-mana-glow shadow-mana" : "border-void-500/50 text-mana-glow/60"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "gym" && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="title-font text-mana-glow">{gym.day} — {gym.focus}</p>
          <p className="text-xs text-mana-glow/60">Warmup: {gym.warmup}</p>
          {gym.exercises.map((e, i) => (
            <div key={i} className="rounded-lg bg-void-700/50 p-3 border border-void-500/40">
              <div className="flex justify-between">
                <p className="text-sm text-mana-glow font-semibold">{e.name}</p>
                <p className="text-xs text-gold">{e.sets} × {e.reps}</p>
              </div>
              <p className="text-xs text-mana-glow/55">Rest {e.rest} · {e.form}</p>
            </div>
          ))}
          {gym.finisher && <p className="text-xs text-arise/80"> Finisher: {gym.finisher}</p>}
        </div>
      )}

      {tab === "maths" && (
        <div className="glass rounded-2xl p-4 space-y-2">
          <p className="title-font text-mana-glow">{maths.unit} — {maths.title}</p>
          <p className="text-sm text-mana-glow/80 leading-relaxed">{maths.lesson}</p>
          <p className="text-sm text-mana-glow/70"><span className="text-mana-glow/50">Example:</span> {maths.example}</p>
          <div className="rounded-lg bg-void-700/50 p-3 border border-void-500/40 space-y-1">
            <p className="text-xs title-font text-mana-glow/70">PRACTICE</p>
            {maths.practice.map((p, i) => (
              <details key={i} className="text-sm">
                <summary className="text-mana-glow/85 cursor-pointer">{i + 1}. {p.q}</summary>
                <p className="text-jade/80 pl-4 mt-1"> {p.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {tab === "comm" && (
        <div className="glass rounded-2xl p-4 space-y-2">
          <p className="title-font text-mana-glow">{comm.unit} — {comm.skill}</p>
          <p className="text-sm text-mana-glow/70"><span className="text-mana-glow/50">Why:</span> {comm.why}</p>
          <div className="rounded-lg bg-arise/10 border border-arise/30 p-3">
            <p className="text-xs title-font text-arise/80 mb-1">TODAY'S DRILL</p>
            <p className="text-sm text-mana-glow/85">{comm.exercise}</p>
          </div>
          {comm.phrase && <p className="text-sm italic text-gold/85"> {comm.phrase}</p>}
        </div>
      )}

      {tab === "skin" && (
        <div className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <p className="title-font text-gold/90 text-sm mb-1"> TODAY'S GLOW TIP</p>
            <p className="text-sm text-mana-glow/85">{skincareTipForDay(day)}</p>
            {isExfoliationDay(day) && <p className="text-xs text-jade/80 mt-2">Tonight is an EXFOLIATION night (gentle).</p>}
          </div>
          <Routine title=" MORNING ROUTINE" steps={MORNING_ROUTINE} />
          <Routine title=" EVENING ROUTINE" steps={EVENING_ROUTINE} />
        </div>
      )}
    </div>
  );
}

function Routine({ title, steps }: { title: string; steps: { step: string; how: string; science: string }[] }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-2">
      <p className="title-font text-sm text-mana-glow/80">{title}</p>
      {steps.map((s, i) => (
        <div key={i} className="rounded-lg bg-void-700/50 p-3 border border-void-500/40">
          <p className="text-sm text-mana-glow font-semibold">{s.step}</p>
          <p className="text-xs text-mana-glow/75">{s.how}</p>
          <p className="text-[11px] text-mana-glow/45 mt-1"> {s.science}</p>
        </div>
      ))}
    </div>
  );
}
