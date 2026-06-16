"use client";

import { motion } from "framer-motion";
import { Rank } from "@/lib/types";
import ParticleField from "./ParticleField";

// ============================================================
// RAVI — THE HUNTER. A real humanoid figure (hooded shadow-knight),
// not a blob. He ascends through ranks E -> SS, each tier rebuilding
// his form: posture, coat, mana veins, sword, tendrils, crown, wings,
// shadow soldiers. He is ALIVE: breathing, eye pulse, flowing coat,
// a breathing shadow, and a canvas mana aura driven by `condition`.
//   rank       -> permanent power tier (form)
//   condition  -> CURRENT vitality 0..1 (blaze vs slump)
//   penalty    -> shackled / dimmed until today is cleared
// ============================================================

type Props = { rank: Rank; condition: number; penalty?: boolean; height?: number };

export default function HunterCharacter({ rank, condition, penalty = false, height = 360 }: Props) {
  const tier = rank.index; // 0 unranked .. 7 SS
  const c = rank.color;
  const glow = rank.glow;
  const cond = Math.max(0, Math.min(1, condition));
  const weak = penalty || cond < 0.34 || tier <= 1;
  const strong = !penalty && cond >= 0.7;

  // eyes: amber at D when neutral grey early, else rank color; red-ish at S; white at SS
  const eyeColor =
    tier >= 7 ? "#ffffff" : tier >= 6 ? "#ff5a5a" : tier >= 2 ? c : weak ? "#7d8596" : "#c9cdd6";
  const outline = weak ? "#5b6275" : tier >= 7 ? "#ffffff" : c;
  const outlineW = 1.3 + cond * 0.7;
  const outlineOp = penalty ? 0.4 : 0.55 + cond * 0.45;
  const eyeMin = penalty ? 0.15 : 0.35 + cond * 0.45;
  const eyeMax = penalty ? 0.4 : 0.65 + cond * 0.35;

  // posture transform per tier
  const crouch = tier <= 1 || penalty;
  const poseY = crouch ? 26 : strong ? -2 : 4;
  const poseScale = crouch ? 0.9 : 1;
  const poseRot = crouch ? 3 : 0;
  const bob = strong ? 6 : crouch ? 1.5 : 3;
  const rightArmExtended = tier === 5; // A-rank: one arm extended
  const armsAtSides = tier >= 6;

  const showCoat = tier >= 2;
  const showVeins = tier >= 3;
  const showSword = tier >= 3;
  const solidSword = tier >= 4;
  const showTendrils = tier >= 4;
  const showCrown = tier >= 5;
  const showSoldiers = tier >= 6;
  const showGroundCrack = tier >= 6;
  const showWings = tier >= 7;

  return (
    <div className="relative w-full" style={{ height }}>
      {/* mana aura — canvas particles behind everything */}
      <div className="absolute inset-0 z-0">
        <ParticleField color={tier >= 7 ? "#ffffff" : c} intensity={cond} tier={tier} />
      </div>

      {/* SS divine radiance */}
      {showWings && (
        <motion.div
          className="absolute inset-0 z-0"
          animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.04, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{
            background: "radial-gradient(circle at 50% 46%, rgba(255,255,255,0.22), transparent 55%)",
          }}
        />
      )}

      {/* ground glow + breathing shadow */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 rounded-[100%] z-0"
        style={{ bottom: 26, width: 168, height: 26, background: glow, filter: "blur(16px)" }}
        animate={{ opacity: weak ? [0.18, 0.26, 0.18] : [0.4, 0.62, 0.4], scaleX: [1, 1.05, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ground cracks (S+) */}
      {showGroundCrack && (
        <svg className="absolute left-1/2 -translate-x-1/2 z-0" style={{ bottom: 18 }} width="220" height="40" viewBox="0 0 220 40">
          <g stroke={c} strokeWidth="1.4" fill="none" opacity={0.5 + cond * 0.4} style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
            <path d="M110 8 L70 30 M110 8 L150 30 M110 8 L96 36 M110 8 L128 34 M110 12 L40 24 M110 12 L180 26" />
          </g>
        </svg>
      )}

      {/* shadow soldiers (S+) */}
      {showSoldiers &&
        [-1, 1].map((side) => (
          <motion.div
            key={side}
            className="absolute z-0"
            style={{ left: side < 0 ? "8%" : "auto", right: side > 0 ? "8%" : "auto", bottom: 64 }}
            animate={{ y: [0, -7, 0], opacity: strong ? [0.4, 0.85, 0.4] : [0.18, 0.35, 0.18] }}
            transition={{ duration: 3.2, repeat: Infinity, delay: side < 0 ? 0 : 1.2 }}
          >
            <svg width="40" height="84" viewBox="0 0 40 84">
              <path d="M20 4 L31 22 L25 56 L20 80 L15 56 L9 22 Z" fill={c} opacity="0.45" stroke={glow} strokeWidth="0.7" strokeOpacity="0.6" />
              <circle cx="20" cy="12" r="5.4" fill={c} opacity="0.8" />
              <circle cx="17" cy="11" r="1.1" fill="#ff5a5a" />
              <circle cx="23" cy="11" r="1.1" fill="#ff5a5a" />
            </svg>
          </motion.div>
        ))}

      {/* ===================== THE HUNTER ===================== */}
      <motion.div
        className="absolute left-1/2 z-10"
        style={{ bottom: 18, width: 220, marginLeft: -110, transformOrigin: "bottom center" }}
        animate={{ y: [0, -bob, 0] }}
        transition={{ duration: weak ? 4 : 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="220" height="360" viewBox="0 0 220 360" style={{ filter: `drop-shadow(0 0 ${10 + cond * 16}px ${glow})` }}>
          <defs>
            <linearGradient id="hbody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={penalty ? 0.18 : 0.32 + cond * 0.4} />
              <stop offset="42%" stopColor="#0b0e18" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#04060d" stopOpacity="0.98" />
            </linearGradient>
            <linearGradient id="hcoat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={0.16 + cond * 0.2} />
              <stop offset="100%" stopColor="#05070f" stopOpacity="0.96" />
            </linearGradient>
            <radialGradient id="hsword" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={tier >= 7 ? "#ffffff" : glow} stopOpacity="0.95" />
              <stop offset="100%" stopColor={c} stopOpacity="0.5" />
            </radialGradient>
            <filter id="hgrain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>

          <g transform={`translate(0 ${poseY}) scale(${poseScale}) rotate(${poseRot} 110 200)`}>
            {/* WINGS (SS) — behind the body */}
            {showWings && (
              <motion.g
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                animate={{ scaleX: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3.6, repeat: Infinity }}
              >
                <path d="M104 96 C 50 70, 14 90, 6 150 C 40 132, 54 140, 70 134 C 48 150, 36 168, 40 196 C 70 168, 88 156, 100 150 Z"
                  fill="#0a0c14" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
                <path d="M116 96 C 170 70, 206 90, 214 150 C 180 132, 166 140, 150 134 C 172 150, 184 168, 180 196 C 150 168, 132 156, 120 150 Z"
                  fill="#0a0c14" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.7" />
              </motion.g>
            )}

            {/* shadow tendrils from the back (B+) */}
            {showTendrils && (
              <motion.g
                stroke={c}
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
                opacity={0.45 + cond * 0.4}
                style={{ filter: `drop-shadow(0 0 6px ${glow})`, transformBox: "fill-box", transformOrigin: "center" }}
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M86 120 C 50 110, 40 150, 28 130" />
                <path d="M134 120 C 170 110, 180 150, 192 130" />
                <path d="M92 130 C 64 140, 58 180, 44 168" />
                <path d="M128 130 C 156 140, 162 180, 176 168" />
              </motion.g>
            )}

            {/* COAT — flows in the wind (D+) */}
            {showCoat && (
              <motion.g
                fill="url(#hcoat)"
                stroke={outline}
                strokeWidth={outlineW * 0.7}
                strokeOpacity={outlineOp * 0.7}
                strokeLinejoin="round"
                style={{ transformBox: "fill-box", transformOrigin: "100px 120px" }}
                animate={{ skewX: weak ? [0, 0.6, 0] : [0, 3.2, -1.4, 2.4, 0], rotate: weak ? 0 : [0, 0.8, -0.4, 0] }}
                transition={{ duration: weak ? 5 : 3.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* left panel */}
                <path d="M74 124 C 44 190, 40 268, 58 318 L 84 308 L 92 150 Z" />
                {/* right panel — trails further (wind) */}
                <path d="M146 124 C 178 188, 188 274, 168 326 L 138 312 L 128 150 Z" />
                {/* torn lower hem */}
                <path d="M58 318 L 66 332 L 74 318 L 80 330 L 86 316" fill="none" stroke={outline} strokeOpacity={outlineOp * 0.6} />
              </motion.g>
            )}

            {/* ===== BODY (breathing) ===== */}
            <motion.g
              fill="url(#hbody)"
              stroke={outline}
              strokeWidth={outlineW}
              strokeOpacity={outlineOp}
              strokeLinejoin="round"
              style={{ transformBox: "fill-box", transformOrigin: "110px 150px" }}
              animate={{ scaleY: [1, weak ? 1.008 : 1.022, 1], scaleX: [1, weak ? 0.998 : 1.006, 1] }}
              transition={{ duration: weak ? 3.6 : 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* legs — stance */}
              <path d="M96 214 L 86 332 L 104 332 L 110 226 Z" />
              <path d="M124 214 L 134 332 L 116 332 L 110 226 Z" />
              {/* boots */}
              <path d="M84 326 L 108 326 L 110 344 L 82 344 Z" />
              <path d="M112 326 L 136 326 L 138 344 L 110 344 Z" />

              {/* torso — V-taper, armored chest */}
              <path d="M82 120 C 92 110, 128 110, 138 120 L 130 216 C 120 224, 100 224, 90 216 Z" />

              {/* chest plate detail */}
              <path d="M96 138 L 124 138 L 118 178 L 102 178 Z" fill={c} fillOpacity={penalty ? 0.05 : 0.14 + cond * 0.2} stroke="none" />

              {/* mana circuit veins (C+) */}
              {showVeins && (
                <g stroke={tier >= 7 ? "#ffffff" : c} strokeWidth="1.2" fill="none" opacity={0.5 + cond * 0.45} style={{ filter: `drop-shadow(0 0 4px ${glow})` }}>
                  <path d="M104 128 L 104 150 L 98 168 M116 128 L 116 150 L 122 168" />
                  <path d="M92 150 L 100 160 M128 150 L 120 160" />
                </g>
              )}

              {/* pauldrons (angular shoulders) */}
              <path d="M82 120 L 66 132 L 86 142 L 94 124 Z" />
              <path d="M138 120 L 154 132 L 134 142 L 126 124 Z" />

              {/* LEFT arm */}
              {armsAtSides || !rightArmExtended ? (
                <path d="M84 130 L 72 196 L 84 200 L 96 138 Z" />
              ) : (
                <path d="M84 130 L 72 196 L 84 200 L 96 138 Z" />
              )}

              {/* RIGHT arm — extended at A-rank, else at side */}
              {rightArmExtended ? (
                <path d="M136 130 L 196 138 L 198 150 L 134 150 Z" />
              ) : (
                <path d="M136 130 L 148 196 L 136 200 L 124 138 Z" />
              )}

              {/* cracks of weakness */}
              {weak && (
                <g stroke="#161c2c" strokeWidth="1.2" strokeOpacity="0.75" fill="none">
                  <path d="M106 138 L 100 168 L 108 188" />
                  <path d="M118 150 L 122 176" />
                </g>
              )}

              {/* neck */}
              <path d="M102 104 L 118 104 L 116 122 L 104 122 Z" />

              {/* hooded head */}
              <path d="M92 88 C 92 56, 110 50, 110 50 C 110 50, 128 56, 128 88 L 120 100 C 110 94, 100 100, 100 100 Z" />
              {/* face shadow */}
              <ellipse cx="110" cy="84" rx="13" ry="15" fill="#05070f" fillOpacity="0.96" stroke="none" />

              {/* eyes */}
              <motion.g
                stroke="none"
                animate={{ opacity: [eyeMin, eyeMax, eyeMin] }}
                transition={{ duration: weak ? 3.4 : 3.6, repeat: Infinity, times: [0, 0.12, 1] }}
              >
                <path d="M101 84 L 108 82 L 107 87 L 101 88 Z" fill={eyeColor} style={{ filter: `drop-shadow(0 0 ${3 + cond * 5}px ${eyeColor})` }} />
                <path d="M119 84 L 112 82 L 113 87 L 119 88 Z" fill={eyeColor} style={{ filter: `drop-shadow(0 0 ${3 + cond * 5}px ${eyeColor})` }} />
              </motion.g>
            </motion.g>

            {/* CROWN of dark energy (A+) */}
            {showCrown && (
              <motion.g
                animate={{ y: [0, -3, 0], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
              >
                <path d="M92 48 L 98 32 L 104 44 L 110 28 L 116 44 L 122 32 L 128 48 Z"
                  fill={tier >= 7 ? "#ffffff" : c} fillOpacity={0.55 + cond * 0.4} stroke={glow} strokeWidth="0.6" />
              </motion.g>
            )}

            {/* SWORD in right hand (C+) */}
            {showSword && !rightArmExtended && (
              <motion.g
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
              >
                {solidSword ? (
                  <g>
                    <rect x="146" y="120" width="7" height="96" rx="2" fill="url(#hsword)" />
                    <path d="M141 120 L 158 120 L 149.5 100 Z" fill="url(#hsword)" />
                    <rect x="139" y="214" width="21" height="6" rx="2" fill={c} />
                    <rect x="147" y="220" width="5" height="14" rx="2" fill={c} />
                  </g>
                ) : (
                  <path d="M148 214 L 162 150 L 168 152 L 154 218 Z" fill="url(#hsword)" opacity={0.6 + cond * 0.4} />
                )}
              </motion.g>
            )}

            {/* energy crackle on shoulders (B+) */}
            {tier >= 4 && !weak && (
              <motion.g stroke={c} strokeWidth="1.4" fill="none" strokeLinecap="round"
                animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 1.4, repeat: Infinity }}
                style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
                <path d="M70 130 L 60 120 L 66 124 L 56 112" />
                <path d="M150 130 L 160 120 L 154 124 L 164 112" />
              </motion.g>
            )}

            {/* CHAINS / shackles (penalty) */}
            {penalty && (
              <g stroke="#9aa0ad" strokeWidth="2.4" fill="none" opacity="0.8">
                <path d="M72 196 C 60 220, 64 250, 78 264" />
                <path d="M148 196 C 160 220, 156 250, 142 264" />
                {[210, 226, 242].map((y) => (
                  <ellipse key={`l${y}`} cx="66" cy={y} rx="4" ry="5.5" />
                ))}
                {[210, 226, 242].map((y) => (
                  <ellipse key={`r${y}`} cx="154" cy={y} rx="4" ry="5.5" />
                ))}
              </g>
            )}
          </g>

          {/* grain texture over a defeated hunter */}
          {weak && (
            <rect x="0" y="0" width="220" height="360" filter="url(#hgrain)" opacity="0.05" style={{ mixBlendMode: "overlay" }} />
          )}
        </svg>
      </motion.div>
    </div>
  );
}
