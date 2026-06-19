"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppState } from "@/lib/types";
import { addDays, todayStr } from "@/lib/store";

interface HeatmapProps {
  state: AppState;
  days?: number;
}

function intensityLevel(completed: number): number {
  if (completed === 0) return 0;
  if (completed <= 2) return 1;
  if (completed <= 4) return 2;
  if (completed <= 6) return 3;
  return 4;
}

function intensityColor(level: number, rankColor: string): string {
  const opacity = [0.06, 0.25, 0.5, 0.75, 1][level];
  return `color-mix(in srgb, ${rankColor} ${opacity * 100}%, transparent)`;
}

export default function Heatmap({ state, days = 90 }: HeatmapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const today = todayStr();

  const weeks = useMemo(() => {
    const result: { date: string; completed: number }[][] = [];
    // Build backwards from today, group into weeks (7-day columns)
    let currentWeek: { date: string; completed: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = addDays(today, -i);
      const rec = state.history[date];
      currentWeek.push({ date, completed: rec?.completed?.length ?? 0 });
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      // Pad the first week at the top so alignment is consistent
      while (currentWeek.length < 7) {
        currentWeek.unshift({ date: "", completed: -1 });
      }
      result.push(currentWeek);
    }
    return result;
  }, [state.history, today, days]);

  const maxCompleted = useMemo(() => {
    return Math.max(1, ...weeks.flatMap((w) => w.map((d) => d.completed).filter((c) => c >= 0)));
  }, [weeks]);

  const rankColor = state.rankIndex >= 0 ? "var(--rank)" : "#4f9eff";

  // Stagger delay wave: left-to-right, bottom-to-top
  const totalCells = weeks.length * 7;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="label">QUEST HISTORY</p>
        <p className="mono text-[10px] text-[#8993a6]">
          {days} DAYS ·{" "}
          <span style={{ color: rankColor }}>
            {weeks.flatMap((w) => w).filter((d) => d.completed > 0).length} ACTIVE
          </span>
        </p>
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-1 scrollbar-none" style={{ direction: "rtl" }}>
        {/* Reverse the visual order so today is on the right */}
        {[...weeks].reverse().map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]" style={{ direction: "ltr" }}>
            {week.map((day, dayIdx) => {
              if (day.completed < 0) {
                return <div key={dayIdx} className="w-[10px] h-[10px] rounded-[2px]" />;
              }
              const level = intensityLevel(day.completed);
              const cellIndex =
                totalCells - ((weeks.length - 1 - [...weeks].reverse().indexOf(week)) * 7 + dayIdx) - 1;
              const delay = cellIndex * 0.003;

              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay,
                    duration: 0.25,
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                  className="w-[10px] h-[10px] rounded-[2px] relative cursor-pointer"
                  style={{
                    background: intensityColor(level, rankColor),
                    border:
                      day.date === today
                        ? `1px solid ${rankColor}`
                        : "1px solid transparent",
                  }}
                  onMouseEnter={() => setHovered(day.date)}
                  onMouseLeave={() => setHovered(null)}
                  onTouchStart={() => setHovered(day.date)}
                  title={`${day.date}: ${day.completed} quest${day.completed === 1 ? "" : "s"}`}
                >
                  {hovered === day.date && (
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 px-2 py-1 rounded whitespace-nowrap pointer-events-none"
                      style={{
                        background: "rgba(4,5,11,0.95)",
                        border: "1px solid var(--line-strong)",
                        fontSize: 10,
                      }}
                    >
                      <span className="term text-[10px] text-[#e7eefc]">
                        {day.date} · {day.completed}/{maxCompleted}
                      </span>
                      {day.date === today && (
                        <span className="term text-[9px] text-[color:var(--rank)] ml-1">TODAY</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span className="mono text-[9px] text-[#8993a6]">LESS</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            className="w-[10px] h-[10px] rounded-[2px]"
            style={{ background: intensityColor(lvl, rankColor) }}
          />
        ))}
        <span className="mono text-[9px] text-[#8993a6]">MORE</span>
      </div>
    </div>
  );
}
