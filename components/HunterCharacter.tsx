"use client";

import { motion } from "framer-motion";
import { Rank } from "@/lib/types";

// The Hunter visually evolves as rank increases:
// aura intensity, armor detail, eye glow, and floating shadow soldiers
// appear at the higher (Monarch) ranks.
export default function HunterCharacter({ rank }: { rank: Rank }) {
  const c = rank.color;
  const glow = rank.glow;
  const tier = rank.index;

  return (
    <div className="relative flex items-center justify-center w-full" style={{ height: 240 }}>
      {/* Aura rings — more rings at higher rank */}
      {Array.from({ length: Math.min(tier + 1, 4) }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 120 + i * 34,
            height: 120 + i * 34,
            border: `1px solid ${c}`,
            opacity: 0.25,
            boxShadow: `0 0 ${18 + i * 8}px ${glow}`,
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Ground glow */}
      <div
        className="absolute bottom-3 rounded-[100%]"
        style={{ width: 150, height: 24, background: glow, filter: "blur(14px)", opacity: 0.7 }}
      />

      {/* Shadow soldiers for S-rank monarch */}
      {tier >= 6 &&
        [-1, 1].map((side) => (
          <motion.div
            key={side}
            className="absolute"
            style={{ left: side < 0 ? "8%" : "auto", right: side > 0 ? "8%" : "auto", bottom: 30 }}
            animate={{ y: [0, -6, 0], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, delay: side < 0 ? 0 : 1 }}
          >
            <svg width="34" height="60" viewBox="0 0 34 60">
              <path d="M17 4 L24 16 L21 40 L17 56 L13 40 L10 16 Z" fill={c} opacity="0.55" />
              <circle cx="17" cy="10" r="5" fill={c} opacity="0.7" />
            </svg>
          </motion.div>
        ))}

      {/* The Hunter */}
      <motion.svg
        width="150"
        height="220"
        viewBox="0 0 150 220"
        className="relative z-10"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0a0c1b" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Cloak (appears from D-rank) */}
        {tier >= 2 && (
          <path
            d="M40 70 Q20 130 30 200 L55 195 L60 90 Z M110 70 Q130 130 120 200 L95 195 L90 90 Z"
            fill={c}
            opacity="0.18"
          />
        )}

        {/* Legs */}
        <path d="M62 140 L58 205 L70 205 L74 150 Z" fill="url(#bodyGrad)" />
        <path d="M88 140 L92 205 L80 205 L76 150 Z" fill="url(#bodyGrad)" />

        {/* Torso / armor */}
        <path d="M55 80 Q75 70 95 80 L92 145 Q75 155 58 145 Z" fill="url(#bodyGrad)" stroke={c} strokeWidth={tier >= 4 ? 2 : 1} />
        {/* Armor plates (more at higher rank) */}
        {tier >= 3 && <path d="M62 92 L88 92 L86 108 L64 108 Z" fill={c} opacity="0.25" />}
        {tier >= 5 && (
          <>
            <path d="M55 80 L48 96 L55 100 Z" fill={c} opacity="0.5" />
            <path d="M95 80 L102 96 L95 100 Z" fill={c} opacity="0.5" />
          </>
        )}

        {/* Arms */}
        <path d="M55 84 L44 120 L52 124 L62 92 Z" fill="url(#bodyGrad)" />
        <path d="M95 84 L106 120 L98 124 L88 92 Z" fill="url(#bodyGrad)" />

        {/* Neck + Head */}
        <rect x="70" y="58" width="10" height="14" fill="url(#bodyGrad)" />
        <circle cx="75" cy="46" r="16" fill="url(#bodyGrad)" stroke={c} strokeWidth="1.5" />

        {/* Eyes glow */}
        <motion.g animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
          <circle cx="69" cy="46" r="2.4" fill={tier >= 6 ? "#ffffff" : c} />
          <circle cx="81" cy="46" r="2.4" fill={tier >= 6 ? "#ffffff" : c} />
        </motion.g>

        {/* Weapon (dagger from C-rank, greatsword from A-rank) */}
        {tier >= 3 && tier < 5 && (
          <path d="M106 118 L116 96 L120 100 L110 122 Z" fill={c} opacity="0.8" />
        )}
        {tier >= 5 && (
          <g>
            <rect x="112" y="40" width="6" height="90" rx="2" fill={c} opacity="0.85" />
            <path d="M108 40 L122 40 L115 26 Z" fill={c} />
            <rect x="106" y="128" width="18" height="6" rx="2" fill={c} opacity="0.7" />
          </g>
        )}

        {/* Crown for Monarch */}
        {tier >= 6 && (
          <path d="M63 34 L67 26 L71 32 L75 24 L79 32 L83 26 L87 34 Z" fill="#fff" opacity="0.9" />
        )}
      </motion.svg>
    </div>
  );
}
