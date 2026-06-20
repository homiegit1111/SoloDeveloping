"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// ENERGY SURGE — lightweight DOM particle wash triggered when
// the Hunter evolves (rank changes).
// - Max 40 particles to keep 60fps
// - CSS transforms + opacity only (no setState in rAF)
// - Coloured to match the *new* rank
// - Fades and scales out over ~1s via Framer Motion
// - Respects prefers-reduced-motion (instant swap, no particles)
// ============================================================

interface Particle {
  id: number;
  angle: number;
  distance: number; // vmin
  size: number; // px
  delay: number;
  duration: number;
  shape: "orb" | "line";
}

function spawnParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 62; // 18-80 vmin spread
    return {
      id: i,
      angle,
      distance,
      size: 2 + Math.random() * 5,
      delay: Math.random() * 0.18,
      duration: 0.7 + Math.random() * 0.55,
      shape: Math.random() > 0.35 ? "orb" : "line",
    };
  });
}

interface EnergySurgeProps {
  color: string;
  active: boolean;
  onDone?: () => void;
}

export default function EnergySurge({ color, active, onDone }: EnergySurgeProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const reduced = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (reduced || !active) {
      setParticles([]);
      if (active && reduced) {
        // Instant finish for reduced motion
        const t = setTimeout(() => onDone?.(), 0);
        return () => clearTimeout(t);
      }
      return;
    }

    const count = Math.min(40, 20 + Math.floor(Math.random() * 20));
    setParticles(spawnParticles(count));

    const t = setTimeout(() => {
      setParticles([]);
      onDone?.();
    }, 1500);

    return () => clearTimeout(t);
  }, [active, reduced, onDone]);

  if (reduced || (particles.length === 0 && !active)) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {particles.map((p) => {
          const tx = Math.cos(p.angle) * p.distance;
          const ty = Math.sin(p.angle) * p.distance;
          const glow = p.size * 3.5;

          if (p.shape === "line") {
            return (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: p.size * 0.4,
                  height: p.size * 3.5,
                  backgroundColor: color,
                  borderRadius: p.size * 0.2,
                  boxShadow: `0 0 ${glow}px ${color}`,
                  marginLeft: -(p.size * 0.2),
                  marginTop: -(p.size * 1.75),
                }}
                initial={{ opacity: 0, scale: 0.2, x: 0, y: 0, rotate: (p.angle * 180) / Math.PI }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.2, 1.3, 0.1],
                  x: `${tx}vmin`,
                  y: `${ty}vmin`,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            );
          }

          return (
            <motion.div
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: color,
                boxShadow: `0 0 ${glow}px ${color}, 0 0 ${glow * 1.5}px ${color}88`,
                marginLeft: -(p.size / 2),
                marginTop: -(p.size / 2),
              }}
              initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.2, 1.4, 0],
                x: `${tx}vmin`,
                y: `${ty}vmin`,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeOut",
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
