"use client";

import { useEffect, useRef } from "react";
import { Rank } from "@/lib/types";

// ============================================================
// RAVI — THE HUNTER  (illustration-quality canvas renderer)
//
// A real humanoid shadow-monarch rendered entirely on <canvas>
// with a 60fps loop, verlet COAT CLOTH PHYSICS, painterly
// gradient/rim-light shading (NOT flat geometric shapes), and a
// per-rank PARTICLE SYSTEM. He ascends E -> SS; every tier
// genuinely rebuilds his form — pose, equipment, energy signature:
//
//   E   kneeling, chained, dim — a broken hunter
//   D   standing, hood up, coat appears, gold eyes open
//   C   battle stance, sword materializes, green mana veins
//   B   dominant pose, blue lightning, shadow tendrils from back
//   A   one arm raised commanding shadow army, purple void energy
//   S   arms wide monarch, red aura tornado, dual blades, ground cracks
//   SS  floating, white divine light, shadow wings spread, transcendent
//
// Props:
//   rank       permanent power tier (the FORM)
//   condition  current vitality 0..1 (blaze vs. slump — drives aura/eyes)
//   penalty    shackled & dimmed until today is cleared
// ============================================================

type Props = {
  rank: Rank;
  condition: number;
  penalty?: boolean;
  className?: string;
  /** fill the parent (absolute) instead of a fixed pixel height */
  fill?: boolean;
  height?: number;
};

// design space — the figure is authored inside this box and scaled to fit
const DW = 360;
const DH = 640;

// ---- tiny color helpers -------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
}

type Pt = { x: number; y: number };
type Joints = Record<string, Pt>;

// base standing skeleton (design space)
function baseJoints(): Joints {
  return {
    headTop: { x: 180, y: 58 },
    headC: { x: 180, y: 96 },
    neck: { x: 180, y: 140 },
    shL: { x: 140, y: 166 },
    shR: { x: 220, y: 166 },
    elL: { x: 130, y: 238 },
    elR: { x: 230, y: 238 },
    haL: { x: 126, y: 312 },
    haR: { x: 234, y: 312 },
    hipL: { x: 162, y: 322 },
    hipR: { x: 198, y: 322 },
    pelvis: { x: 180, y: 318 },
    knL: { x: 158, y: 442 },
    knR: { x: 202, y: 442 },
    ftL: { x: 150, y: 576 },
    ftR: { x: 210, y: 576 },
  };
}

// per-rank pose. returns joints + a vertical lift (floating) + feature flags
function poseFor(tier: number, penalty: boolean) {
  const j = baseJoints();
  let lift = 0;

  if (tier <= 1) {
    // BROKEN — slumped kneel, head bowed, hands hanging chained
    j.pelvis = { x: 180, y: 372 };
    j.hipL = { x: 162, y: 374 };
    j.hipR = { x: 198, y: 374 };
    j.knL = { x: 144, y: 488 };
    j.knR = { x: 214, y: 470 };
    j.ftL = { x: 136, y: 576 };
    j.ftR = { x: 232, y: 560 };
    j.shL = { x: 150, y: 196 };
    j.shR = { x: 210, y: 196 };
    j.neck = { x: 182, y: 176 };
    j.headC = { x: 188, y: 214 };
    j.headTop = { x: 190, y: 182 };
    j.elL = { x: 138, y: 260 };
    j.elR = { x: 226, y: 260 };
    j.haL = { x: 150, y: 344 };
    j.haR = { x: 216, y: 344 };
  } else if (tier === 3) {
    // C — battle stance, weight low, sword arm out & down
    j.ftL = { x: 138, y: 576 };
    j.ftR = { x: 222, y: 576 };
    j.knL = { x: 150, y: 446 };
    j.knR = { x: 212, y: 446 };
    j.pelvis = { x: 182, y: 328 };
    j.elR = { x: 244, y: 256 };
    j.haR = { x: 256, y: 322 };
    j.elL = { x: 124, y: 244 };
    j.haL = { x: 116, y: 306 };
  } else if (tier === 4) {
    // B — dominant, chest out, fists low & back, head high
    j.headTop = { x: 180, y: 52 };
    j.shL = { x: 142, y: 162 };
    j.shR = { x: 218, y: 162 };
    j.elL = { x: 124, y: 240 };
    j.elR = { x: 236, y: 240 };
    j.haL = { x: 132, y: 312 };
    j.haR = { x: 228, y: 312 };
    j.ftL = { x: 152, y: 576 };
    j.ftR = { x: 214, y: 576 };
  } else if (tier === 5) {
    // A — right arm RAISED, commanding the army
    j.elR = { x: 250, y: 150 };
    j.haR = { x: 280, y: 86 };
    j.elL = { x: 128, y: 244 };
    j.haL = { x: 122, y: 312 };
    j.headTop = { x: 180, y: 50 };
  } else if (tier === 6) {
    // S — arms WIDE, dual blades, ground cracking, monarch
    j.shL = { x: 140, y: 160 };
    j.shR = { x: 220, y: 160 };
    j.elL = { x: 104, y: 180 };
    j.elR = { x: 256, y: 180 };
    j.haL = { x: 78, y: 128 };
    j.haR = { x: 282, y: 128 };
    j.ftL = { x: 138, y: 576 };
    j.ftR = { x: 222, y: 576 };
  } else if (tier === 7) {
    // SS — FLOATING, arms open & serene, legs together, wings out
    lift = 30;
    j.elL = { x: 108, y: 214 };
    j.elR = { x: 252, y: 214 };
    j.haL = { x: 88, y: 256 };
    j.haR = { x: 272, y: 256 };
    j.knL = { x: 172, y: 444 };
    j.knR = { x: 188, y: 444 };
    j.ftL = { x: 168, y: 580 };
    j.ftR = { x: 192, y: 580 };
    j.hipL = { x: 168, y: 322 };
    j.hipR = { x: 192, y: 322 };
  }
  return { j, lift };
}

