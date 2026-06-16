import { Rank } from "./types";

// ============================================================
// RANK & PROGRESSION SYSTEM
// Inspired by Solo Leveling's Hunter ranks. Ravi starts UNRANKED
// and ascends as total XP (earned from consistent habits) grows.
// The on-screen Hunter visually evolves at each tier.
// ============================================================

export const RANKS: Rank[] = [
  {
    index: 0,
    name: "UNRANKED",
    title: "The Weakest Hunter",
    threshold: 0,
    color: "#6b7280",
    glow: "rgba(107,114,128,0.4)",
    aura: "none",
    description:
      "You were measured by the System and found wanting. Everyone starts here. Few rise. The only way out is to show up tomorrow.",
  },
  {
    index: 1,
    name: "E-RANK",
    title: "Awakened",
    threshold: 150,
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.5)",
    aura: "faint-grey",
    description:
      "The gate opened. You moved. The first spark of mana flickers — barely a flame, but it is yours.",
  },
  {
    index: 2,
    name: "D-RANK",
    title: "The Persistent",
    threshold: 500,
    color: "#39d98a",
    glow: "rgba(57,217,138,0.5)",
    aura: "green",
    description:
      "You return even when it's hard. Consistency is becoming muscle. The System has started to notice you.",
  },
  {
    index: 3,
    name: "C-RANK",
    title: "The Disciplined",
    threshold: 1200,
    color: "#3da9fc",
    glow: "rgba(61,169,252,0.55)",
    aura: "blue",
    description:
      "Mana flows steady through you. Old habits that ruled you now bow. You are no longer who you were on Day 1.",
  },
  {
    index: 4,
    name: "B-RANK",
    title: "The Relentless",
    threshold: 2600,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.6)",
    aura: "violet",
    description:
      "Few make it this far. Your body is changing, your mind is sharpening, the people around you feel the shift.",
  },
  {
    index: 5,
    name: "A-RANK",
    title: "The Ascendant",
    threshold: 5000,
    color: "#f0a23b",
    glow: "rgba(240,162,59,0.6)",
    aura: "gold",
    description:
      "Elite. Rare air. What was once impossible is now your warm-up. The comeback is no longer a story — it's a fact.",
  },
  {
    index: 6,
    name: "S-RANK",
    title: "The Monarch",
    threshold: 9000,
    color: "#8a5cf6",
    glow: "rgba(138,92,246,0.75)",
    aura: "shadow-monarch",
    description:
      "Arise. You command yourself absolutely. Body forged, mind unbreakable, money moving, presence undeniable. Unrecognisable from Day 1.",
  },
];

export function rankForXP(totalXP: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (totalXP >= r.threshold) current = r;
  }
  return current;
}

export function nextRank(totalXP: number): Rank | null {
  for (const r of RANKS) {
    if (totalXP < r.threshold) return r;
  }
  return null; // already max
}

export function rankProgress(totalXP: number): number {
  const cur = rankForXP(totalXP);
  const nxt = nextRank(totalXP);
  if (!nxt) return 100;
  const span = nxt.threshold - cur.threshold;
  const into = totalXP - cur.threshold;
  return Math.max(0, Math.min(100, Math.round((into / span) * 100)));
}
