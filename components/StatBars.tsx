"use client";

import { motion } from "framer-motion";
import { AppState, StatKey } from "@/lib/types";
import { STAT_LABELS } from "@/lib/habits";
import { statCondition } from "@/lib/store";

const COLORS: Record<StatKey, string> = {
  STR: "#ff6b4d",
  INT: "#3da9fc",
  WIL: "#a78bfa",
  CHA: "#ffce54",
  VIT: "#39d98a",
  CRE: "#6fd3ff",
};

export default function StatBars({ state }: { state: AppState }) {
  const cond = statCondition(state);

  return (
    <div className="sys-window sys-corner p-4 relative overflow-hidden">
      <div className="scanline" />
      <h3 className="title-font text-sm tracking-widest text-mana-glow/80 mb-1">CORE STATS</h3>
      <p className="text-[11px] text-mana-glow/45 mb-3">Each bar shows live <span className="text-mana-glow/70">condition</span> — feed the quest and it climbs, neglect it and it decays.</p>
      <div className="grid grid-cols-1 gap-2.5">
        {(Object.keys(STAT_LABELS) as StatKey[]).map((k) => {
          const total = state.stats[k]; // lifetime points (never lost)
          const condPct = Math.round((cond[k] ?? 0) * 100); // current condition 0..100
          const decaying = condPct < 34;
          return (
            <div key={k} className="flex items-center gap-3">
              <span className="w-7 text-center">{STAT_LABELS[k].icon}</span>
              <span className="w-9 title-font text-xs text-mana-glow/70">{k}</span>
              <div className="flex-1 h-2.5 rounded-full bg-void-700 overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: COLORS[k],
                    boxShadow: `0 0 8px ${COLORS[k]}`,
                    opacity: decaying ? 0.55 : 1,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${condPct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span
                className="w-9 text-right text-[11px] title-font"
                style={{ color: decaying ? "#ff7a86" : COLORS[k] }}
                title={`${total} lifetime points`}
              >
                {decaying ? "▼" : "▲"}{condPct}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
