"use client";

import { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
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
const R = [
  { fa: 0.006, fs: 0.35, sa: 0.008, pc: 0, ps: 0, em: 0.0, kl: 1.8, rl: 0.5 }, // 0 UNRANKED
  {
    fa: 0.012,
    fs: 0.5,
    sa: 0.015,
    pc: 10,
    ps: 0.4,
    em: 0.04,
    kl: 2.2,
    rl: 0.8,
  }, // 1 E
  {
    fa: 0.022,
    fs: 0.62,
    sa: 0.025,
    pc: 22,
    ps: 0.7,
    em: 0.1,
    kl: 2.8,
    rl: 1.2,
  }, // 2 D
  {
    fa: 0.035,
    fs: 0.74,
    sa: 0.035,
    pc: 38,
    ps: 1.0,
    em: 0.17,
    kl: 3.4,
    rl: 1.6,
  }, // 3 C
  {
    fa: 0.052,
    fs: 0.86,
    sa: 0.048,
    pc: 58,
    ps: 1.4,
    em: 0.24,
    kl: 4.2,
    rl: 2.2,
  }, // 4 B
  { fa: 0.075, fs: 1.0, sa: 0.06, pc: 85, ps: 1.9, em: 0.33, kl: 5.2, rl: 3.0 }, // 5 A
  {
    fa: 0.105,
    fs: 1.2,
    sa: 0.075,
    pc: 130,
    ps: 2.6,
    em: 0.46,
    kl: 7.0,
    rl: 4.5,
  }, // 6 S
  {
    fa: 0.15,
    fs: 1.55,
    sa: 0.1,
    pc: 200,
    ps: 3.8,
    em: 0.65,
    kl: 10.0,
    rl: 7.0,
  }, // 7 SS
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
  const { scene: rawScene } = useGLTF("/hunter.glb");
  // Clone the scene so we never mutate the shared drei GLTF cache.
  // Without this, scale/position set on the shared object accumulates on every mount.
  const scene = useMemo(() => rawScene.clone(true), [rawScene]);
  const groupRef = useRef<THREE.Group>(null);
  const [modelH, setModelH] = useState(1);
  const [fitted, setFitted] = useState(false);

  const cfg = R[Math.min(rankIndex, R.length - 1)];
  const effectColor = penalty ? "#ef4444" : rankColor;

  // ── Auto-fit: scale model to fill ~85% of the stage vertically ──
  useEffect(() => {
    // Measure raw (unscaled) bounding box of our clone
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());

    // Target: model should be 3.2 "units" tall so it fills the stage
    const TARGET = 3.2;
    const s = TARGET / Math.max(size.y, 0.001);

    // Apply scale then re-center to world origin
    scene.scale.set(s, s, s);
    const box2 = new THREE.Box3().setFromObject(scene);
    const ctr2 = box2.getCenter(new THREE.Vector3());
    scene.position.set(-ctr2.x, -ctr2.y, -ctr2.z);

    setModelH(TARGET);
    setFitted(true);
  }, [scene]);

  // ── Apply rank-coloured emissive tint to all materials ──
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

  // ── Rank-driven idle animation ──
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * cfg.fs * 1.0) * cfg.fa;
    groupRef.current.rotation.y = Math.sin(t * 0.28) * cfg.sa;
    // SS floats upward slightly
    if (rankIndex >= 7) {
      groupRef.current.position.y += 0.12 + Math.sin(t * 0.5) * 0.05;
    }
  });

  if (!fitted) return null;

  const kl = (cfg.kl + condition * 0.6) * (penalty ? 1.4 : 1);
  const rl = (cfg.rl + condition * 0.4) * (penalty ? 0.6 : 1);
  const half = modelH / 2;

  return (
    <group ref={groupRef}>
      {/* ─ Lighting ─ */}
      {/* Ambient — always some base visibility */}
      <ambientLight intensity={0.4 + rankIndex * 0.04} />

      {/* Key light — rank-colored from above-front */}
      <directionalLight
        position={[0.6, 3, 2.5]}
        intensity={kl}
        color={effectColor}
        castShadow={false}
      />
      {/* Cool counter-fill so shadows aren't pure black */}
      <directionalLight
        position={[-2.5, 1.5, 1]}
        intensity={kl * 0.22}
        color="#5577cc"
      />
      {/* Rim light from behind — dramatic edge glow */}
      <pointLight
        position={[0, half * 0.4, -2.5]}
        color={effectColor}
        intensity={rl}
        distance={10}
      />
      {/* Ground uplift */}
      <pointLight
        position={[0, -half - 0.5, 0.8]}
        color={effectColor}
        intensity={rl * 0.55}
        distance={6}
      />

      {/* ─ Model ─ */}
      <primitive object={scene} />

      {/* ─ Effects (scale with rank) ─ */}
      <ManaParticles
        color={effectColor}
        count={cfg.pc}
        speed={cfg.ps}
        modelHeight={modelH}
      />
      <AuraShell
        color={effectColor}
        intensity={cfg.em * 2.5 + condition * 0.35}
        modelHeight={modelH}
      />
      <GroundDisc
        color={effectColor}
        intensity={cfg.em * 2 + condition * 0.25}
      />
      {/* Shadow wings only for S & SS */}
      <ShadowWings
        color={effectColor}
        active={rankIndex >= 6}
        modelHeight={modelH}
      />

      {/* Ground shadow contact */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -half, 0]}>
        <planeGeometry args={[2, 2]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
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
        // Camera positioned for a 3.2-unit tall model with fov=42
        // d = (1.6 / tan(21°)) * 1.2 ≈ 4.99 → use 5.0
        camera={{ position: [0, 0.1, 5.0], fov: 42 }}
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
