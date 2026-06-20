"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { punishment as sndPunish } from "@/lib/sound";

const RED = "#ef4444";
const RED_GLOW = "rgba(239,68,68,0.6)";

function reduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ================================================================
   CRACK GEOMETRY — deterministic pseudo-random jagged rays
   ================================================================ */

function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CrackSegment {
  d: string;
  strokeWidth: number;
}

function buildCracks(seed = 42): CrackSegment[] {
  const rand = mulberry32(seed);
  const count = 14;
  const cracks: CrackSegment[] = [];
  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const segs = 3 + Math.floor(rand() * 3); // 3-5 segments
    let x = 50;
    let y = 50;
    let d = `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    let angle = baseAngle;
    for (let s = 0; s < segs; s++) {
      const len = 4 + rand() * 7;
      angle += (rand() - 0.5) * 0.6; // jitter
      x += Math.cos(angle) * len;
      y += Math.sin(angle) * len;
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    cracks.push({ d, strokeWidth: 0.25 + rand() * 0.4 });
  }
  return cracks;
}



/* ================================================================
   TYPEWRITER — character-by-character with blinking cursor
   ================================================================ */

function TypewriterText({
  text,
  speed = 18,
  active,
}: {
  text: string;
  speed?: number;
  active: boolean;
}) {
  const [shown, setShown] = useState(0);
  const reduced = reduceMotion();

  useEffect(() => {
    if (!active) {
      setShown(0);
      return;
    }
    if (reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active, reduced]);

  const showCursor = shown < text.length && !reduced;

  return (
    <span className="term block leading-relaxed">
      &ldquo;{text.slice(0, shown)}&rdquo;
      {showCursor && (
        <span
          className="inline-block align-middle ml-0.5"
          style={{
            width: "0.55em",
            height: "1em",
            backgroundColor: RED,
            animation: "caretBlink 0.9s steps(1) infinite",
          }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

/* ================================================================
   PUNISHMENT OVERLAY
   ================================================================ */

export default function PunishmentOverlay({
  open,
  missedCount,
  quote,
  legend,
  onClose,
}: {
  open: boolean;
  missedCount: number;
  quote: string;
  legend: string;
  onClose: () => void;
}) {
  const containerRef = useFocusTrap(open, onClose); // Escape closes overlay
  const [hrs, setHrs] = useState("24:00:00");
  const reduced = reduceMotion();
  const cracks = useMemo(() => buildCracks(42), []);

  /* play sound once */
  useEffect(() => {
    if (!open) return;
    sndPunish();
  }, [open]);

  /* 24h recovery countdown until next local midnight */
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      let s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      s %= 3600;
      const m = String(Math.floor(s / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setHrs(`${h}:${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);



  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef as any}
          role="dialog"
          aria-label="Penalty zone overlay"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
        >
          {/* Desaturated backdrop */}
          <div
            className="absolute inset-0 bg-[rgba(2,1,3,0.96)]"
            style={{
              filter: reduced ? "none" : "grayscale(1) brightness(0.35)",
            }}
            aria-hidden="true"
          />

          {/* Red crack SVG lines from center */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {cracks.map((c, i) => (
              <motion.path
                key={i}
                d={c.d}
                fill="none"
                stroke={RED}
                strokeWidth={c.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={
                  reduced
                    ? { opacity: 0.8, pathLength: 1, scale: 1 }
                    : { opacity: 0, pathLength: 0, scale: 0.9 }
                }
                animate={{ opacity: 0.8, pathLength: 1, scale: 1 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        duration: 0.7,
                        delay: 0.1 + i * 0.045,
                        ease: "easeOut",
                      }
                }
                style={{ transformOrigin: "50% 50%" }}
              />
            ))}
          </svg>

          {/* Red bleed vignette */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-0"
            animate={
              reduced ? { opacity: 0.7 } : { opacity: [0.4, 0.85, 0.4] }
            }
            transition={
              reduced ? { duration: 0 } : { duration: 1.6, repeat: Infinity }
            }
            style={{
              boxShadow:
                "inset 0 0 160px rgba(239,68,68,0.5), inset 0 0 0 2px rgba(239,68,68,0.25)",
            }}
            aria-hidden="true"
          />

          {/* Content card */}
          <motion.div
            initial={
              reduced
                ? { scale: 1, opacity: 1, y: 0 }
                : { scale: 0.9, opacity: 0, y: 12 }
            }
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.4, ease: "easeOut", delay: 0.15 }
            }
            className="relative z-10 w-full max-w-md"
          >
            <div className="sys-window sys-corner relative">
              <div className="scanline" />
              {/* header */}
              <div className="flex items-center justify-between px-4 pt-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rotate-45 border"
                    style={{
                      borderColor: RED,
                      boxShadow: `0 0 6px ${RED_GLOW}`,
                    }}
                  />
                  <span
                    className="label !tracking-[0.34em]"
                    style={{ color: RED, opacity: 0.9 }}
                  >
                    SYSTEM · PENALTY ZONE
                  </span>
                </div>
                <span className="num text-[10px] opacity-40">◇◇◇</span>
              </div>
              <div className="px-4">
                <div
                  className="mt-2 mb-3"
                  style={{
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${RED}, transparent)`,
                    backgroundSize: "200% 100%",
                    animation: reduced ? "none" : "barSweep 3.4s linear infinite",
                  }}
                />
              </div>

              <div className="px-5 pb-5 relative z-10">
                <p
                  className="title-font tracking-[0.28em] text-xs mb-2 text-glow-crimson"
                  style={{ color: RED }}
                >
                  ⚠ PENALTY APPLIED ⚠
                </p>
                <h2
                  className="title-font text-2xl mb-2 text-glow-crimson"
                  style={{ color: RED }}
                >
                  THE SYSTEM IS DISAPPOINTED
                </h2>
                <p className="mono text-sm text-[#c3cde0] mb-3">
                  {missedCount} quest{missedCount === 1 ? "" : "s"} left undone.
                  The Hunter weakens until today is cleared.
                </p>

                {/* Character-by-character typing quote */}
                <div
                  className="border-t pt-3 min-h-[4em]"
                  style={{ borderColor: "rgba(239,68,68,0.25)" }}
                >
                  <p className="mono text-sm italic text-[#e2b3b3]">
                    <TypewriterText
                      text={quote}
                      speed={18}
                      active={open}
                    />
                  </p>
                  <p className="mono text-[11px] text-[#9aa6bd] mt-2">
                    — {legend}
                  </p>
                </div>

                <div
                  className="mt-4 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: "rgba(239,68,68,0.2)" }}
                >
                  <span
                    className="label !tracking-[0.2em]"
                    style={{ color: RED }}
                  >
                    RECOVERY WINDOW
                  </span>
                  <span
                    className="num text-lg"
                    style={{
                      color: RED,
                      textShadow: "0 0 12px rgba(239,68,68,0.6)",
                    }}
                  >
                    {hrs}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="sys-btn sys-btn-danger w-full py-2.5 text-sm mt-4"
                  aria-label="Accept penalty and rise today"
                >
                  [ I ACCEPT — I RISE TODAY ]
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
