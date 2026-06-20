"use client";

import { useEffect, useRef } from "react";
import { Rank } from "@/lib/types";

// ============================================================
// RAVI — THE SHADOW MONARCH  (toon-shaded canvas renderer)
//
// A dark, hooded shadow-monarch (Sung Jin-Woo style) rendered on
// <canvas> with a 60fps loop, verlet COAT-CAPE physics, crisp
// cel-shading + toon outlines (matching the 3D model's outline
// shader), glowing mana eyes, and a per-rank PARTICLE SYSTEM.
// He ascends UNRANKED -> SS; every tier rebuilds his form —
// pose, equipment, energy signature:
//
//   UNRANKED  chained & broken, dim grey face, no coat
//   E   standing, weary, black hair, coat appears
//   D   hood up, gold/green mana eyes, pauldrons
//   C   battle stance, sword materializes
//   B   dominant, shadow tendrils from the back
//   A   one arm raised commanding shadows, crown of dark energy
//   S   arms wide, dual blades, ground cracks, crown
//   SS  floating, white divine light, shadow wings, dual blades
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

// base standing skeleton (design space) — slim, tall, ~8 heads
function baseJoints(): Joints {
  return {
    crown: { x: 180, y: 46 },
    headC: { x: 180, y: 84 },
    chin: { x: 180, y: 120 },
    neck: { x: 180, y: 132 },
    shL: { x: 130, y: 158 },
    shR: { x: 230, y: 158 },
    elL: { x: 116, y: 236 },
    elR: { x: 244, y: 236 },
    haL: { x: 110, y: 312 },
    haR: { x: 250, y: 312 },
    pelvis: { x: 180, y: 322 },
    hipL: { x: 160, y: 326 },
    hipR: { x: 200, y: 326 },
    knL: { x: 158, y: 456 },
    knR: { x: 202, y: 456 },
    ftL: { x: 152, y: 602 },
    ftR: { x: 208, y: 602 },
  };
}

// per-rank pose + feature flags
function poseFor(tier: number, penalty: boolean) {
  const j = baseJoints();
  let lift = 0;
  let hood = tier >= 2;
  let kneel = false;
  if (penalty) hood = tier >= 2; // still hooded if ranked, but chained

  if (tier <= 0) {
    // UNRANKED — broken, slumped, chained, no hood
    kneel = true;
    hood = false;
    j.crown = { x: 178, y: 96 };
    j.headC = { x: 178, y: 132 };
    j.chin = { x: 178, y: 166 };
    j.neck = { x: 179, y: 178 };
    j.shL = { x: 138, y: 198 };
    j.shR = { x: 224, y: 198 };
    j.elL = { x: 128, y: 262 };
    j.elR = { x: 236, y: 262 };
    j.haL = { x: 150, y: 330 };
    j.haR = { x: 214, y: 330 };
    j.pelvis = { x: 181, y: 360 };
    j.hipL = { x: 164, y: 362 };
    j.hipR = { x: 200, y: 362 };
    j.knL = { x: 150, y: 470 };
    j.knR = { x: 214, y: 476 };
    j.ftL = { x: 150, y: 604 };
    j.ftR = { x: 226, y: 564 };
  } else if (tier === 1) {
    // E — standing, weary, hood down (hair shows)
    hood = false;
    j.crown = { x: 180, y: 60 };
    j.headC = { x: 180, y: 96 };
    j.chin = { x: 180, y: 130 };
    j.neck = { x: 180, y: 140 };
    j.shL = { x: 134, y: 162 };
    j.shR = { x: 226, y: 162 };
    j.elL = { x: 122, y: 238 };
    j.elR = { x: 238, y: 238 };
    j.haL = { x: 118, y: 314 };
    j.haR = { x: 242, y: 314 };
  } else if (tier === 5) {
    // A — right arm raised, commanding the shadows
    j.crown = { x: 180, y: 44 };
    j.elR = { x: 256, y: 150 };
    j.haR = { x: 286, y: 84 };
    j.elL = { x: 120, y: 240 };
    j.haL = { x: 116, y: 314 };
  } else if (tier === 6) {
    // S — arms wide, dual blades, monarch
    j.shL = { x: 128, y: 154 };
    j.shR = { x: 232, y: 154 };
    j.elL = { x: 98, y: 184 };
    j.elR = { x: 262, y: 184 };
    j.haL = { x: 74, y: 130 };
    j.haR = { x: 286, y: 130 };
  } else if (tier === 7) {
    // SS — floating, arms open & serene, legs together, wings out
    lift = 26;
    j.elL = { x: 104, y: 214 };
    j.elR = { x: 256, y: 214 };
    j.haL = { x: 86, y: 258 };
    j.haR = { x: 274, y: 258 };
    j.hipL = { x: 170, y: 326 };
    j.hipR = { x: 190, y: 326 };
    j.knL = { x: 172, y: 456 };
    j.knR = { x: 188, y: 456 };
    j.ftL = { x: 170, y: 606 };
    j.ftR = { x: 190, y: 606 };
  }
  return { j, lift, hood, kneel };
}

