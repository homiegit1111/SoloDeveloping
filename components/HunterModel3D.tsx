"use client";

import { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { Rank } from "@/lib/types";

// ============================================================
// HUNTER MODEL 3D — Sung Jin-Woo rendered with rank-driven
// lighting, particles, aura and animation. Every rank looks
// dramatically different.
// ============================================================

// Per-rank escalating config:
// fa=floatAmp  fs=floatSpeed  sa=swayAmp
// pc=particleCount  ps=particleSpeed
// em=emissiveIntensity  kl=keyLight  rl=rimLight
// Minimum animation baselines — even UNRANKED breathes and sways
const FA_MIN = 0.035; // float amplitude minimum
const SA_MIN = 0.02;  // sway amplitude minimum
const FS_MIN = 0.6;   // float speed minimum

const R = [
  { fa: 0.04,  fs: 0.7,  sa: 0.022, pc: 6,   ps: 0.35, em: 0.03, kl: 2.2, rl: 1.2 }, // 0 UNRANKED
  { fa: 0.05,  fs: 0.82, sa: 0.028, pc: 14,  ps: 0.5,  em: 0.06, kl: 2.8, rl: 1.5 }, // 1 E
  { fa: 0.065, fs: 0.95, sa: 0.036, pc: 26,  ps: 0.75, em: 0.12, kl: 3.4, rl: 1.9 }, // 2 D
  { fa: 0.085, fs: 1.05, sa: 0.046, pc: 42,  ps: 1.05, em: 0.19, kl: 4.0, rl: 2.4 }, // 3 C
  { fa: 0.11,  fs: 1.18, sa: 0.058, pc: 62,  ps: 1.5,  em: 0.27, kl: 5.0, rl: 3.0 }, // 4 B
  { fa: 0.14,  fs: 1.32, sa: 0.072, pc: 90,  ps: 2.0,  em: 0.36, kl: 6.0, rl: 4.0 }, // 5 A
  { fa: 0.18,  fs: 1.55, sa: 0.09,  pc: 135, ps: 2.8,  em: 0.50, kl: 8.0, rl: 5.5 }, // 6 S
  { fa: 0.24,  fs: 1.9,  sa: 0.12,  pc: 210, ps: 4.0,  em: 0.70, kl: 11.0,rl: 8.0 }, // 7 SS
] as const;

// ── RISING MANA PARTICLES ─────────────────────────────────────
function ManaParticles({
  color,
  count,
  speed,
  modelHeight,
}: {
  color: string;
  count: number;
  speed: number;
  modelHeight: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const half = modelHeight / 2;

  const { geo, vel, lt } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const lt = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.25 + Math.random() * 0.85;
      pos[i * 3] = Math.cos(ang) * rad;
      pos[i * 3 + 1] = (Math.random() - 0.5) * modelHeight;
      pos[i * 3 + 2] = Math.sin(ang) * rad;
      vel[i * 3] = (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 1] = 0.012 + Math.random() * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
      lt[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo, vel, lt };
  }, [count, modelHeight]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color,
        size: 0.045,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color],
  );

  useFrame((_, dt) => {
    if (!ref.current || count === 0) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      lt[i] += dt * speed * 0.18;
      if (lt[i] > 1) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 0.2 + Math.random() * 0.9;
        pos[i * 3] = Math.cos(ang) * rad;
        pos[i * 3 + 1] = -half + Math.random() * 0.3;
        pos[i * 3 + 2] = Math.sin(ang) * rad;
        lt[i] = 0;
      } else {
        pos[i * 3] += vel[i * 3] * speed;
        pos[i * 3 + 1] += vel[i * 3 + 1] * speed;
        pos[i * 3 + 2] += vel[i * 3 + 2] * speed;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;
  return <points ref={ref} geometry={geo} material={mat} />;
}

// ── AURA SHELL ────────────────────────────────────────────────
function AuraShell({
  color,
  intensity,
  modelHeight,
}: {
  color: string;
  intensity: number;
  modelHeight: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.getElapsedTime();
    ref.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.04);
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      intensity * (0.08 + Math.sin(t * 1.1) * 0.025);
  });
  if (intensity < 0.05) return null;
  const radius = modelHeight * 0.42;
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={intensity * 0.08}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ── SS-RANK WING WISPS ────────────────────────────────────────
function ShadowWings({
  color,
  active,
  modelHeight,
}: {
  color: string;
  active: boolean;
  modelHeight: number;
}) {
  const lRef = useRef<THREE.Mesh>(null);
  const rRef = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const t = s.clock.getElapsedTime();
    const flap = Math.sin(t * 1.2) * 0.18;
    if (lRef.current) lRef.current.rotation.z = 0.4 + flap;
    if (rRef.current) rRef.current.rotation.z = -0.4 - flap;
  });
  if (!active) return null;
  const wy = modelHeight * 0.12;
  return (
    <>
      <mesh ref={lRef} position={[-modelHeight * 0.32, wy, -0.1]}>
        <planeGeometry args={[modelHeight * 0.55, modelHeight * 0.7]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={rRef} position={[modelHeight * 0.32, wy, -0.1]}>
        <planeGeometry args={[modelHeight * 0.55, modelHeight * 0.7]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// ── GROUND DISC ───────────────────────────────────────────────
function GroundDisc({
  color,
  intensity,
}: {
  color: string;
  intensity: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.getElapsedTime();
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      intensity * (0.18 + Math.sin(t * 1.3) * 0.06);
  });
  if (intensity < 0.05) return null;
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.9, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.18}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ── THE HUNTER MODEL ──────────────────────────────────────────
interface SceneProps {
  rankColor: string;
  rankIndex: number;
  condition: number;
  penalty: boolean;
}

function HunterScene({ rankColor, rankIndex, condition, penalty }: SceneProps) {
  const { scene: rawScene, animations } = useGLTF("/hunter.glb");
  // Clone so we never mutate the shared drei GLTF cache
  const scene = useMemo(() => rawScene.clone(true), [rawScene]);
  const groupRef = useRef<THREE.Group>(null);
  const [modelH, setModelH] = useState(1);
  const [fitted, setFitted] = useState(false);

  const cfg = R[Math.min(rankIndex, R.length - 1)];
  const effectColor = penalty ? "#ef4444" : rankColor;

  // ── Play any built-in GLB animation clips (idle walk etc.) ──
  const { actions } = useAnimations(animations, groupRef);
  useEffect(() => {
    const keys = Object.keys(actions);
    if (keys.length === 0) return;
    // Prefer idle/stand clips; fall back to first available
    const name =
      keys.find((k) => /idle|stand|wait|breath|neutral/i.test(k)) ?? keys[0];
    const action = actions[name];
    if (!action) return;
    action.reset().fadeIn(0.4).play();
    // Scale playback speed with rank — feels more energetic at higher tiers
    action.timeScale = 0.65 + rankIndex * 0.08;
    return () => { action.fadeOut(0.4); };
  }, [actions, rankIndex]);

  // ── Auto-fit: scale + center (rotation handled by useFrame) ──
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const TARGET = 3.2;
    const s = TARGET / Math.max(size.y, 0.001);
    scene.scale.set(s, s, s);
    const box2 = new THREE.Box3().setFromObject(scene);
    const ctr2 = box2.getCenter(new THREE.Vector3());
    scene.position.set(-ctr2.x, -ctr2.y, -ctr2.z);
    // Do NOT set scene.rotation here — useFrame owns the group rotation
    setModelH(TARGET);
    setFitted(true);
  }, [scene]);

  // ── Apply rank-coloured emissive tint ──
  useEffect(() => {
    if (!fitted) return;
    const color = new THREE.Color(effectColor);
    const ei = cfg.em + condition * 0.18 + (penalty ? 0.35 : 0);
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mats = Array.isArray((child as THREE.Mesh).material)
        ? ((child as THREE.Mesh).material as THREE.Material[])
        : [(child as THREE.Mesh).material as THREE.Material];
      mats.forEach((m) => {
        if ((m as THREE.MeshStandardMaterial).emissive !== undefined) {
          const s = m as THREE.MeshStandardMaterial;
          s.emissive.copy(color);
          s.emissiveIntensity = ei;
        }
      });
    });
  }, [fitted, scene, effectColor, condition, penalty, cfg.em]);

  // ── LAYERED PROCEDURAL IDLE — 5-axis organic motion ──
  // Multiple irrational-ratio sine waves so the pattern never exactly repeats.
  // Result: breathing, weight-shifting, spine-twisting — feels genuinely alive.
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const g = groupRef.current;

    const fa = Math.max(cfg.fa, FA_MIN);
    const fs = Math.max(cfg.fs, FS_MIN);
    const sa = Math.max(cfg.sa, SA_MIN);

    // Y — layered breathing float (3 frequencies = organic, non-mechanical)
    const breath  = Math.sin(t * fs * 0.83) * fa;          // slow lung fill
    const bounce  = Math.sin(t * fs * 1.97) * fa * 0.22;   // weight energy
    const micro   = Math.sin(t * fs * 3.41) * fa * 0.07;   // heartbeat shimmer
    g.position.y  = breath + bounce + micro;

    // Y-rotation — dual sway so head traces a lazy figure-8, stays facing forward
    const sway1   = Math.sin(t * 0.38) * sa;
    const sway2   = Math.sin(t * 0.73 + 0.6) * sa * 0.32;
    g.rotation.y  = Math.PI + sway1 + sway2;

    // X-translation — weight shift left/right (phase offset from sway)
    g.position.x  = Math.sin(t * 0.38 + 0.55) * 0.055;

    // X-rotation — forward/back lean (chest breathing depth)
    g.rotation.x  = Math.sin(t * 0.53) * 0.024;

    // Z-rotation — subtle spine micro-roll (natural body asymmetry)
    g.rotation.z  = Math.sin(t * 0.44 + 1.2) * 0.016;

    // SS: dreamy slow elevation float
    if (rankIndex >= 7) {
      g.position.y += 0.16 + Math.sin(t * 0.47) * 0.07;
    }
  });

  if (!fitted) return null;

  const kl = (cfg.kl + condition * 0.6) * (penalty ? 1.4 : 1);
  const rl = (cfg.rl + condition * 0.4) * (penalty ? 0.6 : 1);
  const half = modelH / 2;

  return (
    <group ref={groupRef}>
      {/* ─ Lighting ─ */}
      {/* Strong ambient so the model is always clearly visible */}
      <ambientLight intensity={0.7 + rankIndex * 0.05} />

      {/* Warm front-fill — illuminates the face the camera now sees */}
      <directionalLight
        position={[0, 1.2, 3]}
        intensity={kl * 0.65}
        color="#e8d5b0"
      />
      {/* Key light — rank-colored from above-front */}
      <directionalLight
        position={[1.2, 3, 2]}
        intensity={kl}
        color={effectColor}
        castShadow={false}
      />
      {/* Cool counter-fill — soft blue bounce so shadows have depth */}
      <directionalLight
        position={[-2.5, 1.0, 1]}
        intensity={kl * 0.3}
        color="#4466aa"
      />
      {/* Rim light from behind — dramatic edge glow */}
      <pointLight
        position={[0, half * 0.3, -2]}
        color={effectColor}
        intensity={rl * 1.4}
        distance={10}
      />
      {/* Ground uplift */}
      <pointLight
        position={[0, -half - 0.3, 1]}
        color={effectColor}
        intensity={rl * 0.8}
        distance={7}
      />

      {/* ─ Model ─ */}
      <primitive object={scene} />

      {/* ─ Effects ─ */}
      <ManaParticles
        color={effectColor}
        count={cfg.pc}
        speed={cfg.ps}
        modelHeight={modelH}
      />
      {/* Always show aura shell — even UNRANKED has a hint of power */}
      <AuraShell
        color={effectColor}
        intensity={Math.max(cfg.em * 2.5, 0.12) + condition * 0.4}
        modelHeight={modelH}
      />
      {/* Always show ground disc — roots the model in the scene */}
      <GroundDisc
        color={effectColor}
        intensity={Math.max(cfg.em * 2, 0.18) + condition * 0.3}
      />
      {/* Shadow wings only for S & SS */}
      <ShadowWings
        color={effectColor}
        active={rankIndex >= 6}
        modelHeight={modelH}
      />
    </group>
  );
}

// ── WIREFRAME LOADING SPINNER ─────────────────────────────────
function WireframeFallback({ rankColor }: { rankColor: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.7;
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.25;
  });
  return (
    <group>
      <ambientLight intensity={1.0} />
      <pointLight position={[2, 2, 2]} color={rankColor} intensity={4} />
      <mesh ref={ref}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={rankColor}
          emissive={rankColor}
          emissiveIntensity={0.8}
          wireframe
        />
      </mesh>
    </group>
  );
}

// ── PUBLIC COMPONENT ──────────────────────────────────────────
interface HunterModel3DProps {
  rank: Rank;
  condition?: number;
  penalty?: boolean;
}

export default function HunterModel3D({
  rank,
  condition = 0,
  penalty = false,
}: HunterModel3DProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        // Camera: slightly elevated to frame chest/face area; d=4.2 for tighter framing
        camera={{ position: [0, 0.6, 4.2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={<WireframeFallback rankColor={rank.color} />}>
          <HunterScene
            rankColor={rank.color}
            rankIndex={rank.index}
            condition={condition}
            penalty={penalty}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
