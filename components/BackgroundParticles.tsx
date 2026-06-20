"use client";

import React, { useMemo, useState, useEffect } from "react";

const PARTICLE_COUNT = 20;
const FOG_COUNT = 3;

type ParticleConfig = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  anim: string;
  color: string;
};

type FogConfig = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  anim: string;
  gradient: string;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateParticles(penalty: boolean): ParticleConfig[] {
  const colors = penalty
    ? ["#ef4444", "#b91c1c", "#7f1d1d", "#fca5a5", "#475569", "#64748b"]
    : ["#ff8a3d", "#ff6b35", "#fbbf24", "#64748b", "#94a3b8", "#475569", "#d97706"];
  const anims = ["bgFloat1", "bgFloat2", "bgFloat3"];
  const out: ParticleConfig[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    out.push({
      left: rand(0, 100),
      top: rand(0, 100),
      size: randInt(1, 4),
      opacity: rand(0.15, 0.35),
      duration: rand(20, 45),
      delay: rand(-40, 0),
      anim: pick(anims),
      color: pick(colors),
    });
  }
  return out;
}

function generateFog(penalty: boolean): FogConfig[] {
  const anims = ["bgFog1", "bgFog2", "bgFog3"];
  const colors = penalty
    ? ["rgba(239,68,68,0.07)", "rgba(185,28,28,0.06)", "rgba(127,29,29,0.05)"]
    : ["rgba(59,130,246,0.06)", "rgba(138,92,246,0.05)", "rgba(100,116,139,0.05)"];
  const out: FogConfig[] = [];
  for (let i = 0; i < FOG_COUNT; i++) {
    out.push({
      left: rand(10, 80),
      top: rand(10, 80),
      size: rand(30, 55),
      duration: rand(25, 50),
      delay: rand(-40, 0),
      anim: pick(anims),
      gradient: `radial-gradient(circle, ${pick(colors)} 0%, transparent 70%)`,
    });
  }
  return out;
}

export default function BackgroundParticles({ penalty = false }: { penalty?: boolean }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const particles = useMemo(() => generateParticles(penalty), [penalty]);
  const fog = useMemo(() => generateFog(penalty), [penalty]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {particles.map((p, i) => (
        <div
          key={`p-${i}`}
          className="absolute rounded-full bg-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            backgroundColor: p.color,
            animation: reduced
              ? "none"
              : `${p.anim} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      {fog.map((f, i) => (
        <div
          key={`f-${i}`}
          className="absolute bg-fog"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: `${f.size}vw`,
            height: `${f.size}vw`,
            background: f.gradient,
            filter: "blur(60px)",
            borderRadius: "50%",
            animation: reduced
              ? "none"
              : `${f.anim} ${f.duration}s ease-in-out ${f.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
