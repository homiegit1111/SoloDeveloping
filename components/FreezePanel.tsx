"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { todayStr, addDays, dayNumber, daysBetween, freezesAvailable, freezesEarned } from "@/lib/store";

// Streak Freeze: earn 1 per 7 active days. Apply it to a past missed day to
// bridge the chain (keeps streaks alive, awards NO XP). Adherence > perfection.
export default function FreezePanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { state, applyFreeze, removeFreeze } = useApp();
  const [open, setOpen] = useState(defaultOpen);

  const avail = freezesAvailable(state);
  const earned = freezesEarned(state);
  const used = state.freezeDays || [];
  const day = dayNumber(state);

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
    <div className="glass p-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between">
        <p className="title-font text-sm tracking-[0.16em] text-[#dcecff]">STREAK FREEZE</p>
        <span className="term text-[11px]" style={{ color: avail > 0 ? "var(--rank)" : "#8993a6" }}>
          {avail} ready{used.length ? ` · ${used.length} used` : ""} {open ? "▲" : "▼"}
        </span>
      </button>

      {!open && (
        <p className="mono text-[12px] text-[#8993a6] leading-relaxed mt-1">
          Earn a shield every 7 active days — spend one to bridge a missed day. Adherence beats perfection.
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          <p className="mono text-[12px] text-[#8993a6] leading-relaxed">
            Earn 1 shield every 7 active days ({earned} earned). Spend one on a missed day to keep your streaks
            alive — it bridges the chain but grants no XP. Don&apos;t let one slip end the war.
          </p>

          {candidates.length === 0 ? (
            <p className="mono text-[12px]" style={{ color: "#6f7888" }}>No recent missed days to protect. Stay hard.</p>
          ) : (
            <div className="space-y-2">
              {candidates.map((d) => {
                const rec = state.history[d];
                const done = rec?.completed.length || 0;
                const dn = day - daysBetween(d, today);
                return (
                  <div key={d} className="flex items-center justify-between px-3 py-2 border" style={{ borderColor: "var(--line)", background: "rgba(8,10,18,0.5)" }}>
                    <span className="mono text-[12px] text-[#aeb6c6]">
                      Day {dn} · {d} — {done}/7
                    </span>
                    <button
                      disabled={avail <= 0}
                      onClick={() => applyFreeze(d)}
                      className="term text-[11px] px-3 py-1 border hover:text-[color:var(--rank)] disabled:opacity-30 transition-colors"
                      style={{ borderColor: "var(--line-strong)" }}
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
              <p className="label mb-1.5">PROTECTED DAYS</p>
              <div className="flex flex-wrap gap-1.5">
                {used.map((d) => (
                  <button
                    key={d}
                    onClick={() => removeFreeze(d)}
                    title="Tap to remove this freeze"
                    className="term text-[10px] px-2 py-0.5 border hover:line-through transition-all"
                    style={{ borderColor: "var(--line-strong)", color: "var(--rank)" }}
                  >
                    {d} ✕
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
