"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useApp } from "@/lib/context";
import { RANKS } from "@/lib/ranks";
import { statCondition } from "@/lib/store";

/* ================================================================
   RANK-UP OVERLAY – The System declares your rise
   → screen-shake, radial burst, ember trail particles,
     SVG insignia path animation, scale pulse, staggered reveal
   ================================================================ */

function reduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Simple canvas-based ember-particle burst */
function EmberBurst({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    const particles = Array.from({ length: 60 }, () => ({
      x: w / 2,
      y: h / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      life: 1,
      decay: 0.008 + Math.random() * 0.016,
      size: 1 + Math.random() * 2.5,
      hue: 20 + Math.random() * 40,
    }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.life -= p.decay;
        if (p.life <= 0) continue;
        ctx.globalAlpha = p.life * 0.9;
        ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const t = setTimeout(() => cancelAnimationFrame(raf), 2200);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [active]);
  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Rank up celebration effect"
      width={320}
      height={320}
      className="absolute inset-0 m-auto pointer-events-none z-30"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/** SVG rank-insignia diamond with stroke draw-on animation */
function RankInsignia({
  rank,
  size = 120,
}: {
  rank: string;
  size?: number;
}) {
  const d =
    "M60 4L116 60L60 116L4 60Z"; // diamond shape
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="overflow-visible">
      <motion.path
        d={d}
        fill="none"
        stroke="var(--rank)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.text
        x="60"
        y="66"
        textAnchor="middle"
        fill="var(--rank)"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        {rank}
      </motion.text>
    </svg>
  );
}

/** Character-by-character typing text */
function TypeReveal({
  text,
  delay = 0,
  speed = 30,
}: {
  text: string;
  delay?: number;
  speed?: number;
}) {
  const [shown, setShown] = useState(0);
  const reduced = reduceMotion();
  useEffect(() => {
    if (reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i += 1;
        setShown(i);
        if (i >= text.length) clearInterval(iv);
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay, speed, reduced]);
  return (
    <span>
      {text.slice(0, shown)}
      {shown < text.length && <span className="caret" />}
    </span>
  );
}

export default function RankUpOverlay({
  fromRank,
  toRank,
  onDone,
}: {
  fromRank: string;
  toRank: string;
  onDone: () => void;
}) {
  const containerRef = useFocusTrap(true, onDone);
  const { state } = useApp();
  const [visible, setVisible] = useState(true);
  const cond = useMemo(() => statCondition(state), [state]);
  const weakest = useMemo(() => {
    const ent = Object.entries(cond);
    ent.sort((a, b) => a[1] - b[1]);
    return ent[0][0];
  }, [cond]);
  const rFrom = RANKS[0];
  const rTo = RANKS[0];
  // look up actual data
  // Simplified: use labels from available rank constants
  const reduced = reduceMotion();

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={containerRef as any}
          role="dialog"
          aria-modal="true"
          aria-label="Rank promotion overlay"
          tabIndex={-1}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* desaturation backdrop */}
          <div className="absolute inset-0 bg-[#030305]" />

          {/* screen shake wrapper */}
          <motion.div
            className="absolute inset-0"
            animate={
              reduced
                ? {}
                : {
                    x: [0, -4, 4, -3, 3, 0],
                    y: [0, 2, -2, 3, -1, 0],
                  }
            }
            transition={{ duration: 0.42, delay: 0.1 }}
          />

          {/* radial burst */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, var(--rank-soft) 0%, transparent 70%)",
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{ width: 600, height: 600, opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* ember burst */}
          <EmberBurst active />

          {/* content */}
          <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-md">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.15, 1], opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <RankInsignia rank={toRank} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="title-font text-3xl mt-4"
              style={{ color: "var(--rank)" }}
            >
              <TypeReveal text={`${toRank} RANK`} delay={900} speed={24} />
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mono text-sm text-[#aab4c6] mt-2"
            >
              <TypeReveal
                text={`${fromRank} → ${toRank}: Your aura is gaining mass.`}
                delay={1400}
                speed={22}
              />
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0 }}
              className="mono text-xs text-[#7e8aa0] mt-1 italic"
            >
              <TypeReveal
                text={`Weakest stat: ${weakest}. Feed it, or fall back.`}
                delay={2000}
                speed={24}
              />
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
