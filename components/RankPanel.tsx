"use client";

import { motion } from "framer-motion";
import { Rank } from "@/lib/types";
import { rankProgress, nextRank } from "@/lib/ranks";
import HunterCharacter from "./HunterCharacter";

export default function RankPanel({ rank, totalXP }: { rank: Rank; totalXP: number }) {
  const progress = rankProgress(totalXP);
  const nxt = nextRank(totalXP);

  return (
    <div className="glass-strong system-border rounded-2xl p-5 overflow-hidden relative">
      {/* scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div
          className="absolute left-0 right-0 h-16 animate-scan"
          style={{ background: `linear-gradient(${rank.glow}, transparent)` }}
        />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs text-mana-glow/70 title-font tracking-widest">THE SYSTEM · HUNTER ASSESSMENT</p>
          <motion.h1
            key={rank.name}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="title-font text-3xl font-black text-glow mt-1"
            style={{ color: rank.color }}
          >
            {rank.name}
          </motion.h1>
          <p className="text-sm text-mana-glow/80 italic">"{rank.title}"</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-mana-glow/60">TOTAL XP</p>
          <p className="title-font text-2xl font-bold" style={{ color: rank.color }}>
            {totalXP.toLocaleString()}
          </p>
        </div>
      </div>

      <HunterCharacter rank={rank} />

      <p className="text-sm text-center text-mana-glow/75 px-2 mb-4 leading-relaxed">{rank.description}</p>

      {nxt ? (
        <div className="relative z-10">
          <div className="flex justify-between text-xs text-mana-glow/70 mb-1">
            <span>{rank.name}</span>
            <span>
              {nxt.threshold - totalXP} XP → {nxt.name}
            </span>
          </div>
          <div className="h-3 rounded-full bg-void-700 overflow-hidden border border-mana/20">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${rank.color}, ${nxt.color})`, boxShadow: `0 0 12px ${rank.glow}` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      ) : (
        <p className="text-center title-font text-gold text-glow">MONARCH — MAX RANK ACHIEVED</p>
      )}
    </div>
  );
}
