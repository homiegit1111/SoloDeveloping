"use client";

import { motion } from "framer-motion";
import { AppState, StatKey } from "@/lib/types";
import { STAT_LABELS } from "@/lib/habits";
import { statCondition } from "@/lib/store";
import { STAT_ICON } from "@/components/icons";
import Sparkline from "@/components/Sparkline";

const COLORS: Record<StatKey, string> = {
  STR: "#ff6b4d",
  INT: "#3B82F6",
  WIL: "#8B5CF6",
  CHA: "#C9A84C",
  VIT: "#22C55E",
  CRE: "#22d3ee",
};

export default function StatBars({ state }: { state: AppState }) {
  const cond = statCondition(state);

  return (
    <div className="sys-window sys-corner p-4 sm:p-5 relative overflow-hidden">
      <div className="scanline" />
      <div className="relative z-10 flex items-center gap-2 mb-1">
        <span className="w-1.5 h-4 rounded-sm" style={{ background: "var(--rank)", boxShadow: "0 0 8px var(--rank-glow)" }} />
        <h3 className="title-font text-sm tracking-[0.16em] text-[#e7eefc]">CORE STATS</h3>
      </div>
      <p className="relative z-10 mono text-[11px] text-[#80909f] mb-4">
        Live <span style={{ color: "var(--rank)" }}>condition</span> — feed the quest and it climbs, neglect it and it decays.
      </p>
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-3.5">
        {(Object.keys(STAT_LABELS) as StatKey[]).map((k) => {
          const condPct = Math.round((cond[k] ?? 0) * 100);
          const decaying = condPct < 34;
          const Icon = STAT_ICON[k];
          return (
            <div key={k} className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="shrink-0" style={{ color: COLORS[k] }}>{Icon ? <Icon size={18} /> : null}</span>
                <span className="w-9 title-font text-xs text-[#cdd8ec] shrink-0">{k}</span>
                <div className="flex-1 h-[7px] bg-[rgba(255,255,255,0.05)] overflow-hidden relative">
                  <motion.div
                    className="h-full"
                    style={{
                      background: COLORS[k],
                      boxShadow: decaying ? "none" : `0 0 8px ${COLORS[k]}`,
                      opacity: decaying ? 0.5 : 1,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${condPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span
                  className="num w-10 text-right text-[11px] shrink-0"
                  style={{ color: decaying ? "#ff7b7b" : COLORS[k] }}
                  title={`${state.stats[k]} lifetime points`}
                >
                  {decaying ? "▼" : "▲"}{condPct}
                </span>
              </div>
              <div className="flex items-center gap-3 pl-[30px]">
                <div className="flex-1" />
                <Sparkline state={state} stat={k} color={COLORS[k]} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
