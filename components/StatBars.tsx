"use client";

import { motion } from "framer-motion";
import { AppState, StatKey } from "@/lib/types";
import { STAT_LABELS } from "@/lib/habits";

const COLORS: Record<StatKey, string> = {
  STR: "#ff6b4d",
  INT: "#3da9fc",
  WIL: "#a78bfa",
  CHA: "#ffce54",
  VIT: "#39d98a",
  CRE: "#6fd3ff",
};

export default function StatBars({ state }: { state: AppState }) {
  const max = Math.max(10, ...Object.values(state.stats));
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="title-font text-sm tracking-widest text-mana-glow/80 mb-3">CORE STATS</h3>
      <div className="grid grid-cols-1 gap-2.5">
        {(Object.keys(STAT_LABELS) as StatKey[]).map((k) => {
          const val = state.stats[k];
          const pct = Math.round((val / max) * 100);
          return (
            <div key={k} className="flex items-center gap-3">
              <span className="w-7 text-center">{STAT_LABELS[k].icon}</span>
              <span className="w-10 title-font text-xs text-mana-glow/70">{k}</span>
              <div className="flex-1 h-2.5 rounded-full bg-void-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: COLORS[k], boxShadow: `0 0 8px ${COLORS[k]}` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span className="w-8 text-right text-xs text-mana-glow/80">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
