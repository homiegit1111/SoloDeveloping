"use client";

import { useMemo } from "react";
import { AppState, StatKey } from "@/lib/types";
import { ALL_HABIT_IDS, HABIT_BY_ID } from "@/lib/habits";
import { addDays, todayStr } from "@/lib/store";

interface SparklineProps {
  state: AppState;
  stat: StatKey;
  days?: number;
  width?: number;
  height?: number;
  color?: string;
}

function statHistory(
  state: AppState,
  stat: StatKey,
  days: number
): number[] {
  const ids = ALL_HABIT_IDS.filter((id) => HABIT_BY_ID[id].stat === stat);
  if (!ids.length) return Array(days).fill(0);

  const result: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(todayStr(), -i);
    let num = 0, den = 0;
    const rec = state.history[d];
    for (const id of ids) {
      den += 1;
      if (rec?.completed.includes(id)) num += 1;
    }
    result.push(den > 0 ? num / den : 0);
  }
  return result;
}

export default function Sparkline({
  state,
  stat,
  days = 30,
  width = 80,
  height = 24,
  color = "var(--rank)",
}: SparklineProps) {
  const data = useMemo(() => statHistory(state, stat, days), [state, stat, days]);
  const maxVal = Math.max(0.05, ...data);
  const minVal = 0;

  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (days - 1)) * innerW;
    const y = pad + innerH - (v / maxVal) * innerH;
    return `${x},${y}`;
  });

  const areaPoints = [
    `${pad},${pad + innerH}`,
    ...points,
    `${pad + innerW},${pad + innerH}`,
  ].join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-label={`${stat} 30-day sparkline`}
    >
      {/* Background grid lines */}
      {[0.25, 0.5, 0.75].map((pct) => (
        <line
          key={pct}
          x1={pad}
          y1={pad + innerH * (1 - pct)}
          x2={pad + innerW}
          y2={pad + innerH * (1 - pct)}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={0.5}
        />
      ))}
      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill={`color-mix(in srgb, ${color} 12%, transparent)`}
      />
      {/* Line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Last value dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(",")[0]}
          cy={points[points.length - 1].split(",")[1]}
          r={2}
          fill={color}
        />
      )}
    </svg>
  );
}
