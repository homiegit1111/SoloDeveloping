"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Rank } from "@/lib/types";
import HunterCanvas from "./HunterCanvas";
import SystemWindow, { useTypewriter } from "./SystemWindow";
import { rankUp as sndRankUp } from "@/lib/sound";

// ============================================================
// RANK UP CEREMONY — the cinematic the whole app builds toward.
// black -> silence -> deep pulse -> "RANK ASSESSMENT COMPLETE"
// burns in -> the new Hunter assembles from darkness -> eyes
// burst -> System promotion window -> return (app tints to rank).
// ============================================================

// rank letter -> kanji-style glyph that burns into center
const GLYPH: Record<string, string> = {
  "E-RANK": "E",
  "D-RANK": "D",
  "C-RANK": "C",
  "B-RANK": "B",
  "A-RANK": "A",
  "S-RANK": "覇", // supremacy
  "SS-RANK": "絶", // absolute
  UNRANKED: "—",
};

type Phase = "black" | "pulse" | "title" | "assemble" | "promote";

export default function RankUpCeremony({ rank, open, onClose }: { rank: Rank; open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("black");

  useEffect(() => {
    if (!open) return;
    setPhase("black");
    const t1 = setTimeout(() => setPhase("pulse"), 550);
    const t2 = setTimeout(() => {
      setPhase("title");
      sndRankUp();
    }, 1150);
    const t3 = setTimeout(() => setPhase("assemble"), 2550);
    const t4 = setTimeout(() => setPhase("promote"), 4350);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [open]);

  const c = rank.color;
  const glow = rank.glow;
  const promoText = `You have been promoted to ${rank.name}. The shadow grows stronger.`;
  const typed = useTypewriter(promoText, 22, phase === "promote");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
          style={{ ["--rank" as any]: c, ["--rank-glow" as any]: glow } as React.CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* pure black void */}
          <div className="absolute inset-0 bg-black" />

          {/* deep pulse from center */}
          {phase === "pulse" && (
            <motion.div
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{ marginLeft: -10, marginTop: -10, width: 20, height: 20, background: c }}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 120, opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          )}

          {/* title burns in */}
          {(phase === "title" || phase === "assemble") && (
            <motion.div
              className="absolute inset-x-0 top-[14%] text-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "assemble" ? 0.25 : 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="label !tracking-[0.5em] mb-3" style={{ color: c }}>RANK ASSESSMENT COMPLETE</p>
              <p className="title-font text-7xl burn-in" style={{ color: c, textShadow: `0 0 40px ${glow}` }}>
                {GLYPH[rank.name] ?? rank.name.charAt(0)}
              </p>
            </motion.div>
          )}

          {/* the new Hunter assembles from darkness */}
          {(phase === "assemble" || phase === "promote") && (
            <motion.div
              className="absolute inset-0 flex items-end justify-center"
              initial={{ opacity: 0, filter: "blur(14px)", scale: 0.92 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            >
              <div className="w-full max-w-md" style={{ height: "82vh" }}>
                <HunterCanvas rank={rank} condition={1} fill />
              </div>
            </motion.div>
          )}

          {/* eyes burst flash on assemble */}
          {phase === "assemble" && (
            <motion.div
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle at 50% 32%, ${glow}, transparent 45%)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 1.0, times: [0, 0.3, 1], delay: 0.7 }}
            />
          )}

          {/* promotion system window */}
          {phase === "promote" && (
            <motion.div
              className="absolute inset-x-0 bottom-[8%] flex justify-center px-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SystemWindow label="SYSTEM" maxWidth="max-w-md" onDismiss={onClose} dismissLabel="ARISE" autoSound={false}>
                <p className="title-font text-2xl mb-1" style={{ color: c, textShadow: `0 0 22px ${glow}` }}>
                  {rank.name} <span className="text-base opacity-70">· {rank.title}</span>
                </p>
                <p className="mono text-sm text-[#c3cde0] leading-relaxed min-h-[3.5em] caret">{typed}</p>
              </SystemWindow>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
