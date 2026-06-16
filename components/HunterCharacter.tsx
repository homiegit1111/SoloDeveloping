"use client";

import { motion } from "framer-motion";
import { Rank } from "@/lib/types";

// ============================================================
// THE LIVING HUNTER
// He is ALIVE. Two forces shape him:
//   • rank   → permanent power tier (armor, weapon, crown, shadow soldiers)
//   • condition (0..1) → his CURRENT vitality from your recent quests.
// High condition  → he stands tall, blazing aura, tall bright flames, soldiers awaken.
// Low condition   → he slumps, aura dims to embers, cracks of weakness show.
// Miss your quests and you literally watch him wither; feed them and he ignites.
// ============================================================

type Props = {
  rank: Rank;
  /** 0..1 overall vitality (from store.overallCondition) */
  condition: number;
};

export default function HunterCharacter({ rank, condition }: Props) {
  const tier = rank.index;
  const c = rank.color;
  const glow = rank.glow;

  // clamp
  const cond = Math.max(0, Math.min(1, condition));
  const weak = cond < 0.34;
  const strong = cond >= 0.7;

  // condition-driven visuals
  const flameH = 40 + cond * 120; // flame tongue height
  const flameOpacity = 0.25 + cond * 0.75;
  const auraScale = 0.85 + cond * 0.5;
  const eyeGlow = 0.4 + cond * 0.6;
  const slump = weak ? 6 : 0; // hunched when weak
  const bob = strong ? 6 : 3;
  // flame colour: dim grey-blue when weak → rank colour → bright cyan/white tips when strong
  const flameBase = weak ? "#3a4668" : c;
  const flameTip = strong ? "#dffaff" : weak ? "#6f86c0" : rank.glow;

  // number of flame tongues scales with vitality
  const tongues = weak ? 3 : strong ? 7 : 5;

  return (
    <div className="relative flex items-center justify-center w-full" style={{ height: 280 }}>
      {/* ---------- AURA RINGS (scale + brightness track condition) ---------- */}
      {Array.from({ length: Math.min(tier + 1, 4) }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: (120 + i * 34) * auraScale,
            height: (120 + i * 34) * auraScale,
            border: `1px solid ${c}`,
            opacity: (0.1 + cond * 0.3),
            boxShadow: `0 0 ${(14 + i * 8) * (0.5 + cond)}px ${glow}`,
          }}
          animate={{ scale: [1, 1.05 + cond * 0.05, 1], opacity: [0.08, 0.12 + cond * 0.3, 0.08] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* ---------- FLAME / SHADOW AURA (the centrepiece) ---------- */}
      <div
        className="absolute bottom-8 flex items-end justify-center gap-[3px]"
        style={{ width: 150, height: flameH + 30, filter: `drop-shadow(0 0 14px ${glow})` }}
      >
        {Array.from({ length: tongues }).map((_, i) => {
          const center = (tongues - 1) / 2;
          const dist = Math.abs(i - center);
          const h = flameH * (1 - dist * 0.16);
          const w = 26 - dist * 2;
          return (
            <motion.svg
              key={i}
              width={w}
              height={h}
              viewBox="0 0 30 100"
              preserveAspectRatio="none"
              style={{ transformOrigin: "bottom center", opacity: flameOpacity }}
              animate={{ scaleY: [1, 1.14, 0.92, 1.06, 1], scaleX: [1, 0.94, 1.05, 0.97, 1] }}
              transition={{ duration: 1.1 + i * 0.13, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
            >
              <defs>
                <linearGradient id={`fl${i}`} x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={flameBase} stopOpacity="0.15" />
                  <stop offset="45%" stopColor={flameBase} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={flameTip} stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <path
                d="M15 100 C 2 70, 6 50, 15 0 C 24 50, 28 70, 15 100 Z"
                fill={`url(#fl${i})`}
              />
            </motion.svg>
          );
        })}
      </div>

      {/* rising embers when strong */}
      {!weak &&
        Array.from({ length: strong ? 10 : 5 }).map((_, i) => (
          <motion.span
            key={`e${i}`}
            className="absolute rounded-full"
            style={{
              width: 3,
              height: 3,
              left: `${38 + (i % 5) * 6}%`,
              bottom: 60,
              background: flameTip,
              boxShadow: `0 0 6px ${flameTip}`,
            }}
            animate={{ y: [-0, -90 - cond * 60], opacity: [0.9, 0], x: [0, (i % 2 ? 1 : -1) * 14] }}
            transition={{ duration: 2.2 + (i % 3) * 0.6, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
          />
        ))}

      {/* ground glow */}
      <div
        className="absolute bottom-7 rounded-[100%]"
        style={{ width: 160, height: 26, background: glow, filter: "blur(15px)", opacity: 0.4 + cond * 0.5 }}
      />

      {/* ---------- SHADOW SOLDIERS (S-rank, only awaken when strong) ---------- */}
      {tier >= 6 &&
        [-1, 1].map((side) => (
          <motion.div
            key={side}
            className="absolute"
            style={{ left: side < 0 ? "6%" : "auto", right: side > 0 ? "6%" : "auto", bottom: 36, opacity: strong ? 1 : 0.25 }}
            animate={{ y: [0, -6, 0], opacity: strong ? [0.5, 0.95, 0.5] : [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, delay: side < 0 ? 0 : 1 }}
          >
            <svg width="36" height="64" viewBox="0 0 34 60">
              <path d="M17 4 L24 16 L21 40 L17 56 L13 40 L10 16 Z" fill={c} opacity="0.55" />
              <circle cx="17" cy="10" r="5" fill={c} opacity="0.8" />
            </svg>
          </motion.div>
        ))}

      {/* ---------- THE HUNTER ---------- */}
      <motion.svg
        width="150"
        height="240"
        viewBox="0 0 150 240"
        className="relative z-10"
        style={{ filter: `drop-shadow(0 0 ${8 + cond * 12}px ${glow})`, transformOrigin: "bottom center" }}
        animate={{ y: [0, -bob, 0], rotate: weak ? [-1.5, 0.5, -1.5] : 0 }}
        transition={{ duration: weak ? 2.4 : 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={0.35 + cond * 0.6} />
            <stop offset="100%" stopColor="#0a0c1b" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* whole body droops a little when weak via translate */}
        <g transform={`translate(0 ${slump})`}>
          {/* Cloak (from D-rank) */}
          {tier >= 2 && (
            <path d="M40 80 Q20 140 30 210 L55 205 L60 100 Z M110 80 Q130 140 120 210 L95 205 L90 100 Z" fill={c} opacity={0.1 + cond * 0.15} />
          )}

          {/* Legs */}
          <path d="M62 150 L58 215 L70 215 L74 160 Z" fill="url(#bodyGrad)" />
          <path d="M88 150 L92 215 L80 215 L76 160 Z" fill="url(#bodyGrad)" />

          {/* Torso / armor */}
          <path d="M55 90 Q75 80 95 90 L92 155 Q75 165 58 155 Z" fill="url(#bodyGrad)" stroke={c} strokeWidth={tier >= 4 ? 2 : 1} strokeOpacity={0.4 + cond * 0.5} />
          {tier >= 3 && <path d="M62 102 L88 102 L86 118 L64 118 Z" fill={c} opacity={0.15 + cond * 0.2} />}
          {tier >= 5 && (
            <>
              <path d="M55 90 L48 106 L55 110 Z" fill={c} opacity={0.3 + cond * 0.3} />
              <path d="M95 90 L102 106 L95 110 Z" fill={c} opacity={0.3 + cond * 0.3} />
            </>
          )}

          {/* cracks of weakness */}
          {weak && (
            <g stroke="#1a2238" strokeWidth="1.2" opacity="0.7">
              <path d="M70 100 L66 120 L72 134" fill="none" />
              <path d="M82 108 L86 126" fill="none" />
            </g>
          )}

          {/* Arms */}
          <path d="M55 94 L44 130 L52 134 L62 102 Z" fill="url(#bodyGrad)" />
          <path d="M95 94 L106 130 L98 134 L88 102 Z" fill="url(#bodyGrad)" />

          {/* Neck + Head */}
          <rect x="70" y="68" width="10" height="14" fill="url(#bodyGrad)" />
          <circle cx="75" cy="56" r="16" fill="url(#bodyGrad)" stroke={c} strokeWidth="1.5" strokeOpacity={0.4 + cond * 0.5} />

          {/* Eyes — brightness tracks condition */}
          <motion.g
            animate={{ opacity: [eyeGlow * 0.7, eyeGlow, eyeGlow * 0.7] }}
            transition={{ duration: weak ? 3 : 1.6, repeat: Infinity }}
          >
            <circle cx="69" cy="56" r="2.6" fill={strong ? "#ffffff" : flameTip} style={{ filter: `drop-shadow(0 0 ${2 + cond * 5}px ${flameTip})` }} />
            <circle cx="81" cy="56" r="2.6" fill={strong ? "#ffffff" : flameTip} style={{ filter: `drop-shadow(0 0 ${2 + cond * 5}px ${flameTip})` }} />
          </motion.g>

          {/* Weapon (dagger C–B rank, greatsword A+); brightens with condition */}
          {tier >= 3 && tier < 5 && (
            <path d="M106 128 L116 106 L120 110 L110 132 Z" fill={c} opacity={0.5 + cond * 0.4} />
          )}
          {tier >= 5 && (
            <g opacity={0.5 + cond * 0.45}>
              <rect x="112" y="50" width="6" height="90" rx="2" fill={c} />
              <path d="M108 50 L122 50 L115 36 Z" fill={c} />
              <rect x="106" y="138" width="18" height="6" rx="2" fill={c} opacity="0.8" />
            </g>
          )}

          {/* Crown for Monarch */}
          {tier >= 6 && (
            <path d="M63 44 L67 36 L71 42 L75 34 L79 42 L83 36 L87 44 Z" fill="#fff" opacity={0.5 + cond * 0.45} />
          )}
        </g>
      </motion.svg>
    </div>
  );
}