export default function HunterCanvas({ rank, condition, penalty = false, className, fill = false, height = 360 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  // live props via refs so the rAF loop never restarts
  const rankRef = useRef(rank);
  const condRef = useRef(condition);
  const penRef = useRef(penalty);
  rankRef.current = rank;
  condRef.current = condition;
  penRef.current = penalty;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowEnd =
      typeof navigator !== "undefined" && ((navigator as any).hardwareConcurrency || 8) <= 4;

    let cw = 0;
    let ch = 0;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, lowEnd ? 1.5 : 2);
      cw = Math.max(1, rect.width);
      ch = Math.max(1, rect.height);
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
    }
    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    // ---------------- COAT CLOTH (verlet) ----------------
    // Back cape — a flared grid of points pinned at the shoulders.
    const COLS = lowEnd ? 6 : 8;
    const ROWS = lowEnd ? 8 : 11;
    type Node = { x: number; y: number; px: number; py: number; pin: boolean; col: number; row: number };
    const cape: Node[] = [];
    const capeTopY = 150;
    const capeTopHalf = 32; // half width at the neck/back
    const capeBotHalf = 92; // resting flare at the hem
    const capeBotY = 600;
    for (let r = 0; r < ROWS; r++) {
      const ty = r / (ROWS - 1);
      const half = capeTopHalf + (capeBotHalf - capeTopHalf) * ty;
      const y = capeTopY + (capeBotY - capeTopY) * ty;
      for (let cIdx = 0; cIdx < COLS; cIdx++) {
        const tx = cIdx / (COLS - 1);
        const x = 180 + (tx - 0.5) * 2 * half;
        cape.push({ x, y, px: x, py: y, pin: r === 0, col: cIdx, row: r });
      }
    }
    const restCol: number[] = [];
    const restRow: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      const a = cape[r * COLS];
      const b = cape[r * COLS + 1];
      restCol[r] = Math.hypot(b.x - a.x, b.y - a.y);
    }
    for (let c0 = 0; c0 < COLS; c0++) {
      const a = cape[c0];
      const b = cape[COLS + c0];
      restRow[c0] = Math.hypot(b.x - a.x, b.y - a.y);
    }
    const idx = (r: number, c: number) => r * COLS + c;

    function simCape(t: number, wind: number, breathe: number, pose: { j: Joints }) {
      // pin top row across the back, between the shoulders, gently swaying
      const back = pose.j;
      const bl = back.shL.x + 6;
      const br = back.shR.x - 6;
      const topY = capeTopY + breathe;
      for (let c0 = 0; c0 < COLS; c0++) {
        const n = cape[idx(0, c0)];
        const tx = c0 / (COLS - 1);
        n.x = bl + (br - bl) * tx;
        n.y = topY + Math.sin(tx * Math.PI) * 4;
        n.px = n.x;
        n.py = n.y;
      }
      // verlet integrate
      const gravity = 0.45;
      for (const n of cape) {
        if (n.pin) continue;
        const depth = n.row / (ROWS - 1);
        const w =
          Math.sin(t * 1.6 + n.row * 0.45) * wind * (0.3 + depth) +
          Math.sin(t * 0.7 + n.col * 0.6) * wind * 0.35 * depth;
        const vx = (n.x - n.px) * 0.96 + w;
        const vy = (n.y - n.py) * 0.96 + gravity;
        n.px = n.x;
        n.py = n.y;
        n.x += vx;
        n.y += vy;
      }
      // constraint relaxation
      for (let it = 0; it < 3; it++) {
        for (let r = 0; r < ROWS; r++) {
          for (let c0 = 0; c0 < COLS - 1; c0++) {
            const a = cape[idx(r, c0)];
            const b = cape[idx(r, c0 + 1)];
            satisfy(a, b, restCol[r]);
          }
        }
        for (let c0 = 0; c0 < COLS; c0++) {
          for (let r = 0; r < ROWS - 1; r++) {
            const a = cape[idx(r, c0)];
            const b = cape[idx(r + 1, c0)];
            satisfy(a, b, restRow[c0]);
          }
        }
      }
    }
    function satisfy(a: Node, b: Node, rest: number) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const diff = (d - rest) / d;
      const ox = dx * 0.5 * diff;
      const oy = dy * 0.5 * diff;
      if (!a.pin) {
        a.x += ox;
        a.y += oy;
      }
      if (!b.pin) {
        b.x -= ox;
        b.y -= oy;
      }
    }

    // ---------------- PARTICLES (per-rank) ----------------
    type Part = {
      x: number; y: number; vx: number; vy: number;
      life: number; max: number; size: number; ang: number; rad: number; rot: number; spin: number;
    };
    let parts: Part[] = [];
    function partCount() {
      const tier = rankRef.current.index;
      const cond = condRef.current;
      let n = tier <= 1 ? 12 : 16 + tier * 7;
      n = Math.round(n * (0.5 + 0.6 * cond));
      if (lowEnd || cw < 340) n = Math.round(n * 0.55);
      return Math.min(90, n);
    }
    function spawn(init: boolean): Part {
      const tier = rankRef.current.index;
      const max = 70 + Math.random() * 130;
      const ang = Math.random() * Math.PI * 2;
      const rad = 50 + Math.random() * 120;
      return {
        x: 180 + (Math.random() - 0.5) * 280,
        y: tier <= 1 ? 100 + Math.random() * 200 : 480 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.4 + Math.random() * 1.3),
        life: init ? Math.random() * max : 0,
        max,
        size: 1.1 + Math.random() * (2.2 + tier * 0.35),
        ang,
        rad,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.14,
      };
    }
    function rebuildParts() {
      const target = partCount();
      if (parts.length < target) for (let i = parts.length; i < target; i++) parts.push(spawn(true));
      else if (parts.length > target) parts.length = target;
    }
    rebuildParts();

    // ---------------- DRAW HELPERS ----------------
    function limb(a: Pt, b: Pt, wa: number, wb: number, fill: string | CanvasGradient, rim: string) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 0.0001;
      const nx = -dy / len;
      const ny = dx / len;
      ctx!.beginPath();
      ctx!.moveTo(a.x + nx * wa, a.y + ny * wa);
      ctx!.lineTo(b.x + nx * wb, b.y + ny * wb);
      ctx!.arc(b.x, b.y, wb, Math.atan2(ny, nx), Math.atan2(-ny, -nx), false);
      ctx!.lineTo(a.x - nx * wa, a.y - ny * wa);
      ctx!.arc(a.x, a.y, wa, Math.atan2(-ny, -nx), Math.atan2(ny, nx), false);
      ctx!.closePath();
      ctx!.fillStyle = fill;
      ctx!.fill();
      ctx!.lineWidth = 1.1;
      ctx!.strokeStyle = rim;
      ctx!.stroke();
    }

    let raf = 0;
    let running = true;
    let frame = 0;
    const onVis = () => {
      running = document.visibilityState !== "hidden";
      if (running) loop();
    };
    document.addEventListener("visibilitychange", onVis);

    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      frame++;
      if (lowEnd && frame % 2 === 0) return; // ~30fps on weak devices

      const rk = rankRef.current;
      const tier = rk.index;
      const penalty = penRef.current;
      const cond = Math.max(0, Math.min(1, condRef.current));
      const c = rk.color;
      const isSS = tier >= 7;
      const auraCol = isSS ? "#ffffff" : c;
      // weakened / dimmed look
      const weak = penalty || cond < 0.32 || tier <= 1;
      // Jin-Woo's coat is always dark navy — rank energy shows in the rim glow, not the coat fabric
      const bodyTint = penalty ? "#131624" : "#0d1533";
      const t = frame / 60;
      const breathe = Math.sin(t * 1.5) * (weak ? 1.3 : 2.6);
      const bob = Math.sin(t * 1.1) * (weak ? 1.5 : tier >= 6 ? 5 : 3);

      const { j: pose0, lift } = poseFor(tier, penalty);
      // apply breathing to the upper body
      const pose: Joints = {};
      for (const k in pose0) pose[k] = { x: pose0[k].x, y: pose0[k].y };
      for (const k of ["headTop", "headC", "neck", "shL", "shR"]) {
        pose[k].y += breathe * (k === "headTop" ? 1 : 0.6);
      }

      // ---- canvas + fit transform ----
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, cw, ch);
      const fit = Math.min(cw / DW, ch / DH) * 0.96;
      const ox = (cw - DW * fit) / 2;
      const floatLift = isSS ? Math.sin(t * 0.9) * 6 : 0;
      const oy = (ch - DH * fit) / 2 - (lift + floatLift) * fit;

      // figure center in CSS px (for the aura)
      const figCx = ox + 180 * fit;
      const figCy = oy + 300 * fit;

      // ===== BACKGROUND AURA (css space) =====
      const auraR = Math.max(cw, ch) * (0.42 + cond * 0.16);
      const g = ctx!.createRadialGradient(figCx, figCy, 8, figCx, figCy, auraR);
      g.addColorStop(0, rgba(auraCol, (isSS ? 0.34 : 0.26) * (0.45 + cond * 0.7)));
      g.addColorStop(0.4, rgba(auraCol, 0.08 * (0.4 + cond)));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, cw, ch);

      // enter design space
      ctx!.save();
      ctx!.translate(ox, oy + bob * fit);
      ctx!.scale(fit, fit);

      // ===== PARTICLES (behind / around) =====
      rebuildParts();
      for (const p of parts) {
        p.life++;
        if (tier <= 1) {
          // ash drifting DOWN — despair
          p.x += p.vx * 0.4;
          p.y += 0.5 + Math.abs(p.vy) * 0.2;
        } else if (tier === 6) {
          // red tornado — swirl upward around the figure
          p.ang += 0.05 + cond * 0.03;
          p.rad -= 0.25;
          p.y += p.vy * (0.7 + cond);
          if (p.rad < 14) p.rad = 60 + Math.random() * 90;
          p.x = 180 + Math.cos(p.ang) * p.rad;
        } else if (tier === 5) {
          // purple void — pulled inward
          p.ang += 0.02;
          p.rad -= 0.6;
          p.x = 180 + Math.cos(p.ang) * p.rad;
          p.y += p.vy * 0.5 + Math.sin(p.ang) * 0.4;
          if (p.rad < 10) Object.assign(p, spawn(false));
        } else {
          // rising motes (gold/green/blue/white)
          p.x += p.vx + Math.sin(t * 1.2 + p.rad) * 0.3;
          p.y += p.vy * (0.6 + cond);
        }
        p.rot += p.spin;
        if (p.life >= p.max || p.y < 40 || (tier <= 1 && p.y > 600)) {
          Object.assign(p, spawn(false));
          continue;
        }
        const fade = 1 - p.life / p.max;
        const a = Math.max(0, fade * (0.2 + cond * 0.7)) * (weak ? 0.6 : 1);
        if (a < 0.02) continue;
        ctx!.save();
        ctx!.globalAlpha = a;
        ctx!.fillStyle = auraCol;
        ctx!.shadowColor = auraCol;
        ctx!.shadowBlur = 8;
        if (tier === 4) {
          // blue lightning shard — thin angular bolt
          ctx!.strokeStyle = auraCol;
          ctx!.lineWidth = p.size * 0.5;
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y - p.size * 2);
          ctx!.lineTo(p.x + p.size, p.y);
          ctx!.lineTo(p.x - p.size * 0.6, p.y + p.size);
          ctx!.lineTo(p.x + p.size * 0.4, p.y + p.size * 2.4);
          ctx!.stroke();
        } else {
          ctx!.translate(p.x, p.y);
          ctx!.rotate(p.rot);
          const s = p.size;
          ctx!.beginPath();
          ctx!.moveTo(0, -s * 2);
          ctx!.lineTo(s * 0.6, 0);
          ctx!.lineTo(0, s * 2);
          ctx!.lineTo(-s * 0.6, 0);
          ctx!.closePath();
          ctx!.fill();
        }
        ctx!.restore();
      }

      // ===== SS WINGS (behind body) =====
      if (isSS) {
        const flap = 1 + Math.sin(t * 1.6) * 0.06;
        ctx!.save();
        ctx!.translate(180, 150);
        ctx!.scale(flap, 1);
        for (const side of [-1, 1]) {
          ctx!.save();
          ctx!.scale(side, 1);
          const wg = ctx!.createLinearGradient(0, -40, 140, 160);
          wg.addColorStop(0, rgba("#ffffff", 0.5));
          wg.addColorStop(0.5, rgba("#9fb4d8", 0.18));
          wg.addColorStop(1, "rgba(8,10,18,0.9)");
          ctx!.fillStyle = wg;
          ctx!.strokeStyle = rgba("#ffffff", 0.55);
          ctx!.lineWidth = 1;
          ctx!.shadowColor = rgba("#ffffff", 0.5);
          ctx!.shadowBlur = 18;
          // feathered wing — several overlapping plumes
          for (let f = 0; f < 5; f++) {
            const sp = f / 4;
            ctx!.beginPath();
            ctx!.moveTo(8, -10);
            ctx!.quadraticCurveTo(60 + sp * 70, -30 + sp * 40, 60 + sp * 90, 30 + sp * 110);
            ctx!.quadraticCurveTo(40 + sp * 50, 30 + sp * 60, 6, 6 + sp * 18);
            ctx!.closePath();
            ctx!.globalAlpha = 0.5 - sp * 0.06;
            ctx!.fill();
            ctx!.stroke();
          }
          ctx!.restore();
        }
        ctx!.restore();
      }

      // ===== SHADOW SOLDIERS (A+) behind =====
      if (tier >= 5) {
        const n = tier >= 7 ? 5 : tier >= 6 ? 4 : 3;
        for (let i = 0; i < n; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const depth = 1 + Math.floor(i / 2);
          const sx = 180 + side * (60 + depth * 34);
          const sy = 360 - depth * 6 + Math.sin(t * 1.3 + i) * 6;
          const sc = 0.5 + depth * 0.06;
          ctx!.save();
          ctx!.translate(sx, sy);
          ctx!.scale(sc, sc);
          ctx!.globalAlpha = (strongOrDim(cond) ? 0.5 : 0.28) - depth * 0.05;
          ctx!.fillStyle = mix(c, "#04060d", 0.45);
          ctx!.shadowColor = rgba(c, 0.6);
          ctx!.shadowBlur = 10;
          // hooded silhouette
          ctx!.beginPath();
          ctx!.moveTo(0, -70);
          ctx!.quadraticCurveTo(34, -54, 26, 30);
          ctx!.lineTo(20, 120);
          ctx!.lineTo(-20, 120);
          ctx!.lineTo(-26, 30);
          ctx!.quadraticCurveTo(-34, -54, 0, -70);
          ctx!.closePath();
          ctx!.fill();
          // glowing eyes
          ctx!.shadowBlur = 6;
          ctx!.fillStyle = isSS ? "#ffffff" : "#ff5a5a";
          ctx!.beginPath();
          ctx!.arc(-6, -46, 2, 0, Math.PI * 2);
          ctx!.arc(6, -46, 2, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        }
      }

      // ===== GROUND: glow, cracks (S+) =====
      ctx!.save();
      const gg = ctx!.createRadialGradient(180, 590, 4, 180, 590, 130);
      gg.addColorStop(0, rgba(auraCol, weak ? 0.18 : 0.4));
      gg.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = gg;
      ctx!.beginPath();
      ctx!.ellipse(180, 592, 120, 22, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
      if (tier >= 6 && !penalty) {
        ctx!.save();
        ctx!.strokeStyle = rgba(c, 0.6 + cond * 0.3);
        ctx!.lineWidth = 1.6;
        ctx!.shadowColor = rgba(c, 0.8);
        ctx!.shadowBlur = 8;
        ctx!.beginPath();
        const cracks = [[-78, 18], [-40, 26], [44, 24], [82, 16], [-14, 30], [22, 30]];
        for (const [ex, ey] of cracks) {
          ctx!.moveTo(180, 588);
          ctx!.lineTo(180 + ex * 0.5, 588 + ey * 0.5);
          ctx!.lineTo(180 + ex, 588 + ey);
        }
        ctx!.stroke();
        ctx!.restore();
      }

      // ===== SHADOW TENDRILS (B+) from the back =====
      if (tier >= 4 && !penalty) {
        ctx!.save();
        ctx!.strokeStyle = rgba(c, 0.5 + cond * 0.35);
        ctx!.lineWidth = 2.4;
        ctx!.lineCap = "round";
        ctx!.shadowColor = rgba(c, 0.7);
        ctx!.shadowBlur = 8;
        const sway = Math.sin(t * 1.4) * 14;
        for (const side of [-1, 1]) {
          for (let k = 0; k < 3; k++) {
            const bx = 180 + side * (18 + k * 6);
            const by = 200 + k * 18;
            ctx!.beginPath();
            ctx!.moveTo(bx, by);
            ctx!.quadraticCurveTo(
              bx + side * (50 + k * 18),
              by - 40 - k * 14 + sway * side,
              bx + side * (30 + k * 24),
              by - 90 - k * 22 - Math.abs(sway)
            );
            ctx!.stroke();
          }
        }
        ctx!.restore();
      }

      // ===== THE COAT — verlet cape behind the body =====
      const windAmp = penalty ? 0.05 : (0.18 + cond * 0.5) * (tier >= 6 ? 1.5 : tier >= 4 ? 1.2 : 1);
      simCape(t, windAmp, breathe * 0.5, { j: pose });
      drawCape(ctx!, cape, COLS, ROWS, idx, bodyTint, cond, penalty);

      // ===== BODY =====
      // Dark navy coat gradient — rank color bleeds into the rim/edge highlight
      const bodyGrad = ctx!.createLinearGradient(0, 120, 0, 600);
      bodyGrad.addColorStop(0, weak ? "#0c0e1a" : mix(bodyTint, "#1a2455", 0.35));
      bodyGrad.addColorStop(0.45, "#090c1a");
      bodyGrad.addColorStop(1, "#04050d");
      const rim = rgba(weak ? "#2a3060" : c, penalty ? 0.3 : 0.5 + cond * 0.45);

      // legs
      limb(pose.hipL, pose.knL, 17, 12, bodyGrad, rim);
      limb(pose.knL, pose.ftL, 12, 9, bodyGrad, rim);
      limb(pose.hipR, pose.knR, 17, 12, bodyGrad, rim);
      limb(pose.knR, pose.ftR, 12, 9, bodyGrad, rim);
      // boots
      drawBoot(ctx!, pose.ftL, bodyGrad, rim);
      drawBoot(ctx!, pose.ftR, bodyGrad, rim);

      // torso
      drawTorso(ctx!, pose, bodyGrad, rim, c, cond, tier, weak);

      // front coat flaps over the legs
      drawFrontFlaps(ctx!, pose, bodyTint, rim, cond, t, windAmp, tier);

      // arms (left then right; raised arm drawn last for A)
      const armGrad = bodyGrad;
      limb(pose.shL, pose.elL, 13, 9, armGrad, rim);
      limb(pose.elL, pose.haL, 9, 7, armGrad, rim);
      drawHand(ctx!, pose.haL, bodyTint, rim);
      limb(pose.shR, pose.elR, 13, 9, armGrad, rim);
      limb(pose.elR, pose.haR, 9, 7, armGrad, rim);
      drawHand(ctx!, pose.haR, bodyTint, rim);

      // pauldrons
      drawPauldron(ctx!, pose.shL, -1, bodyTint, rim, tier, c, cond);
      drawPauldron(ctx!, pose.shR, 1, bodyTint, rim, tier, c, cond);

      // mana veins on chest/arms (C+)
      if (tier >= 3 && !penalty) {
        ctx!.save();
        ctx!.strokeStyle = rgba(auraCol, 0.5 + cond * 0.45);
        ctx!.lineWidth = 1.1;
        ctx!.shadowColor = rgba(auraCol, 0.8);
        ctx!.shadowBlur = 5;
        ctx!.beginPath();
        ctx!.moveTo(170, 200); ctx!.lineTo(168, 240); ctx!.lineTo(160, 270);
        ctx!.moveTo(190, 200); ctx!.lineTo(192, 240); ctx!.lineTo(200, 270);
        ctx!.moveTo(168, 240); ctx!.lineTo(180, 250); ctx!.lineTo(192, 240);
        ctx!.stroke();
        ctx!.restore();
      }

      // neck + head + hood + face + eyes
      limb(pose.neck, { x: pose.headC.x, y: pose.headC.y + 4 }, 9, 8, bodyGrad, rim);
      drawHead(ctx!, pose, bodyTint, rim, c, cond, tier, weak, penalty, t);

      // ===== EQUIPMENT =====
      drawEquipment(ctx!, pose, tier, c, auraCol, cond, t, penalty);

      // ===== CHAINS (E / penalty) =====
      if (tier <= 1 || penalty) drawChains(ctx!, pose, t);

      // SS divine bloom over everything
      if (isSS) {
        ctx!.save();
        const dg = ctx!.createRadialGradient(180, 96, 2, 180, 96, 80);
        dg.addColorStop(0, rgba("#ffffff", 0.4 + Math.sin(t * 2) * 0.1));
        dg.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.fillStyle = dg;
        ctx!.fillRect(80, 20, 200, 200);
        ctx!.restore();
      }

      ctx!.restore();
    }

    function strongOrDim(cond: number) {
      return cond >= 0.6;
    }

    if (!reduce) loop();
    else {
      // one high-quality static frame for reduced-motion users
      loop();
      running = false;
      cancelAnimationFrame(raf);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={fill ? { width: "100%", height: "100%", display: "block" } : { width: "100%", height, display: "block" }}
    />
  );
}

