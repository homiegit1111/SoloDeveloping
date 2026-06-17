"use client";

import { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
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
// Minimum animation baselines — always visible even at UNRANKED
const FA_MIN = 0.07;   // float amplitude minimum (visible breathing)
const SA_MIN = 0.42;   // scan amplitude minimum (~24° head turn — clearly visible)
const FS_MIN = 0.55;   // float speed minimum

// la = lookAngle (scan L/R), ls = lookSpeed, fa = floatAmp, fs = floatSpeed
// pc = particleCount, ps = particleSpeed, em = emissive, kl = keyLight, rl = rimLight
const R = [
  { la: 0.42, ls: 0.18, fa: 0.08, fs: 0.55, pc: 6,   ps: 0.35, em: 0.03, kl: 2.2, rl: 1.2 }, // 0 UNRANKED
  { la: 0.46, ls: 0.20, fa: 0.09, fs: 0.62, pc: 14,  ps: 0.5,  em: 0.06, kl: 2.8, rl: 1.5 }, // 1 E
  { la: 0.50, ls: 0.23, fa: 0.10, fs: 0.70, pc: 26,  ps: 0.75, em: 0.12, kl: 3.4, rl: 1.9 }, // 2 D
  { la: 0.54, ls: 0.26, fa: 0.12, fs: 0.78, pc: 42,  ps: 1.05, em: 0.19, kl: 4.0, rl: 2.4 }, // 3 C
  { la: 0.58, ls: 0.29, fa: 0.14, fs: 0.88, pc: 62,  ps: 1.5,  em: 0.27, kl: 5.0, rl: 3.0 }, // 4 B
  { la: 0.62, ls: 0.32, fa: 0.17, fs: 0.98, pc: 90,  ps: 2.0,  em: 0.36, kl: 6.0, rl: 4.0 }, // 5 A
  { la: 0.68, ls: 0.37, fa: 0.21, fs: 1.15, pc: 135, ps: 2.8,  em: 0.50, kl: 8.0, rl: 5.5 }, // 6 S
  { la: 0.75, ls: 0.44, fa: 0.27, fs: 1.40, pc: 210, ps: 4.0,  em: 0.70, kl: 11.0,rl: 8.0 }, // 7 SS
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

  // SkeletonUtils.clone (not scene.clone) properly remaps skinned-mesh
  // bone references so useAnimations can drive individual bones on the clone.
  const scene = useMemo(() => SkeletonUtils.clone(rawScene), [rawScene]);
  const groupRef = useRef<THREE.Group>(null);
  const [modelH, setModelH] = useState(1);
  const [fitted, setFitted] = useState(false);

  const cfg = R[Math.min(rankIndex, R.length - 1)];
  const effectColor = penalty ? "#ef4444" : rankColor;

  // ── Bind animations to the SCENE (not group) so bone tracks resolve correctly ──
  // Passing the scene object directly means AnimationMixer targets the cloned bones.
  const { actions, names } = useAnimations(animations, scene);

  useEffect(() => {
    if (names.length === 0) return;
    // Try idle/stand clips first, then fall back to whichever clip exists
    const name =
      names.find((n) => /idle|stand|wait|breath|neutral|t-?pose/i.test(n))
      ?? names[0];
    const action = actions[name];
    if (!action) return;
    action.reset().fadeIn(0.5).play();
    // Higher ranks play faster — feels more energetic
    action.timeScale = 0.6 + rankIndex * 0.08;
    return () => { action.fadeOut(0.4); };
  }, [actions, names, rankIndex]);

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

  // ── SECONDARY GROUP MOTION — overlaid on top of bone animation ──
  // If the GLB has bone clips they drive the character;
  // the group adds a gentle environmental float + slow world-space scan.
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const g = groupRef.current;

    const la = Math.max(cfg.la, SA_MIN);
    const ls = cfg.ls;
    const fa = Math.max(cfg.fa, FA_MIN);
    const fs = Math.max(cfg.fs, FS_MIN);

    // Slow environmental float (gravity/mana levitation)
    const breathMain = Math.sin(t * fs * 0.9) * fa;
    const breathHold = Math.sin(t * fs * 2.1) * fa * 0.18;
    g.position.y = breathMain + breathHold;

    // Head scan — character surveys the room
    const rawScan = Math.sin(t * ls);
    const scan = Math.sign(rawScan) * Math.pow(Math.abs(rawScan), 0.6) * la;
    g.rotation.y = Math.PI + scan;

    // Weight shift follows the scan direction
    g.position.x = scan * 0.08;
    g.rotation.z = -scan * 0.04;
    g.rotation.x = Math.sin(t * 0.51) * 0.018;

    if (rankIndex >= 7) {
      g.position.y += 0.18 + Math.sin(t * 0.45) * 0.08;
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
