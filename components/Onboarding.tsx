"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import ParticleField from "./ParticleField";
import { sysOpen } from "@/lib/sound";
import { backfillHistory } from "@/lib/store";
import { ALL_HABIT_IDS, HABIT_BY_ID } from "@/lib/habits";
import type { HabitId } from "@/lib/types";
import { TactileButton, TactileInput, TactileNumber } from "@/components/TactileMotion";

// First-run gate: the System "awakens" the Hunter.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { state, update } = useApp();
  const [name, setName] = useState(state.name || "Ravi");
  const [importOpen, setImportOpen] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [importHabits, setImportHabits] = useState<HabitId[]>([]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-system relative overflow-hidden">
      <div className="absolute inset-0 opacity-50">
        <ParticleField color="#3B82F6" intensity={0.8} tier={4} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="sys-window sys-corner w-full max-w-md p-8 sm:p-10 text-center relative overflow-hidden z-10"
      >
        <div className="scanline" />
        <div className="absolute top-0 left-6 right-6"><div className="sys-bar" /></div>
        <motion.p
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="relative z-10 label !tracking-[0.34em] mb-4"
          style={{ color: "var(--rank)" }}
        >
          THE SYSTEM HAS FOUND YOU
        </motion.p>
        <h1 className="relative z-10 title-font text-5xl text-glow mb-3" style={{ color: "var(--rank)" }}>ARISE, HUNTER</h1>
        <p className="relative z-10 mono text-sm text-[#9aa6bd] mb-7 leading-relaxed">
          You had it all. You lost it. Now you rebuild — body, mind, money, discipline, presence. 90 days.
          One comeback. This is your weapon. State your name and step through the gate.
        </p>
        <label htmlFor="hunter-name" className="relative z-10 label block text-left mb-2">Hunter designation</label>
        <TactileInput
          id="hunter-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="relative z-10 w-full px-4 py-3 bg-[rgba(255,255,255,0.03)] border title-font text-[#eaf6ff] mb-5 outline-none transition-colors"
          style={{ borderColor: "var(--line-strong)", background: "rgba(255,255,255,0.03)" }}
          placeholder="Your name"
        />
        <div className="relative z-10">
          <TactileButton
            onClick={() => setImportOpen((v) => !v)}
            className="term text-[10px] mb-3 block opacity-70 hover:opacity-100 transition-opacity text-left"
          >
            {importOpen ? "▾ Hide streak import" : "▸ Already have a streak?"}
          </TactileButton>
          {importOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 space-y-3"
            >
              <p className="mono text-[11px] text-[#9aa6bd]">
                Tell The System how many consecutive days you have already completed
                and which quests you kept.
              </p>
              <div>
                <label htmlFor="streak-days" className="label block text-left mb-1">Consecutive days</label>
                <TactileNumber
                  id="streak-days"
                  min={0}
                  max={365}
                  value={streakDays}
                  onChange={(e) => setStreakDays(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[rgba(255,255,255,0.03)] border title-font text-[#eaf6ff] outline-none transition-colors"
                  style={{ borderColor: "var(--line-strong)", background: "rgba(255,255,255,0.03)" }}
                />
              </div>
              <div>
                <label className="label block text-left mb-1">Quests you kept</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_HABIT_IDS.map((id) => {
                    const h = HABIT_BY_ID[id];
                    const checked = importHabits.includes(id);
                    return (
                      <TactileButton
                        key={id}
                        onClick={() =>
                          setImportHabits((prev) =>
                            checked ? prev.filter((x) => x !== id) : [...prev, id]
                          )
                        }
                        aria-pressed={checked}
                        className={`flex items-center gap-1.5 px-2 py-1.5 border text-[11px] rounded-sm transition-all ${
                          checked
                            ? "border-[var(--rank)] bg-[color-mix(in_srgb,var(--rank)_12%,transparent)]"
                            : "border-[var(--line)] bg-transparent opacity-70"
                        }`}
                      >
                        <span>{h.icon}</span>
                        <span className="text-[#d6dbe6]">{h.short}</span>
                      </TactileButton>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <TactileButton
          onClick={() => {
            sysOpen();
            let next = { ...state, name: name.trim() || "Ravi" };
            if (importOpen && streakDays > 0 && importHabits.length > 0) {
              next = backfillHistory(next, importHabits, streakDays);
            }
            update(next);
            onDone();
          }}
          className="relative z-10 sys-btn w-full py-3.5 text-sm"
        >
          BEGIN THE ASCENT
        </TactileButton>
      </motion.div>
    </div>
  );
}
