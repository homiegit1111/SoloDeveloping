"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { todayStr, addDays, dayNumber, daysBetween, freezesAvailable, freezesEarned } from "@/lib/store";

// Streak Freeze: earn 1 per 7 active days. Apply it to a past missed day to
// bridge the chain (keeps streaks alive, awards NO XP). Adherence > perfection.
export default function FreezePanel() {
  const { state, applyFreeze, removeFreeze } = useApp();
  const [open, setOpen] = useState(false);

  const avail = freezesAvailable(state);
  const earned = freezesEarned(state);
  const used = state.freezeDays || [];
  const day = dayNumber(state);

  // Candidate days: the last 6 days that were missed (not all 7 done) and not the future.
  const today = todayStr();
  const start = state.startDate;
  const candidates: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const d = addDays(today, -i);
    if (d < start) break;
    const rec = state.history[d];
    const allDone = rec && rec.completed.length >= 7;
    if (!allDone && !used.includes(d)) candidates.push(d);
  }

  return (
    <div className="glass rounded-2xl p-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between">
        <p className="title-font text-sm text-mana-glow/80">🛡️ STREAK FREEZE</p>
        <span className="text-xs text-mana-glow/60">
          {avail} ready{used.length ? ` · ${used.length} used` : ""} {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-[11px] text-mana-glow/55 leading-relaxed">
            Earn 1 shield every 7 active days ({earned} earned so far). Spend one on a missed day to keep your
            streaks alive — it bridges the chain but grants no XP. Life happens; don&apos;t let one slip end the war.
          </p>

          {candidates.length === 0 ? (
            <p className="text-[11px] text-mana-glow/40">No recent missed days to protect. Stay hard. 🔥</p>
          ) : (
            <div className="space-y-2">
              {candidates.map((d) => {
                const rec = state.history[d];
                const done = rec?.completed.length || 0;
                const dn = day - daysBetween(d, today);
                return (
                  <div key={d} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                    <span className="text-xs text-mana-glow/70">
                      Day {dn} ({d}) — {done}/7 done
                    </span>
                    <button
                      disabled={avail <= 0}
                      onClick={() => applyFreeze(d)}
                      className="text-[11px] title-font px-2 py-1 rounded-md border border-mana/40 text-mana-glow disabled:opacity-30 hover:bg-mana/20"
                    >
                      FREEZE
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {used.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] text-mana-glow/40 mb-1">Protected days:</p>
              <div className="flex flex-wrap gap-1">
                {used.map((d) => (
                  <button
                    key={d}
                    onClick={() => removeFreeze(d)}
                    title="Tap to remove this freeze"
                    className="text-[10px] px-2 py-0.5 rounded-full border border-arise/30 text-arise/80 hover:line-through"
                  >
                    🛡️ {d} ✕
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