export default function HunterCanvas({
  rank,
  condition,
  penalty = false,
  className,
  fill = false,
  height = 360,
}: Props) {
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
      typeof navigator !== "undefined" &&
      ((navigator as any).hardwareConcurrency || 8) <= 4;

    let cw = 0;
    let ch = 0;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        lowEnd ? 1.5 : 2,
      );
      cw = Math.max(1, rect.width);
      ch = Math.max(1, rect.height);
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
    }
    resize();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    // ---------------- COAT CAPE (verlet) ----------------
    const COLS = lowEnd ? 6 : 8;
    const ROWS = lowEnd ? 8 : 11;
    type Node = {
      x: number; y: number; px: number; py: number;
      pin: boolean; col: number; row: number;
    };
    const cape: Node[] = [];
    const capeTopY = 150;
    const capeTopHalf = 30;
    const capeBotHalf = 96;
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
      for (let it = 0; it < 3; it++) {
        for (let r = 0; r < ROWS; r++) {
          for (let c0 = 0; c0 < COLS - 1; c0++) {
            satisfy(cape[idx(r, c0)], cape[idx(r, c0 + 1)], restCol[r]);
          }
        }
        for (let c0 = 0; c0 < COLS; c0++) {
          for (let r = 0; r < ROWS - 1; r++) {
            satisfy(cape[idx(r, c0)], cape[idx(r + 1, c0)], restRow[c0]);
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
      if (!a.pin) { a.x += ox; a.y += oy; }
      if (!b.pin) { b.x -= ox; b.y -= oy; }
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
        ang, rad,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.14,
      };
    }
    function rebuildParts() {
      const target = partCount();
      if (parts.length < target)
        for (let i = parts.length; i < target; i++) parts.push(spawn(true));
      else if (parts.length > target) parts.length = target;
    }
    rebuildParts();

    // ---------------- CEL-SHADED DRAW HELPERS ----------------
    function limb(a: Pt, b: Pt, wa: number, wb: number, base: string, shadow: string, outline: string) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 0.0001;
      const nx = -dy / len;
      const ny = dx / len;
      const path = () => {
        ctx!.beginPath();
        ctx!.moveTo(a.x + nx * wa, a.y + ny * wa);
        ctx!.lineTo(b.x + nx * wb, b.y + ny * wb);
        ctx!.arc(b.x, b.y, wb, Math.atan2(ny, nx), Math.atan2(-ny, -nx), false);
        ctx!.lineTo(a.x - nx * wa, a.y - ny * wa);
        ctx!.arc(a.x, a.y, wa, Math.atan2(-ny, -nx), Math.atan2(ny, nx), false);
        ctx!.closePath();
      };
      path();
      ctx!.fillStyle = base;
      ctx!.fill();
      // hard cel shadow on one half
      ctx!.save();
      path();
      ctx!.clip();
      ctx!.beginPath();
      ctx!.moveTo(a.x, a.y);
      ctx!.lineTo(b.x, b.y);
      ctx!.lineTo(b.x + nx * wb, b.y + ny * wb);
      ctx!.lineTo(a.x + nx * wa, a.y + ny * wa);
      ctx!.closePath();
      ctx!.fillStyle = shadow;
      ctx!.fill();
      ctx!.restore();
      path();
      ctx!.lineWidth = 2.4;
      ctx!.strokeStyle = outline;
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
      const weak = penalty || cond < 0.32 || tier <= 1;
      const accent = penalty ? "#ef4444" : isSS ? "#ffffff" : c;
      const broken = tier <= 0;

      // toon palette
      const base = "#13161f";
      const shadow = "#080a11";
      const skin = broken ? "#8c8a90" : "#c9b5a2";
      const skinSh = broken ? "#5d5c63" : "#94816f";
      const outline = "#04050a";
      const hair = "#0c0d12";

      const t = frame / 60;
      const breathe = Math.sin(t * 1.5) * (weak ? 1.3 : 2.6);
      const bob = Math.sin(t * 1.1) * (weak ? 1.5 : tier >= 6 ? 5 : 3);

      const { j: pose0, lift, hood, kneel } = poseFor(tier, penalty);
      const pose: Joints = {};
      for (const k in pose0) pose[k] = { x: pose0[k].x, y: pose0[k].y };
      for (const k of ["crown", "headC", "chin", "neck", "shL", "shR"]) {
        pose[k].y += breathe * (k === "crown" ? 1 : 0.6);
      }

      // ---- canvas + fit transform ----
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, cw, ch);
      const fit = Math.min(cw / DW, ch / DH) * 0.96;
      const ox = (cw - DW * fit) / 2;
      const floatLift = isSS ? Math.sin(t * 0.9) * 6 : 0;
      const oy = (ch - DH * fit) / 2 - (lift + floatLift) * fit;

      const figCx = ox + 180 * fit;
      const figCy = oy + 300 * fit;

      // ===== BACKGROUND AURA =====
      const auraR = Math.max(cw, ch) * (0.42 + cond * 0.16);
      const g = ctx!.createRadialGradient(figCx, figCy, 8, figCx, figCy, auraR);
      g.addColorStop(0, rgba(accent, (isSS ? 0.34 : 0.24) * (0.45 + cond * 0.7)));
      g.addColorStop(0.4, rgba(accent, 0.07 * (0.4 + cond)));
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
          p.x += p.vx * 0.4;
          p.y += 0.5 + Math.abs(p.vy) * 0.2;
        } else if (tier === 6) {
          p.ang += 0.05 + cond * 0.03;
          p.rad -= 0.25;
          p.y += p.vy * (0.7 + cond);
          if (p.rad < 14) p.rad = 60 + Math.random() * 90;
          p.x = 180 + Math.cos(p.ang) * p.rad;
        } else if (tier === 5) {
          p.ang += 0.02;
          p.rad -= 0.6;
          p.x = 180 + Math.cos(p.ang) * p.rad;
          p.y += p.vy * 0.5 + Math.sin(p.ang) * 0.4;
          if (p.rad < 10) Object.assign(p, spawn(false));
        } else {
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
        ctx!.fillStyle = accent;
        ctx!.shadowColor = accent;
        ctx!.shadowBlur = 8;
        if (tier === 4) {
          ctx!.strokeStyle = accent;
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
          ctx!.fillStyle = rgba("#ffffff", 0.18);
          ctx!.strokeStyle = rgba("#ffffff", 0.6);
          ctx!.lineWidth = 1.2;
          ctx!.shadowColor = rgba("#ffffff", 0.6);
          ctx!.shadowBlur = 18;
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
          const sx = 180 + side * (66 + depth * 34);
          const sy = 360 - depth * 6 + Math.sin(t * 1.3 + i) * 6;
          const sc = 0.5 + depth * 0.06;
          ctx!.save();
          ctx!.translate(sx, sy);
          ctx!.scale(sc, sc);
          ctx!.globalAlpha = (cond >= 0.6 ? 0.5 : 0.28) - depth * 0.05;
          ctx!.fillStyle = mix(c, "#04060d", 0.45);
          ctx!.shadowColor = rgba(c, 0.6);
          ctx!.shadowBlur = 10;
          ctx!.beginPath();
          ctx!.moveTo(0, -70);
          ctx!.quadraticCurveTo(34, -54, 26, 30);
          ctx!.lineTo(20, 120);
          ctx!.lineTo(-20, 120);
          ctx!.lineTo(-26, 30);
          ctx!.quadraticCurveTo(-34, -54, 0, -70);
          ctx!.closePath();
          ctx!.fill();
          ctx!.shadowBlur = 6;
          ctx!.fillStyle = isSS ? "#ffffff" : "#ff5a5a";
          ctx!.beginPath();
          ctx!.arc(-6, -46, 2, 0, Math.PI * 2);
          ctx!.arc(6, -46, 2, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        }
      }

      // ===== GROUND glow + cracks (S+) =====
      ctx!.save();
      const gg = ctx!.createRadialGradient(180, 606, 4, 180, 606, 130);
      gg.addColorStop(0, rgba(accent, weak ? 0.18 : 0.4));
      gg.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = gg;
      ctx!.beginPath();
      ctx!.ellipse(180, 606, 118, 20, 0, 0, Math.PI * 2);
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
          ctx!.moveTo(180, 602);
          ctx!.lineTo(180 + ex * 0.5, 602 + ey * 0.5);
          ctx!.lineTo(180 + ex, 602 + ey);
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
              by - 90 - k * 22 - Math.abs(sway),
            );
            ctx!.stroke();
          }
        }
        ctx!.restore();
      }

      // ===== THE COAT — verlet cape behind the body =====
      const windAmp = penalty
        ? 0.05
        : (0.18 + cond * 0.5) * (tier >= 6 ? 1.5 : tier >= 4 ? 1.2 : 1);
      simCape(t, windAmp, breathe * 0.5, { j: pose });
      if (tier >= 1) drawCape(ctx!, cape, COLS, ROWS, idx, base, accent, cond, penalty, outline);

      // ===== BODY =====
      // legs
      limb(pose.hipL, pose.knL, 16, 11, base, shadow, outline);
      limb(pose.knL, pose.ftL, 11, 8, base, shadow, outline);
      limb(pose.hipR, pose.knR, 16, 11, base, shadow, outline);
      limb(pose.knR, pose.ftR, 11, 8, base, shadow, outline);
      // boots
      for (const f of [pose.ftL, pose.ftR]) {
        ctx!.beginPath();
        ctx!.moveTo(f.x - 9, f.y - 10);
        ctx!.lineTo(f.x + 9, f.y - 10);
        ctx!.lineTo(f.x + 14, f.y + 10);
        ctx!.lineTo(f.x - 12, f.y + 10);
        ctx!.closePath();
        ctx!.fillStyle = shadow;
        ctx!.fill();
        ctx!.lineWidth = 2.2;
        ctx!.strokeStyle = outline;
        ctx!.stroke();
      }

      // torso
      drawTorso(ctx!, pose, base, shadow, outline, accent, cond);

      // arms
      const arm = (sh: Pt, el: Pt, ha: Pt) => {
        limb(sh, el, 12, 8, base, shadow, outline);
        limb(el, ha, 8, 6, base, shadow, outline);
        ctx!.beginPath();
        ctx!.ellipse(ha.x, ha.y, 7, 8.5, 0, 0, Math.PI * 2);
        ctx!.fillStyle = shadow;
        ctx!.fill();
        ctx!.lineWidth = 2;
        ctx!.strokeStyle = outline;
        ctx!.stroke();
      };
      arm(pose.shL, pose.elL, pose.haL);
      arm(pose.shR, pose.elR, pose.haR);

      // pauldrons (D+)
      if (tier >= 2) {
        drawPauldron(ctx!, pose.shL, -1, base, shadow, outline, tier, accent, cond);
        drawPauldron(ctx!, pose.shR, 1, base, shadow, outline, tier, accent, cond);
      }

      // mana veins on chest (C+)
      if (tier >= 3 && !penalty) {
        ctx!.save();
        ctx!.strokeStyle = rgba(accent, 0.5 + cond * 0.45);
        ctx!.lineWidth = 1.1;
        ctx!.shadowColor = rgba(accent, 0.8);
        ctx!.shadowBlur = 5;
        ctx!.beginPath();
        ctx!.moveTo(170, 200); ctx!.lineTo(168, 240); ctx!.lineTo(160, 270);
        ctx!.moveTo(190, 200); ctx!.lineTo(192, 240); ctx!.lineTo(200, 270);
        ctx!.moveTo(168, 240); ctx!.lineTo(180, 250); ctx!.lineTo(192, 240);
        ctx!.stroke();
        ctx!.restore();
      }

      // neck + head + hood/hair + glowing eyes
      limb(pose.neck, { x: pose.headC.x, y: pose.chin.y - 4 }, 7, 6.5, skinSh, "#6f5f52", outline);
      drawHead(ctx!, pose, base, shadow, skin, skinSh, hair, outline, accent, c, cond, tier, hood, penalty);

      // equipment (crown, blades)
      drawEquipment(ctx!, pose, tier, c, accent, cond, t, penalty, isSS, outline);

      // chains (UNRANKED / penalty)
      if (kneel || tier <= 0 || penalty) drawChains(ctx!, pose);

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

    if (!reduce) loop();
    else {
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
      role="img"
      aria-label="Animated hunter visualization"
      className={className}
      style={
        fill
          ? { width: "100%", height: "100%", display: "block" }
          : { width: "100%", height, display: "block" }
      }
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
  base: string,
  accent: string,
  cond: number,
  penalty: boolean,
  outline: string,
) {
  ctx.save();
  // outer silhouette
  ctx.beginPath();
  ctx.moveTo(cape[idx(0, 0)].x, cape[idx(0, 0)].y);
  for (let c0 = 1; c0 < COLS; c0++) ctx.lineTo(cape[idx(0, c0)].x, cape[idx(0, c0)].y);
  for (let r = 1; r < ROWS; r++) ctx.lineTo(cape[idx(r, COLS - 1)].x, cape[idx(r, COLS - 1)].y);
  for (let c0 = COLS - 1; c0 >= 0; c0--) ctx.lineTo(cape[idx(ROWS - 1, c0)].x, cape[idx(ROWS - 1, c0)].y);
  for (let r = ROWS - 1; r >= 0; r--) ctx.lineTo(cape[idx(r, 0)].x, cape[idx(r, 0)].y);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, 150, 0, 600);
  cg.addColorStop(0, mix(base, "#06080f", penalty ? 0.5 : 0.3));
  cg.addColorStop(1, "#03040a");
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = outline;
  ctx.stroke();
  // vertical fold shading
  for (let c0 = 0; c0 < COLS - 1; c0++) {
    ctx.beginPath();
    ctx.moveTo(cape[idx(0, c0)].x, cape[idx(0, c0)].y);
    for (let r = 1; r < ROWS; r++) ctx.lineTo(cape[idx(r, c0)].x, cape[idx(r, c0)].y);
    ctx.globalAlpha = c0 % 2 === 0 ? 0.2 : 0.07;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // rank-coloured rim on the two outer edges
  ctx.strokeStyle = rgba(accent, 0.45 + cond * 0.35);
  ctx.lineWidth = 2;
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
  base: string,
  shadow: string,
  outline: string,
  accent: string,
  cond: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(j.shL.x, j.shL.y);
  ctx.quadraticCurveTo(j.shL.x - 4, j.shL.y + 60, j.hipL.x - 2, j.hipL.y);
  ctx.quadraticCurveTo(j.pelvis.x, j.pelvis.y + 14, j.hipR.x + 2, j.hipR.y);
  ctx.quadraticCurveTo(j.shR.x + 4, j.shR.y + 60, j.shR.x, j.shR.y);
  ctx.quadraticCurveTo(j.neck.x, j.neck.y - 2, j.shL.x, j.shL.y);
  ctx.closePath();
  const tg = ctx.createLinearGradient(j.shL.x, 0, j.shR.x, 0);
  tg.addColorStop(0, base);
  tg.addColorStop(0.55, base);
  tg.addColorStop(1, shadow);
  ctx.fillStyle = tg;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = outline;
  ctx.stroke();
  // center seam + collar V
  ctx.strokeStyle = rgba(accent, 0.45);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(j.neck.x, j.neck.y + 6);
  ctx.lineTo(j.pelvis.x, j.pelvis.y - 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(j.neck.x - 13, j.neck.y + 6);
  ctx.lineTo(j.neck.x, j.neck.y + 34);
  ctx.lineTo(j.neck.x + 13, j.neck.y + 6);
  ctx.stroke();
  ctx.restore();
}

function drawPauldron(
  ctx: CanvasRenderingContext2D,
  sh: { x: number; y: number },
  side: number,
  base: string,
  shadow: string,
  outline: string,
  tier: number,
  accent: string,
  cond: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sh.x - side * 9, sh.y - 9);
  ctx.quadraticCurveTo(sh.x + side * 26, sh.y - 18, sh.x + side * 22, sh.y + 16);
  ctx.quadraticCurveTo(sh.x + side * 6, sh.y + 18, sh.x - side * 7, sh.y + 9);
  ctx.closePath();
  const pg = ctx.createLinearGradient(sh.x, sh.y - 18, sh.x, sh.y + 18);
  pg.addColorStop(0, mix(base, "#222838", 0.4));
  pg.addColorStop(1, shadow);
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = outline;
  ctx.stroke();
  if (tier >= 4) {
    ctx.beginPath();
    ctx.moveTo(sh.x + side * 18, sh.y - 12);
    ctx.lineTo(sh.x + side * 34, sh.y - 30);
    ctx.lineTo(sh.x + side * 24, sh.y - 6);
    ctx.closePath();
    ctx.fillStyle = rgba(accent, 0.7);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
  ctx.restore();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  j: Record<string, { x: number; y: number }>,
  base: string,
  shadow: string,
  skin: string,
  skinSh: string,
  hair: string,
  outline: string,
  accent: string,
  c: string,
  cond: number,
  tier: number,
  hood: boolean,
  penalty: boolean,
) {
  const h = j.headC;
  const isSS = tier >= 7;
  const facePath = () => {
    ctx.beginPath();
    ctx.moveTo(h.x - 13, h.y - 8);
    ctx.quadraticCurveTo(h.x - 15, h.y + 12, h.x - 6, j.chin.y - 4);
    ctx.quadraticCurveTo(h.x, j.chin.y + 2, h.x + 6, j.chin.y - 4);
    ctx.quadraticCurveTo(h.x + 15, h.y + 12, h.x + 13, h.y - 8);
    ctx.quadraticCurveTo(h.x, h.y - 24, h.x - 13, h.y - 8);
    ctx.closePath();
  };

  if (hood) {
    facePath();
    ctx.fillStyle = "#1b1822";
    ctx.fill();
    ctx.save();
    facePath();
    ctx.clip();
    const fg = ctx.createLinearGradient(h.x - 13, 0, h.x + 13, 0);
    fg.addColorStop(0, rgba(skin, 0.5));
    fg.addColorStop(0.45, "rgba(40,36,48,0)");
    ctx.fillStyle = fg;
    ctx.fillRect(h.x - 14, h.y - 26, 30, 80);
    ctx.restore();
    facePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = outline;
    ctx.stroke();
    // hood drape
    ctx.beginPath();
    ctx.moveTo(j.shL.x + 4, j.shL.y + 2);
    ctx.quadraticCurveTo(h.x - 40, h.y - 18, h.x - 2, j.crown.y - 6);
    ctx.quadraticCurveTo(h.x + 2, j.crown.y - 12, h.x + 2, j.crown.y - 6);
    ctx.quadraticCurveTo(h.x + 40, h.y - 18, j.shR.x - 4, j.shR.y + 2);
    ctx.quadraticCurveTo(h.x + 24, h.y, h.x + 13, h.y - 10);
    ctx.quadraticCurveTo(h.x, h.y - 30, h.x - 13, h.y - 10);
    ctx.quadraticCurveTo(h.x - 24, h.y, j.shL.x + 4, j.shL.y + 2);
    ctx.closePath();
    const hg = ctx.createLinearGradient(0, j.crown.y, 0, j.shL.y);
    hg.addColorStop(0, mix(base, "#1c2230", 0.35));
    hg.addColorStop(1, shadow);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = outline;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(h.x, h.y - 2, 13, 16, 0, Math.PI * 0.15, Math.PI * 0.85);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(3,4,9,0.85)";
    ctx.stroke();
  } else {
    facePath();
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.save();
    facePath();
    ctx.clip();
    ctx.fillStyle = skinSh;
    ctx.fillRect(h.x + 2, h.y - 24, 28, 80);
    ctx.fillStyle = rgba("#6f5f52", 0.5);
    ctx.fillRect(h.x - 1, h.y - 2, 3, 9);
    ctx.restore();
    facePath();
    ctx.lineWidth = 2.1;
    ctx.strokeStyle = outline;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(h.x - 4, h.y + 13);
    ctx.lineTo(h.x + 4, h.y + 13);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = "#6f5f52";
    ctx.stroke();
    // spiky black hair
    ctx.beginPath();
    ctx.moveTo(h.x - 15, h.y + 1);
    ctx.lineTo(h.x - 20, h.y - 15);
    ctx.lineTo(h.x - 10, h.y - 12);
    ctx.lineTo(h.x - 13, h.y - 27);
    ctx.lineTo(h.x - 3, h.y - 15);
    ctx.lineTo(h.x - 1, h.y - 31);
    ctx.lineTo(h.x + 4, h.y - 15);
    ctx.lineTo(h.x + 12, h.y - 28);
    ctx.lineTo(h.x + 10, h.y - 12);
    ctx.lineTo(h.x + 19, h.y - 15);
    ctx.lineTo(h.x + 15, h.y + 1);
    ctx.quadraticCurveTo(h.x + 11, h.y - 7, h.x + 6, h.y - 6);
    ctx.quadraticCurveTo(h.x, h.y - 12, h.x - 6, h.y - 6);
    ctx.quadraticCurveTo(h.x - 11, h.y - 7, h.x - 15, h.y + 1);
    ctx.closePath();
    ctx.fillStyle = hair;
    ctx.fill();
    ctx.lineWidth = 2.1;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }

  // EYES — glowing almond (signature)
  const eyeCol = isSS ? "#ffffff" : tier >= 6 ? "#ff5a5a" : tier >= 2 ? accent : tier <= 0 ? "#7a8290" : "#d6dae3";
  ctx.save();
  ctx.shadowColor = eyeCol;
  ctx.shadowBlur = hood ? 14 : 9;
  for (const side of [-1, 1]) {
    const ex = h.x + side * 6.5;
    const ey = h.y + (hood ? -1 : 1);
    ctx.fillStyle = eyeCol;
    ctx.beginPath();
    ctx.moveTo(ex - side * 2, ey - 3.4);
    ctx.quadraticCurveTo(ex + side * 6, ey - 4, ex + side * 7, ey + 0.5);
    ctx.quadraticCurveTo(ex + side * 5, ey + 2.8, ex - side * 2, ey + 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(ex + side * 2.5, ey - 0.5, 1.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = eyeCol;
    ctx.shadowBlur = hood ? 14 : 9;
  }
  ctx.restore();
  // angry brow
  ctx.strokeStyle = hood ? rgba(eyeCol, 0.5) : outline;
  ctx.lineWidth = 1.6;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(h.x + side * 2.5, h.y - 4.5);
    ctx.lineTo(h.x + side * 10, h.y - 6.5);
    ctx.stroke();
  }
}

function drawEquipment(
  ctx: CanvasRenderingContext2D,
  j: Record<string, { x: number; y: number }>,
  tier: number,
  c: string,
  accent: string,
  cond: number,
  t: number,
  penalty: boolean,
  isSS: boolean,
  outline: string,
) {
  // crown of dark energy (A+)
  if (tier >= 5) {
    ctx.save();
    ctx.translate(j.crown.x, j.crown.y - 8 + Math.sin(t * 1.6) * 2);
    ctx.fillStyle = rgba(isSS ? "#ffffff" : accent, 0.85);
    ctx.shadowColor = rgba(accent, 0.9);
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(-17, 7);
    ctx.lineTo(-10, -15);
    ctx.lineTo(-4, -2);
    ctx.lineTo(0, -22);
    ctx.lineTo(4, -2);
    ctx.lineTo(10, -15);
    ctx.lineTo(17, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const blade = (ha: { x: number; y: number }, dir: number, len: number) => {
    ctx.save();
    ctx.translate(ha.x, ha.y);
    ctx.rotate(dir);
    ctx.shadowColor = rgba(accent, 0.9);
    ctx.shadowBlur = 12;
    const bg = ctx.createLinearGradient(0, 0, 0, -len);
    bg.addColorStop(0, rgba(accent, 0.95));
    bg.addColorStop(1, rgba(isSS ? "#ffffff" : c, 0.55));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-3.2, 6);
    ctx.lineTo(3.2, 6);
    ctx.lineTo(2.4, -len);
    ctx.lineTo(0, -len - 12);
    ctx.lineTo(-2.4, -len);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(c, 0.95);
    ctx.fillRect(-10, 4, 20, 4);
    ctx.fillRect(-2.6, 8, 5.2, 13);
    ctx.restore();
  };

  if (penalty) return; // shackled — no weapon
  if (tier === 6 || tier === 7) {
    blade(j.haL, -2.5, 92);
    blade(j.haR, 2.5, 92);
  } else if (tier >= 3 && tier <= 4) {
    blade(j.haR, 0.15, tier >= 4 ? 98 : 82);
  }
}

function drawChains(
  ctx: CanvasRenderingContext2D,
  j: Record<string, { x: number; y: number }>,
) {
  for (const ha of [j.haL, j.haR]) {
    ctx.strokeStyle = "rgba(140,146,160,0.75)";
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const yy = ha.y + 10 + k * 15;
      ctx.beginPath();
      ctx.ellipse(ha.x + 2, yy, 3, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.rect(ha.x - 8, ha.y - 5, 16, 10);
    ctx.fillStyle = "#2a2e38";
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = "#565c6a";
    ctx.stroke();
  }
}
