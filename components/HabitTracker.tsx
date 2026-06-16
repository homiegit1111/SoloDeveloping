"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { HABITS } from "@/lib/habits";
import { isCompleted, todayStr } from "@/lib/store";

export default function HabitTracker({
  onAllComplete,
}: {
  onAllComplete?: () => void;
}) {
  const { state, toggle } = useApp();
  const today = todayStr();
  const doneCount = state.history[today]?.completed.length || 0;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="title-font text-sm tracking-widest text-mana-glow/80">DAILY QUESTS</h3>
        <span className="text-xs title-font" style={{ color: doneCount === HABITS.length ? "#ffce54" : "#6fd3ff" }}>
          {doneCount}/{HABITS.length} CLEARED
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {HABITS.map((h, i) => {
          const done = isCompleted(state, h.id);
          const streak = state.habits[h.id]?.streak || 0;
          return (
            <motion.button
              key={h.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const wasAllBefore = doneCount === HABITS.length;
                toggle(h.id);
                if (!done && !wasAllBefore && doneCount + 1 === HABITS.length) onAllComplete?.();
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all border ${
                done
                  ? "bg-mana/10 border-mana/50 shadow-mana"
                  : "bg-void-700/60 border-void-500/50 hover:border-mana/30"
              }`}
            >
              <span className="text-2xl">{h.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`title-font text-sm ${done ? "text-mana-glow" : "text-mana-glow/85"}`}>{h.label}</p>
                <p className="text-xs text-mana-glow/50 truncate">{h.blurb}</p>
              </div>
              <div className="flex flex-col items-end">
                {streak > 0 && (
                  <span className="text-xs text-gold flex items-center gap-0.5">🔥{streak}</span>
                )}
                <span className="text-[10px] text-mana-glow/40">+{h.xp}xp</span>
              </div>
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                  done ? "bg-mana border-mana text-void-900" : "border-mana/40 text-transparent"
                }`}
              >
                <AnimatePresence>
                  {done && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="font-bold">
                      ✓
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
