"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { HABITS } from "@/lib/habits";
import { isCompleted, todayStr } from "@/lib/store";
import { HABIT_ICON, IconCheck, IconFlame } from "@/components/icons";
import { questComplete as sndQuest, shatter as sndShatter } from "@/lib/sound";

export default function HabitTracker({ onAllComplete }: { onAllComplete?: () => void }) {
  const { state, toggle } = useApp();
  const today = todayStr();
  const yest = todayStr(new Date(Date.now() - 86400000));
  const doneCount = state.history[today]?.completed.length || 0;
  const all = doneCount === HABITS.length;

  // transient per-quest fx
  const [fx, setFx] = useState<Record<string, "complete" | "shatter" | undefined>>({});
  const [floatXP, setFloatXP] = useState<Record<string, number>>({});

  function handle(id: string, xp: number) {
    const wasDone = isCompleted(state, id as any);
    const wasAll = doneCount === HABITS.length;
    toggle(id as any);
    if (!wasDone) {
      // completing
      sndQuest();
      setFx((f) => ({ ...f, [id]: "complete" }));
      setFloatXP((f) => ({ ...f, [id]: xp }));
      setTimeout(() => setFloatXP((f) => ({ ...f, [id]: 0 })), 1100);
      setTimeout(() => setFx((f) => ({ ...f, [id]: undefined })), 700);
      if (!wasAll && doneCount + 1 === HABITS.length) {
        setTimeout(() => onAllComplete?.(), 500);
      }
    } else {
      sndShatter();
    }
  }

  return (
    <div className="sys-window sys-corner p-4 sm:p-5 relative overflow-hidden">
      <div className="scanline" />
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-sm" style={{ background: "var(--rank)", boxShadow: "0 0 8px var(--rank-glow)" }} />
          <h3 className="title-font text-sm tracking-[0.16em] text-[#e7eefc]">DAILY QUESTS</h3>
        </div>
        <span className="num text-xs" style={{ color: all ? "var(--rank)" : "#9aa6bd", textShadow: all ? "0 0 12px var(--rank-glow)" : "none" }}>
          {doneCount} / {HABITS.length} CLEARED
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-2.5">
        {HABITS.map((h, i) => {
          const done = isCompleted(state, h.id);
          const streak = state.habits[h.id]?.streak || 0;
          const Icon = HABIT_ICON[h.id];
          const cracked = !done && state.history[yest] && !state.history[yest].completed.includes(h.id);
          const fxState = fx[h.id];
          return (
            <motion.button
              key={h.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handle(h.id, h.xp)}
              className={`quest-card group relative flex items-center gap-3 px-3.5 py-3.5 text-left ${fxState === "complete" ? "rank-pulse" : ""}`}
              data-done={done}
              data-cracked={!!cracked}
            >
              {/* white flash on completion */}
              <AnimatePresence>
                {fxState === "complete" && (
                  <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "#ffffff" }}
                    initial={{ opacity: 0.55 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  />
                )}
              </AnimatePresence>

              {/* floating +XP */}
              <AnimatePresence>
                {floatXP[h.id] ? (
                  <motion.span
                    className="absolute right-10 top-2 num text-sm pointer-events-none z-20"
                    style={{ color: "var(--rank)", textShadow: "0 0 14px var(--rank-glow)" }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -34 }}
                    transition={{ duration: 1.0 }}
                  >
                    +{floatXP[h.id]} XP
                  </motion.span>
                ) : null}
              </AnimatePresence>

              <span
                className="grid place-items-center w-10 h-10 shrink-0 transition-colors"
                style={{
                  border: `1px solid ${done ? "var(--rank)" : "var(--line)"}`,
                  color: done ? "var(--rank)" : "#9aa6bd",
                  background: done ? "color-mix(in srgb, var(--rank) 10%, transparent)" : "transparent",
                  clipPath: "polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)",
                }}
              >
                {Icon ? <Icon size={20} /> : null}
              </span>

              <div className="flex-1 min-w-0">
                <p className="title-font text-[15px] uppercase tracking-wide" style={{ color: done ? "#f1f6ff" : "#cdd8ec" }}>
                  {h.label}
                </p>
                <p className="mono text-[11px] text-[#80909f] truncate">{cracked ? "⚠ MISSED YESTERDAY — recover it" : h.blurb}</p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {streak > 0 && (
                  <span className="num text-[11px] flex items-center gap-0.5" style={{ color: "var(--rank)" }}>
                    <IconFlame size={12} /> {streak}
                  </span>
                )}
                <span className="num text-[12px]" style={{ color: done ? "var(--rank)" : "#80909f" }}>+{h.xp}</span>
              </div>

              <div
                className="grid place-items-center w-6 h-6 shrink-0 transition-all"
                style={{
                  background: done ? "var(--rank)" : "transparent",
                  border: `1px solid ${done ? "var(--rank)" : "rgba(150,160,180,0.35)"}`,
                  color: done ? "#04060c" : "transparent",
                  clipPath: "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)",
                }}
              >
                <AnimatePresence>
                  {done && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <IconCheck size={15} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