// ===================== detached draw routines =====================
function drawCape(
  ctx: CanvasRenderingContext2D,
  cape: { x: number; y: number; col: number; row: number }[],
  COLS: number,
  ROWS: number,
  idx: (r: number, c: number) => number,
  tint: string,
  cond: number,
  penalty: boolean
) {
  // outer silhouette
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cape[idx(0, 0)].x, cape[idx(0, 0)].y);
  for (let c0 = 1; c0 < COLS; c0++) ctx.lineTo(cape[idx(0, c0)].x, cape[idx(0, c0)].y);
  for (let r = 1; r < ROWS; r++) ctx.lineTo(cape[idx(r, COLS - 1)].x, cape[idx(r, COLS - 1)].y);
  for (let c0 = COLS - 1; c0 >= 0; c0--) ctx.lineTo(cape[idx(ROWS - 1, c0)].x, cape[idx(ROWS - 1, c0)].y);
  for (let r = ROWS - 1; r >= 0; r--) ctx.lineTo(cape[idx(r, 0)].x, cape[idx(r, 0)].y);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, 150, 0, 600);
  cg.addColorStop(0, mix(tint, "#06080f", penalty ? 0.78 : 0.55));
  cg.addColorStop(1, "#03040a");
  ctx.fillStyle = cg;
  ctx.shadowColor = rgba(tint, 0.4);
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;
  // fold shading — vertical strips between columns
  for (let c0 = 0; c0 < COLS - 1; c0++) {
    ctx.beginPath();
    ctx.moveTo(cape[idx(0, c0)].x, cape[idx(0, c0)].y);
    for (let r = 1; r < ROWS; r++) ctx.lineTo(cape[idx(r, c0)].x, cape[idx(r, c0)].y);
    ctx.globalAlpha = c0 % 2 === 0 ? 0.16 : 0.05;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // rim light on the two outer edges
  ctx.strokeStyle = rgba(tint, 0.4 + cond * 0.3);
  ctx.lineWidth = 1.4;
  for (const edge of [0, COLS - 1]) {
    ctx.beginPath();
    ctx.moveTo(cape[idx(0, edge)].x, cape[idx(0, edge)].y);
    for (let r = 1; r < ROWS; r++) ctx.lineTo(cape[idx(r, edge)].x, cape[idx(r, edge)].y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTorso(
  ctx: CanvasRenderingContext2D,
  j: Record<string, { x: number; y: number }>,
  grad: CanvasGradient,
  rim: string,
  c: string,
  cond: number,
  tier: number,
  weak: boolean
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(j.shL.x, j.shL.y);
  ctx.quadraticCurveTo(j.shL.x - 6, j.shL.y + 40, j.hipL.x - 2, j.hipL.y);
  ctx.quadraticCurveTo(j.pelvis.x, j.pelvis.y + 12, j.hipR.x + 2, j.hipR.y);
  ctx.quadraticCurveTo(j.shR.x + 6, j.shR.y + 40, j.shR.x, j.shR.y);
  ctx.quadraticCurveTo(j.neck.x, j.neck.y - 6, j.shL.x, j.shL.y);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = rim;
  ctx.stroke();
  // chest plate accent
  ctx.beginPath();
  ctx.moveTo(j.neck.x - 14, j.neck.y + 14);
  ctx.lineTo(j.neck.x + 14, j.neck.y + 14);
  ctx.lineTo(j.pelvis.x + 8, j.pelvis.y - 30);
  ctx.lineTo(j.pelvis.x - 8, j.pelvis.y - 30);
  ctx.closePath();
  ctx.fillStyle = rgba(c, weak ? 0.06 : 0.12 + cond * 0.16);
  ctx.fill();
  // White shirt visible through open coat — Jin-Woo's signature casual look
  ctx.beginPath();
  ctx.moveTo(j.neck.x - 10, j.neck.y + 10);
  ctx.lineTo(j.neck.x, j.neck.y + 44);
  ctx.lineTo(j.neck.x + 10, j.neck.y + 10);
  ctx.closePath();
  ctx.fillStyle = rgba("#c8ccde", weak ? 0.14 : 0.44 + cond * 0.16);
  ctx.fill();
  // Coat lapel V line on top
  ctx.beginPath();
  ctx.moveTo(j.neck.x - 10, j.neck.y + 10);
  ctx.lineTo(j.neck.x, j.neck.y + 44);
  ctx.lineTo(j.neck.x + 10, j.neck.y + 10);
  ctx.strokeStyle = rgba(c, 0.3 + cond * 0.22);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawFrontFlaps(
  ctx: CanvasRenderingContext2D,
  j: Record<string, { x: number; y: number }>,
  tint: string,
  rim: string,
  cond: number,
  t: number,
  wind: number,
  tier: number
) {
  if (tier < 2) return; // coat appears at D
  ctx.save();
  for (const side of [-1, 1]) {
    const sh = side < 0 ? j.shL : j.shR;
    const hip = side < 0 ? j.hipL : j.hipR;
    const sway = Math.sin(t * 1.5 + side) * wind * 26;
    ctx.beginPath();
    ctx.moveTo(sh.x + side * 2, sh.y + 8);
    ctx.lineTo(j.neck.x + side * 6, j.neck.y + 30);
    ctx.quadraticCurveTo(j.pelvis.x + side * 6, hip.y + 60, hip.x + side * 14 + sway, hip.y + 230);
    ctx.lineTo(hip.x + side * 30 + sway, hip.y + 232);
    ctx.quadraticCurveTo(hip.x + side * 24, hip.y + 60, sh.x + side * 18, sh.y + 30);
    ctx.closePath();
    const fg = ctx.createLinearGradient(0, sh.y, 0, hip.y + 230);
    fg.addColorStop(0, mix(tint, "#06080f", 0.5));
    fg.addColorStop(1, "#03040a");
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgba(tint, 0.35 + cond * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, p: { x: number; y: number }, tint: string, rim: string) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 7, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = mix(tint, "#0a0d16", 0.5);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = rim;
  ctx.stroke();
  ctx.restore();
}

function drawBoot(ctx: CanvasRenderingContext2D, p: { x: number; y: number }, grad: CanvasGradient, rim: string) {
  ctx.save();
  // White rubber sole — Jin-Woo always wears sneakers
  ctx.beginPath();
  ctx.moveTo(p.x - 11, p.y + 5);
  ctx.lineTo(p.x + 14, p.y + 5);
  ctx.lineTo(p.x + 15, p.y + 13);
  ctx.lineTo(p.x - 12, p.y + 13);
  ctx.closePath();
  ctx.fillStyle = rgba("#c4c8d8", 0.88);
  ctx.fill();
  // Dark shoe upper (same fabric as coat)
  ctx.beginPath();
  ctx.moveTo(p.x - 9, p.y - 8);
  ctx.lineTo(p.x + 10, p.y - 8);
  ctx.quadraticCurveTo(p.x + 15, p.y - 2, p.x + 14, p.y + 5);
  ctx.lineTo(p.x - 11, p.y + 5);
  ctx.quadraticCurveTo(p.x - 12, p.y, p.x - 9, p.y - 8);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = rim;
  ctx.stroke();
  // Lace criss-cross detail
  ctx.strokeStyle = rgba("#b0b4c8", 0.5);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(p.x - 5, p.y - 4); ctx.lineTo(p.x + 5, p.y - 1);
  ctx.moveTo(p.x - 5, p.y + 0); ctx.lineTo(p.x + 5, p.y + 3);
  ctx.stroke();
  ctx.restore();
}

function drawPauldron(
  ctx: CanvasRenderingContext2D,
  sh: { x: number; y: number },
  side: number,
  tint: string,
  rim: string,
  tier: number,
  c: string,
  cond: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sh.x - side * 8, sh.y - 8);
  ctx.quadraticCurveTo(sh.x + side * 22, sh.y - 16, sh.x + side * 20, sh.y + 14);
  ctx.quadraticCurveTo(sh.x + side * 6, sh.y + 16, sh.x - side * 6, sh.y + 8);
  ctx.closePath();
  const pg = ctx.createLinearGradient(sh.x, sh.y - 16, sh.x, sh.y + 16);
  pg.addColorStop(0, mix(tint, "#1a1f2e", tier >= 5 ? 0.25 : 0.5));
  pg.addColorStop(1, "#06080f");
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = rim;
  ctx.stroke();
  // spike at higher ranks
  if (tier >= 4) {
    ctx.beginPath();
    ctx.moveTo(sh.x + side * 18, sh.y - 12);
    ctx.lineTo(sh.x + side * 30, sh.y - 26);
    ctx.lineTo(sh.x + side * 22, sh.y - 6);
    ctx.closePath();
    ctx.fillStyle = rgba(c, 0.5 + cond * 0.3);
    ctx.fill();
  }
  ctx.restore();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  j: Record<string, { x: number; y: number }>,
  tint: string,
  rim: string,
  c: string,
  cond: number,
  tier: number,
  weak: boolean,
  penalty: boolean,
  t: number
) {
  const h = j.headC;
  const top = j.headTop;
  // Jin-Woo warm anime skin — dims when shackled
  const skin = penalty ? "#9a7860" : tier <= 1 && weak ? "#b89070" : "#c49572";

  ctx.save();

  // ── NECK ──
  ctx.beginPath();
  ctx.moveTo(h.x - 8, h.y + 13);
  ctx.lineTo(h.x + 8, h.y + 13);
  ctx.lineTo(h.x + 7, j.neck.y + 2);
  ctx.lineTo(h.x - 7, j.neck.y + 2);
  ctx.closePath();
  ctx.fillStyle = skin;
  ctx.fill();

  // ── FACE — sharp anime jaw (Jin-Woo specific) ──
  ctx.beginPath();
  ctx.moveTo(h.x - 14, h.y - 12);
  ctx.bezierCurveTo(h.x - 15, h.y - 20, h.x + 15, h.y - 20, h.x + 14, h.y - 12);
  ctx.lineTo(h.x + 13, h.y + 2);
  ctx.lineTo(h.x + 8, h.y + 12);
  ctx.lineTo(h.x, h.y + 17);
  ctx.lineTo(h.x - 8, h.y + 12);
  ctx.lineTo(h.x - 13, h.y + 2);
  ctx.closePath();
  const skinGrad = ctx.createLinearGradient(h.x - 14, h.y - 12, h.x + 6, h.y + 17);
  skinGrad.addColorStop(0, skin);
  skinGrad.addColorStop(0.65, mix(skin, "#0a080e", 0.12));
  skinGrad.addColorStop(1, mix(skin, "#0a080e", 0.32));
  ctx.fillStyle = skinGrad;
  ctx.fill();
  ctx.strokeStyle = rgba(skin, 0.3);
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // ── HAIR — Jin-Woo black spiky style ──
  const hairC = "#07070d";
  ctx.shadowColor = "rgba(8,8,20,0.9)";
  ctx.shadowBlur = 5;
  ctx.fillStyle = hairC;

  // Main hair mass — covers top and sides
  ctx.beginPath();
  ctx.moveTo(h.x - 15, h.y - 5);
  ctx.quadraticCurveTo(h.x - 20, h.y - 22, h.x - 10, top.y + 2);
  ctx.quadraticCurveTo(h.x - 4, top.y - 4, h.x, top.y - 2);
  ctx.quadraticCurveTo(h.x + 8, top.y - 10, h.x + 16, top.y - 2);
  ctx.lineTo(h.x + 18, h.y - 18);
  ctx.lineTo(h.x + 15, h.y - 5);
  ctx.quadraticCurveTo(h.x + 8, h.y - 15, h.x, h.y - 17);
  ctx.quadraticCurveTo(h.x - 8, h.y - 15, h.x - 15, h.y - 5);
  ctx.closePath();
  ctx.fill();

  // Left side hair behind ear
  ctx.beginPath();
  ctx.moveTo(h.x - 14, h.y - 6);
  ctx.quadraticCurveTo(h.x - 20, h.y + 4, h.x - 18, h.y + 12);
  ctx.lineTo(h.x - 14, h.y + 10);
  ctx.quadraticCurveTo(h.x - 16, h.y + 2, h.x - 14, h.y - 4);
  ctx.closePath();
  ctx.fill();

  // Crown spiky tufts — Jin-Woo characteristic spikes
  const tufts: [number, number, number, number, number][] = [
    [-10, 4, -16, -10, 5],
    [-4,  2, -8,  -14, 4],
    [ 2,  0,  0,  -18, 5],
    [ 8,  2, 14,  -12, 4],
    [14,  4, 20,  -6,  3],
  ];
  for (const [bx, by, tx, ty, w] of tufts) {
    ctx.beginPath();
    ctx.moveTo(top.x + bx - w / 2, top.y + by);
    ctx.lineTo(top.x + tx, top.y + ty);
    ctx.lineTo(top.x + bx + w / 2, top.y + by);
    ctx.closePath();
    ctx.fill();
  }

  // Front strands falling toward forehead
  ctx.strokeStyle = hairC;
  ctx.lineCap = "round";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(h.x - 5, h.y - 17);
  ctx.quadraticCurveTo(h.x - 7, h.y - 10, h.x - 3, h.y - 5);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(h.x + 3, h.y - 17);
  ctx.quadraticCurveTo(h.x + 5, h.y - 11, h.x + 2, h.y - 7);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── EYES — Sung Jin-Woo signature glow ──
  // UNRANKED/E: dim. D-B: bright cerulean blue (his signature).
  // A-S: purple monarch. SS: white divine.
  const eyeCol = tier >= 7 ? "#c9e8ff"
    : tier >= 6 ? "#9c27b0"
    : tier >= 5 ? "#7c4dff"
    : tier <= 1 ? "#5a6878"
    : "#1e88e5";
  const eyeGlowCol = tier >= 7 ? "#e8f4ff"
    : tier >= 5 ? "#e040fb"
    : tier <= 1 ? "#3a4858"
    : "#42a5f5";
  const eyeBright = tier >= 7 ? "#ffffff"
    : tier >= 5 ? "#f3e5f5"
    : tier <= 1 ? "#6a7888"
    : "#90caf9";
  const pulse = 0.68 + 0.32 * Math.abs(Math.sin(t * (weak ? 0.9 : 2.5)));
  const eyeA  = (penalty ? 0.25 : 0.75 + cond * 0.25) * pulse;
  const glowR  = 12 + cond * 16 + (tier >= 5 ? 10 : 0);

  ctx.save();
  for (const side of [-1, 1]) {
    const ex = h.x + side * 5.5;
    const ey = h.y - 3;
    ctx.save();
    // Eye socket depth shadow
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = mix(skin, "#040408", 0.75);
    ctx.beginPath();
    ctx.ellipse(ex, ey, 5.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Glowing iris
    ctx.globalAlpha = eyeA;
    ctx.fillStyle = eyeCol;
    ctx.shadowColor = eyeGlowCol;
    ctx.shadowBlur = glowR;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 3.8, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bright inner core
    ctx.globalAlpha = eyeA * 0.9;
    ctx.fillStyle = eyeBright;
    ctx.shadowBlur = glowR * 0.55;
    ctx.beginPath();
    ctx.ellipse(ex, ey - 0.5, 1.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupil (dark slit)
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#01010a";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 1, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Upper eyelid line — sharp anime style
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#05050e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ex - 4.5, ey - 1.5);
    ctx.quadraticCurveTo(ex + side * 0.5, ey - 4.5, ex + 4.5, ey - 1.5);
    ctx.stroke();
    // Lower lash line
    ctx.strokeStyle = mix(skin, "#04060e", 0.7);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(ex - 3.5, ey + 2.5);
    ctx.quadraticCurveTo(ex, ey + 3.5, ex + 3.5, ey + 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // ── EYEBROWS — sharp, inner end tilts down (serious/stoic expression) ──
  ctx.save();
  ctx.strokeStyle = "#06060e";
  ctx.lineWidth = 2.3;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    const bx = h.x + side * 5.5;
    const by = h.y - 8.5;
    ctx.beginPath();
    ctx.moveTo(bx + side * 3.5, by - 2);   // outer end (higher)
    ctx.lineTo(bx - side * 4,   by + (side > 0 ? 1.5 : 1)); // inner end (lower — furrowed)
    ctx.stroke();
  }
  ctx.restore();

  // ── NOSE BRIDGE — minimal angular hint ──
  ctx.save();
  ctx.strokeStyle = rgba(mix(skin, "#04060e", 0.5), 0.5);
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(h.x + 1, h.y - 1);
  ctx.lineTo(h.x - 2, h.y + 5);
  ctx.stroke();
  ctx.restore();

  // ── MOUTH — stoic neutral, barely curved ──
  ctx.save();
  ctx.strokeStyle = rgba(mix(skin, "#04060e", 0.6), 0.68);
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(h.x - 5, h.y + 9);
  ctx.quadraticCurveTo(h.x, h.y + 10, h.x + 5, h.y + 9);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawEquipment(
  ctx: CanvasRenderingContext2D,
  j: Record<string, { x: number; y: number }>,
  tier: number,
  c: string,
  auraCol: string,
  cond: number,
  t: number,
  penalty: boolean
) {
  // CROWN of dark energy (A+)
  if (tier >= 5) {
    ctx.save();
    ctx.translate(j.headTop.x, j.headTop.y - 8 + Math.sin(t * 1.6) * 2);
    ctx.fillStyle = rgba(tier >= 7 ? "#ffffff" : c, 0.6 + cond * 0.35);
    ctx.shadowColor = rgba(auraCol, 0.8);
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-16, 6);
    ctx.lineTo(-10, -14);
    ctx.lineTo(-4, -2);
    ctx.lineTo(0, -20);
    ctx.lineTo(4, -2);
    ctx.lineTo(10, -14);
    ctx.lineTo(16, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function blade(hand: { x: number; y: number }, dir: number, len: number, solid: boolean) {
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(dir);
    ctx.shadowColor = rgba(auraCol, 0.85);
    ctx.shadowBlur = 10;
    const bg = ctx.createLinearGradient(0, 0, 0, -len);
    bg.addColorStop(0, rgba(auraCol, 0.9));
    bg.addColorStop(1, rgba(tier >= 7 ? "#ffffff" : c, solid ? 0.85 : 0.4));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-3, 6);
    ctx.lineTo(3, 6);
    ctx.lineTo(2.4, -len);
    ctx.lineTo(0, -len - 10);
    ctx.lineTo(-2.4, -len);
    ctx.closePath();
    ctx.fill();
    // guard
    ctx.fillStyle = rgba(c, 0.9);
    ctx.fillRect(-9, 4, 18, 4);
    ctx.fillRect(-2.5, 8, 5, 12);
    ctx.restore();
  }

  if (penalty) return; // shackled — no weapon
  if (tier === 6 || tier === 7) {
    // dual blades held wide
    blade(j.haL, -2.4, 90, true);
    blade(j.haR, 2.4, 90, true);
  } else if (tier >= 3 && tier <= 5) {
    // single sword in right hand (skip when arm raised at A)
    if (tier !== 5) blade(j.haR, 0.15, tier >= 4 ? 96 : 80, tier >= 4);
  }
}

function drawChains(
  ctx: CanvasRenderingContext2D,
  j: Record<string, { x: number; y: number }>,
  t: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(150,156,170,0.75)";
  ctx.fillStyle = "rgba(120,126,140,0.6)";
  ctx.lineWidth = 2.2;
  const sag = Math.sin(t * 0.8) * 4;
  for (const side of [-1, 1]) {
    const hand = side < 0 ? j.haL : j.haR;
    ctx.beginPath();
    ctx.moveTo(hand.x, hand.y);
    ctx.quadraticCurveTo(hand.x + side * 6, hand.y + 40 + sag, hand.x + side * 2, hand.y + 80);
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const yy = hand.y + 14 + k * 18 + sag * (k / 4);
      ctx.beginPath();
      ctx.ellipse(hand.x + side * 4, yy, 3.4, 4.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // wrist cuff
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
