"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Rank } from "@/lib/types";
import { rankProgress, nextRank } from "@/lib/ranks";
import HunterCanvas from "./HunterCanvas";
import { useApp } from "@/lib/context";

const HunterModel3D = dynamic(() => import("./HunterModel3D"), { ssr: false });

function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

// ============================================================
// HUNTER STAGE — the HQ centerpiece. The Hunter fills the whole
// stage (full height, centered, breathing, aura blazing). The
// System assessment HUD floats over him: rank + XP up top,
// vitality + ascension bar along the bottom. He IS the screen.
// ============================================================

export default function HunterStage({
  rank,
  name,
  totalXP,
  condition = 0,
  penalty = false,
}: {
  rank: Rank;
  name?: string;
  totalXP: number;
  condition?: number;
  penalty?: boolean;
}) {
  const { state } = useApp();
  const prefer3d = !!state.settings.use3dModel;
  const [webglOk, setWebglOk] = useState(false);

  useEffect(() => {
    setWebglOk(supportsWebGL());
  }, []);

  const use3d = prefer3d && webglOk;

  const progress = rankProgress(totalXP);
  const nxt = nextRank(totalXP);
  const cond = Math.max(0, Math.min(1, condition));

  const vit = penalty
    ? { label: "SHACKLED", color: "#ef4444" }
    : cond >= 0.7
      ? { label: "BLAZING", color: rank.color }
      : cond >= 0.45
        ? { label: "STEADY", color: rank.color }
        : cond >= 0.25
          ? { label: "FADING", color: "#C9A84C" }
          : { label: "WEAKENED", color: "#ef4444" };

  return (
    <div className="sys-window sys-corner relative overflow-hidden h-[50vh] min-h-[300px] lg:h-[72vh] lg:min-h-[560px]">
      <div className="scanline" />

      {/* full-bleed living Hunter — fills the entire stage */}
      <div className="absolute inset-0 z-0">
        {use3d ? (
          <HunterModel3D rank={rank} condition={cond} penalty={penalty} />
        ) : (
          <HunterCanvas rank={rank} condition={cond} penalty={penalty} fill />
        )}
      </div>

      {/* top HUD — rank assessment + power */}
      <div className="relative z-10 flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pointer-events-none">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="label">HUNTER</p>
            {name ? (
              <p
                className="term text-[11px] truncate max-w-[150px]"
                style={{ color: rank.color }}
              >
                {name}
              </p>
            ) : null}
          </div>
          <motion.h1
            key={rank.name}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="title-font text-[1.9rem] sm:text-4xl lg:text-6xl mt-1 leading-none"
            style={{ color: rank.color, textShadow: `0 0 26px ${rank.glow}` }}
          >
            {rank.name}
          </motion.h1>
          <p className="mono text-[11px] sm:text-xs lg:text-sm text-[#9aa6bd] italic mt-1 truncate">
            &ldquo;{rank.title}&rdquo;
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="label">POWER · XP</p>
          <p
            className="num text-2xl sm:text-3xl lg:text-5xl mt-1 leading-none"
            style={{ color: rank.color, textShadow: `0 0 18px ${rank.glow}` }}
          >
            {totalXP.toLocaleString()}
          </p>
        </div>
      </div>

      {/* bottom HUD — vitality + ascension, sitting on a fade so the figure reads */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-16 bg-gradient-to-t from-[#03040a] via-[#03040add] to-transparent">
        <div className="flex justify-between items-center text-[11px] mb-1">
          <span className="label !tracking-[0.2em]">VITALITY</span>
          <span
            className="title-font tracking-widest"
            style={{ color: vit.color, textShadow: `0 0 12px ${vit.color}` }}
          >
            {vit.label}
          </span>
        </div>
        <div className="h-1.5 bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className="h-full"
            style={{
              background: vit.color,
              boxShadow: `0 0 12px ${vit.color}`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(cond * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* ascension progress */}
        <div className="mt-3">
          {nxt ? (
            <>
              <div className="flex justify-between text-[11px] text-[#8a96ad] mb-1">
                <span className="label !tracking-[0.18em]">{rank.name}</span>
                <span className="mono">
                  {(nxt.threshold - totalXP).toLocaleString()} XP → {nxt.name}
                </span>
              </div>
              <div
                className="h-2 bg-[rgba(255,255,255,0.05)] overflow-hidden border-l-2"
                style={{ borderColor: rank.color }}
              >
                <motion.div
                  className="h-full"
                  style={{
                    background: `linear-gradient(90deg, ${rank.color}, ${nxt.color})`,
                    boxShadow: `0 0 14px ${rank.glow}`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </>
          ) : (
            <p
              className="text-center title-font text-lg lg:text-xl"
              style={{ color: rank.color, textShadow: `0 0 20px ${rank.glow}` }}
            >
              ABSOLUTE BEING — MAX ASCENSION
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
