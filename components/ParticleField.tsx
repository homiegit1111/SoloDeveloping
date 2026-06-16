"use client";

import { useEffect, useRef } from "react";

// ============================================================
// PARTICLE FIELD — Canvas mana system for the Hunter.
// Particles are NOT circles: angular shards + mana wisps that
// rise from the ground and orbit the body. Color = current rank.
// More particles / faster motion at higher ranks & vitality.
// Performance: requestAnimationFrame, DPR-aware, reduced count
// on small / low-end screens, pauses when tab hidden.
// ============================================================

type Props = {
  color: string;
  intensity?: number; // 0..1 current vitality
  tier?: number; // 0..7 rank index
  className?: string;
};

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rot: number;
  spin: number;
  kind: 0 | 1; // 0 shard, 1 wisp
  orbit: boolean;
  angle: number;
  radius: number;
  oa: number; // orbital angular velocity
};

export default function ParticleField({ color, intensity = 0.6, tier = 0, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const intRef = useRef(intensity);
  const tierRef = useRef(tier);
  const colorRef = useRef(color);
  intRef.current = intensity;
  tierRef.current = tier;
  colorRef.current = color;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const lowEnd =
      typeof navigator !== "undefined" &&
      ((navigator as any).hardwareConcurrency || 8) <= 4;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, lowEnd ? 1.5 : 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      c!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    const baseCount = (w < 360 || lowEnd ? 16 : 30) + tierRef.current * 5;
    const particles: P[] = [];

    function spawn(initial = false): P {
      const t = tierRef.current;
      const orbit = Math.random() < 0.32 + t * 0.04;
      const max = 80 + Math.random() * 120;
      const cx = w / 2;
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * (60 + t * 10);
      return {
        x: orbit ? cx + Math.cos(angle) * radius : 20 + Math.random() * (w - 40),
        y: orbit ? h * 0.5 + Math.sin(angle) * radius * 0.6 : h - 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.5 + Math.random() * 1.4) * (0.6 + intRef.current),
        life: initial ? Math.random() * max : 0,
        max,
        size: 1.2 + Math.random() * (2.4 + t * 0.4),
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.12,
        kind: Math.random() < 0.5 ? 0 : 1,
        orbit,
        angle,
        radius,
        oa: (Math.random() < 0.5 ? 1 : -1) * (0.004 + Math.random() * 0.01) * (1 + t * 0.1),
      };
    }
    for (let i = 0; i < baseCount; i++) particles.push(spawn(true));

    function drawShard(p: P, alpha: number) {
      c!.save();
      c!.translate(p.x, p.y);
      c!.rotate(p.rot);
      c!.globalAlpha = alpha;
      c!.fillStyle = colorRef.current;
      c!.shadowColor = colorRef.current;
      c!.shadowBlur = 8;
      const s = p.size;
      c!.beginPath();
      c!.moveTo(0, -s * 2.2);
      c!.lineTo(s * 0.7, 0);
      c!.lineTo(0, s * 2.2);
      c!.lineTo(-s * 0.7, 0);
      c!.closePath();
      c!.fill();
      c!.restore();
    }

    function drawWisp(p: P, alpha: number) {
      c!.save();
      c!.translate(p.x, p.y);
      c!.rotate(p.rot);
      c!.globalAlpha = alpha * 0.8;
      c!.strokeStyle = colorRef.current;
      c!.shadowColor = colorRef.current;
      c!.shadowBlur = 6;
      c!.lineWidth = p.size * 0.6;
      c!.beginPath();
      c!.moveTo(0, -p.size * 2.5);
      c!.quadraticCurveTo(p.size * 1.6, 0, 0, p.size * 2.5);
      c!.stroke();
      c!.restore();
    }

    let raf = 0;
    let running = true;
    const onVis = () => {
      running = document.visibilityState !== "hidden";
      if (running) loop();
    };
    document.addEventListener("visibilitychange", onVis);

    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      c!.clearRect(0, 0, w, h);
      const inten = intRef.current;
      const cx = w / 2;
      for (const p of particles) {
        p.life += 1;
        if (p.orbit) {
          p.angle += p.oa * (0.6 + inten);
          p.x = cx + Math.cos(p.angle) * p.radius;
          p.y = h * 0.5 + Math.sin(p.angle) * p.radius * 0.6;
          p.radius -= 0.05;
        } else {
          p.x += p.vx;
          p.y += p.vy * (0.6 + inten * 0.8);
        }
        p.rot += p.spin;
        if (p.life >= p.max || p.y < -10 || p.radius < 8) {
          Object.assign(p, spawn(false));
          continue;
        }
        const fade = 1 - p.life / p.max;
        const alpha = Math.max(0, Math.min(1, fade * (0.25 + inten * 0.75)));
        if (alpha <= 0.02) continue;
        if (p.kind === 0) drawShard(p, alpha);
        else drawWisp(p, alpha);
      }
    }
    if (!reduce) loop();
    else {
      // static single frame for reduced-motion users
      c.clearRect(0, 0, w, h);
      for (const p of particles) (p.kind === 0 ? drawShard : drawWisp)(p, 0.25);
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      ro?.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} style={{ width: "100%", height: "100%", display: "block" }} />;
}
