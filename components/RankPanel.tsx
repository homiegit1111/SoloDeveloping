"use client";

import { motion } from "framer-motion";
import { Rank } from "@/lib/types";
import { rankProgress, nextRank } from "@/lib/ranks";
import HunterCharacter from "./HunterCharacter";

export default function RankPanel({
  rank,
  totalXP,
  condition = 0,
  penalty = false,
}: {
  rank: Rank;
  totalXP: number;
  condition?: number;
  penalty?: boolean;
}) {
  const progress = rankProgress(totalXP);
  const nxt = nextRank(totalXP);
  const cond = Math.max(0, Math.min(1, condition));

  const vit =
    penalty ? { label: "SHACKLED", color: "#ef4444" } :
    cond >= 0.7 ? { label: "BLAZING", color: rank.color } :
    cond >= 0.45 ? { label: "STEADY", color: rank.color } :
    cond >= 0.25 ? { label: "FADING", color: "#C9A84C" } :
    { label: "WEAKENED", color: "#ef4444" };

  return (
    <div className="sys-window sys-corner relative overflow-hidden">
      <div className="scanline" />

      {/* top HUD row — rank badge + XP */}
      <div className="relative z-10 flex items-start justify-between px-4 pt-4">
        <div>
          <p className="label">SYSTEM · HUNTER ASSESSMENT</p>
          <motion.h1
            key={rank.name}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="title-font text-4xl mt-1 leading-none"
            style={{ color: rank.color, textShadow: `0 0 24px ${rank.glow}` }}
          >
            {rank.name}
          </motion.h1>
          <p className="mono text-xs text-[#9aa6bd] italic mt-1">&ldquo;{rank.title}&rdquo;</p>
        </div>
        <div className="text-right">
          <p className="label">POWER · XP</p>
          <p className="num text-3xl mt-1 leading-none" style={{ color: rank.color, textShadow: `0 0 18px ${rank.glow}` }}>
            {totalXP.toLocaleString()}
          </p>
        </div>
      </div>

      {/* full-bleed living Hunter */}
      <div className="relative z-10 -my-2">
        <HunterCharacter rank={rank} condition={cond} penalty={penalty} height={300} />
      </div>

      {/* VITALITY power bar — thin electric line */}
      <div className="relative z-10 px-5">
        <div className="flex justify-between items-center text-[11px] mb-1">
          <span className="label !tracking-[0.2em]">VITALITY</span>
          <span className="title-font tracking-widest" style={{ color: vit.color, textShadow: `0 0 12px ${vit.color}` }}>
            {vit.label}
          </span>
        </div>
        <div className="h-1.5 bg-[rgba(255,255,255,0.05)] overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: vit.color, boxShadow: `0 0 12px ${vit.color}` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(cond * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="mono text-[11px] text-[#7c8aa3] mt-2 leading-relaxed">
          {penalty
            ? "The System has shackled the Hunter. Clear today's quests to break free."
            : cond >= 0.7
            ? "The aura blazes. Recent quests have made the Hunter strong."
            : cond >= 0.45
            ? "Holding steady. Feed every quest to ignite full power."
            : cond >= 0.25
            ? "The flame is fading. Missed quests are draining his power."
            : "The Hunter is weakening. Complete quests today to reignite the aura."}
        </p>
      </div>

      <p className="relative z-10 mono text-sm text-center text-[#9aa6bd] px-5 mt-3 mb-4 leading-relaxed">
        {rank.description}
      </p>

      {/* ascension progress */}
      <div className="relative z-10 px-5 pb-5">
        {nxt ? (
          <>
            <div className="flex justify-between text-[11px] text-[#8a96ad] mb-1">
              <span className="label !tracking-[0.18em]">{rank.name}</span>
              <span className="mono">{(nxt.threshold - totalXP).toLocaleString()} XP → {nxt.name}</span>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.05)] overflow-hidden border-l-2" style={{ borderColor: rank.color }}>
              <motion.div
                className="h-full"
                style={{ background: `linear-gradient(90deg, ${rank.color}, ${nxt.color})`, boxShadow: `0 0 14px ${rank.glow}` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </>
        ) : (
          <p className="text-center title-font text-xl" style={{ color: rank.color, textShadow: `0 0 20px ${rank.glow}` }}>
            ABSOLUTE BEING — MAX ASCENSION
          </p>
        )}
      </div>
    </div>
  );
}
