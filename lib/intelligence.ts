// ============================================================
// STEP 4 — BUILD THE PLAN   +   STEP 5 — BOSS TASK INTELLIGENCE
// Construct today's plan from the diagnosed state and the pulled passages.
// Every recommendation is traceable to a specific book + author. The gym
// prescription is a state -> prescription function grounded in the Helms
// pyramid (NOT a fixed weekly table). The maths topic walks a ladder tied to
// reps actually done. Boss tasks emerge from the books when the data says the
// hunter is ready — never random.
// This is the deterministic engine; when an AI key is set, the same diagnosis
// + passages are handed to the model to write the plan in richer prose.
// ============================================================
import { AppState, DailyPlan, PlanSource } from "./types";
import { Diagnosis, Domain } from "./diagnosis";
import { Passage } from "./retrieval";
import { HABIT_BY_ID } from "./habits";
import { todayStr } from "./store";

function cleanPassage(text: string, max = 280): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  t = t.slice(0, max);
  const stop = Math.max(t.lastIndexOf(". "), t.lastIndexOf("! "), t.lastIndexOf("? "));
  if (stop > 120) t = t.slice(0, stop + 1);
  return t.trim() + (/[.!?]$/.test(t) ? "" : "…");
}

function srcOf(p?: Passage): PlanSource | undefined {
  if (!p) return undefined;
  return { book: p.book, author: p.author, mentor: p.mentor, page: p.page };
}

function applies(p: Passage | undefined): string {
  return p ? `\n\nFrom ${p.author} — ${p.book} (p.${p.page}):\n"${cleanPassage(p.text)}"` : "";
}

// ---- GYM: prescription by Helms pyramid stage (state-driven, not a table) ----
function gymBlock(dx: Diagnosis, gym: Passage[]) {
  const helms = gym[0];
  const science = gym[1];
  const map = {
    adherence: {
      title: "Foundation — full-body, own the technique",
      detail:
        "3 compound lifts today (squat or leg press · a press · a row/pull). 3 sets × 8–10 reps @ RPE 7 — leave 3 reps in the tank. The ONLY goal is to show up and make the movement automatic. Helms: adherence is the base of the pyramid — volume, intensity and everything above it are worthless until this is a habit.",
    },
    volume: {
      title: "Build volume — upper / lower",
      detail:
        "Upper or lower split today. 4 sets × 8–12 reps per main lift. When you beat the top of the rep range on every set, add a set next week. Schoenfeld: chase mechanical tension across ~10–20 hard sets per muscle per week — that accumulated volume is what grows you now.",
    },
    intensity: {
      title: "Add intensity — push / pull / legs",
      detail:
        "Top set 4–6 reps @ RPE 8–9, then 2 back-off sets of 8–12. Matthews' double progression: add 2.5–5 kg only after you hit the top rep target two sessions running. Earn the load — the last 2 reps are where the man is built.",
    },
    frequency: {
      title: "Raise frequency — hit each muscle 2× this week",
      detail:
        "Distribute your volume so every major muscle is trained twice this week with fresher sets. Schoenfeld: higher frequency lets you accumulate quality volume without grinding through fatigue. Quality reps over hero sets.",
    },
    selection: {
      title: "Specialise — fine-tune exercise selection",
      detail:
        "Lead with your lagging area today and rotate one exercise variation you've run for 4–6 weeks. Helms: exercise selection is the tip of the pyramid — only worth fine-tuning now that adherence, volume, intensity and frequency are locked.",
    },
  }[dx.gymStage];
  return {
    block: { title: map.title, detail: map.detail + applies(helms) + (science && science.mentor !== helms?.mentor ? applies(science) : "") },
    source: srcOf(helms),
    used: gym.map((p) => p.chunk.id),
    mentors: gym.map((p) => p.mentor),
  };
}

// ---- MATHS: SSC CGL / government-exam ladder, tied to reps actually done, grounded in the SSC quant book + Aristotle ----
const MATHS_LADDER: { topic: string; practice: { q: string; a: string }[] }[] = [
  { topic: "Number System (HCF, LCM, Divisibility)", practice: [
    { q: "Find the HCF of 24 and 36", a: "12" },
    { q: "Find the LCM of 6 and 8", a: "24" },
  ] },
  { topic: "Percentage", practice: [
    { q: "What is 25% of 240?", a: "60" },
    { q: "A number increased by 20% becomes 96. Find the number", a: "80" },
  ] },
  { topic: "Ratio & Proportion", practice: [
    { q: "Divide 600 in the ratio 2 : 3", a: "240 and 360" },
    { q: "If a : b = 2 : 3 and b : c = 4 : 5, find a : c", a: "8 : 15" },
  ] },
  { topic: "Average", practice: [
    { q: "Find the average of 10, 20, 30, 40", a: "25" },
    { q: "The average of 5 numbers is 18. Find their sum", a: "90" },
  ] },
  { topic: "Profit, Loss & Discount", practice: [
    { q: "CP = 200, SP = 250. Find profit %", a: "25%" },
    { q: "Marked price 500 with a 10% discount. Find the selling price", a: "450" },
  ] },
  { topic: "Simple & Compound Interest", practice: [
    { q: "Find SI on ₹1000 at 5% p.a. for 2 years", a: "₹100" },
    { q: "Find CI on ₹1000 at 10% p.a. for 2 years", a: "₹210" },
  ] },
  { topic: "Time, Speed & Distance", practice: [
    { q: "A car travels 150 km in 3 hours. Find its speed", a: "50 km/h" },
    { q: "Convert 72 km/h to m/s", a: "20 m/s" },
  ] },
  { topic: "Time & Work", practice: [
    { q: "A finishes a job in 10 days, B in 15 days. Together they take?", a: "6 days" },
    { q: "12 men finish a job in 8 days. How many days for 16 men?", a: "6 days" },
  ] },
  { topic: "Mixture & Alligation", practice: [
    { q: "In what ratio mix rice at ₹20/kg and ₹30/kg to get ₹24/kg?", a: "3 : 2" },
    { q: "A 40-litre mixture has milk : water = 3 : 1. Litres of water?", a: "10" },
  ] },
  { topic: "Algebra (Identities & Equations)", practice: [
    { q: "If x + 1/x = 3, find x^2 + 1/x^2", a: "7" },
    { q: "Solve x^2 - 5x + 6 = 0", a: "x = 2 or x = 3" },
  ] },
  { topic: "Geometry", practice: [
    { q: "Two angles of a triangle are 50° and 60°. Find the third", a: "70°" },
    { q: "An inscribed angle is half of which angle on the same arc?", a: "the central angle" },
  ] },
  { topic: "Mensuration", practice: [
    { q: "Area of a circle with radius 7 (use π = 22/7)", a: "154" },
    { q: "Volume of a cube with side 5", a: "125" },
  ] },
  { topic: "Trigonometry", practice: [
    { q: "Find sin 30° + cos 60°", a: "1" },
    { q: "If tan θ = 1 (0°–90°), find θ", a: "45°" },
  ] },
  { topic: "Data Interpretation", practice: [
    { q: "A pie chart allots 25% to rent on an income of ₹40000. Rent = ?", a: "₹10000" },
    { q: "Sales over 4 years were 200, 300, 400, 500. Total sales?", a: "1400" },
  ] },
];

function mathsBlock(dx: Diagnosis, study: Passage[]) {
  const i = Math.min(MATHS_LADDER.length - 1, dx.studyLevel);
  const rung = MATHS_LADDER[i];
  const algebra = study.find((p) => p.mentor === "ssc") || study[0];
  const aristotle = study.find((p) => p.mentor === "aristotle");
  const practice = rung.practice.map((p, n) => `${n + 1}. ${p.q}   (ans: ${p.a})`).join("\n");
  const detail =
    `Today's rung: ${rung.topic}. You reach this because of the work you've actually logged — not a calendar.\n` +
    `Work the book's examples for this topic, then these:\n${practice}` +
    applies(algebra) +
    (aristotle ? `\n\nThe discipline of study — ${aristotle.author}:\n"${cleanPassage(aristotle.text, 200)}"` : "");
  return {
    block: { title: `${rung.topic} — one topic, done properly`, detail },
    source: srcOf(algebra),
    used: study.map((p) => p.chunk.id),
    mentors: study.map((p) => p.mentor),
  };
}

// ---- SKINCARE: layer by consistency, grounded in Vargas / Salgardo ----
function skincareBlock(dx: Diagnosis, skin: Passage[]) {
  const vargas = skin.find((p) => p.mentor === "vargas") || skin[0];
  const salgardo = skin.find((p) => p.mentor === "salgardo");
  let title: string, detail: string;
  if (dx.skincareLevel < 14) {
    title = "AM: cleanse → moisturise → SPF.  PM: cleanse → moisturise.";
    detail = "You're early in the skin journey — lock the basic routine until it's automatic before adding actives. Consistency is the active ingredient.";
  } else if (dx.skincareLevel < 35) {
    title = "AM: cleanse → moisturise → SPF.  PM: cleanse → treat → moisturise.";
    detail = "You've earned a treatment layer — introduce ONE active (gentle exfoliant 2–3×/week, or a serum) and watch how the skin responds before stacking more.";
  } else {
    title = "AM: cleanse → serum → moisturise → SPF.  PM: cleanse → active → moisturise.";
    detail = "Consistent for weeks — you can run targeted treatment now. Rotate actives intelligently and protect the barrier; more is not better.";
  }
  detail += applies(vargas) + (salgardo && salgardo.mentor !== vargas?.mentor ? applies(salgardo) : "");
  return {
    block: { title, detail },
    source: srcOf(vargas),
    used: skin.map((p) => p.chunk.id),
    mentors: skin.map((p) => p.mentor),
  };
}

// ---- COMMUNICATION / SOCIAL: Glover prescription + Moore archetype ----
function commBlock(dx: Diagnosis, social: Passage[]) {
  const glover = social.find((p) => p.mentor === "glover") || social[0];
  const moore = social.find((p) => p.mentor === "moore");
  const drill =
    dx.social === "isolating"
      ? "Initiate ONE real interaction today you'd normally avoid — a call, a question to a stranger, a direct message. The avoidance is the rep."
      : dx.social === "expanding"
      ? "Make one direct request today with no softening, no apology, no covert contract. State what you want plainly."
      : "Hold eye contact and state one honest opinion out loud today without hedging. Practice taking up space.";
  const detail =
    `As the ${dx.archetype} today: ${drill}` +
    applies(glover) +
    (moore && moore.mentor !== glover?.mentor ? applies(moore) : "");
  return {
    block: { title: `Field comms — the ${dx.archetype}'s move`, detail },
    source: srcOf(glover),
    used: social.map((p) => p.chunk.id),
    mentors: social.map((p) => p.mentor),
  };
}

// ---- MINDSET: Goggins / Moore passage that mirrors the moment ----
function mindBlock(dx: Diagnosis, mind: Passage[]) {
  // avoid repeating yesterday's mentor teaching (STEP 6)
  let lead = mind.find((p) => !dx.recentTeachings.includes(p.mentor)) || mind[0];
  const detail =
    dx.summary +
    applies(lead) +
    (mind[1] && mind[1].mentor !== lead?.mentor ? applies(mind[1]) : "");
  const legend =
    lead?.mentor === "goggins" ? "David Goggins" :
    lead?.mentor === "moore" ? "Robert Moore" :
    lead?.mentor === "aristotle" ? "Aristotle" : (lead?.author || "The System");
  return {
    block: { title: `Mental fortitude — ${legend}`, detail },
    legendStory: { legend, text: lead ? cleanPassage(lead.text, 240) : dx.summary },
    source: srcOf(lead),
    used: mind.map((p) => p.chunk.id),
    mentors: mind.map((p) => p.mentor),
  };
}

// ---- STEP 5: boss task emerges from the books when the data says ready ----
function pickBoss(dx: Diagnosis, P: Record<Domain, Passage[]>) {
  if (!dx.bossReady) return null;
  if (dx.phase === "discipline_breaking") {
    return {
      title: "BOSS — The Accountability Mirror",
      detail:
        "Goggins' challenge: write every excuse you've used to skip discipline on a sticky note, put it on your mirror, and attack ONE today by doing the exact thing you've been avoiding. No negotiation.",
      trigger: "Your body shows up but your discipline streak is breaking — Goggins says this is the exact moment to callus the mind.",
      source: { book: "Can't Hurt Me", author: "David Goggins", mentor: "goggins" } as PlanSource,
    };
  }
  if (dx.phase === "plateau") {
    return {
      title: "BOSS — Break the Plateau",
      detail:
        "Pick your main lift and run a true top set to RPE 9 (one rep from failure), then beat your logged rep PR by one. Schoenfeld/Helms: when adherence is proven, a deliberate intensity benchmark is what restarts adaptation.",
      trigger: "You show up daily but progress has stalled — the books say it's time for a measured intensity benchmark.",
      source: { book: "The Muscle & Strength Training Pyramid", author: "Eric Helms", mentor: "helms" } as PlanSource,
    };
  }
  if (dx.phase === "playing_safe") {
    return {
      title: "BOSS — Refuse to Consolidate",
      detail:
        "Alexander never consolidated when he could advance. Choose the harder path in one quest today on purpose — heavier, longer, or the thing that scares you — and finish it. Moore: this is the Warrior's initiation past comfort.",
      trigger: "You're strong across the board but playing it safe — the legends escalated exactly here.",
      source: { book: "King, Warrior, Magician, Lover", author: "Robert Moore & Douglas Gillette", mentor: "moore" } as PlanSource,
    };
  }
  // momentum
  return {
    title: "BOSS — Take a Soul",
    detail:
      "Goggins' 'taking souls': in your hardest quest today, do one more than you've ever done — one more set, one more page, one more rep of restraint. Bank it in the cookie jar.",
    trigger: "Streaks are climbing — Goggins says momentum is exactly when you reach for the next level of hard.",
    source: { book: "Can't Hurt Me", author: "David Goggins", mentor: "goggins" } as PlanSource,
  };
}

export function buildIntelligentPlan(
  state: AppState,
  dx: Diagnosis,
  passages: Record<Domain, Passage[]>
): DailyPlan {
  const gym = gymBlock(dx, passages.gym);
  const maths = mathsBlock(dx, passages.study);
  const skincare = skincareBlock(dx, passages.skincare);
  const comm = commBlock(dx, passages.social);
  const mind = mindBlock(dx, passages.mind);
  const boss = pickBoss(dx, passages);

  const weakest = dx.mostMissed[0];
  const weakLabel = weakest ? HABIT_BY_ID[weakest]?.label || weakest : null;

  const greeting = `Day ${dx.day}, ${state.name}. Rank ${dx.rank}. The ${dx.archetype} stands at the gate.`;
  const hasHistory = Object.keys(state.history).length > 0;
  const verdict = !hasHistory
    ? "This is the beginning. There is no yesterday to judge — only the man you start building right now."
    : dx.missedYesterday.length === 0
    ? "Yesterday: every quest cleared. This is how Monarchs are made — one full day at a time."
    : `Yesterday you left ${dx.missedYesterday.length} quest(s) undone (${dx.missedYesterday
        .map((m) => HABIT_BY_ID[m]?.short || m)
        .join(", ")}). The System remembers. Today you correct it.`;

  const focus = weakLabel
    ? `Primary focus: ${weakLabel} — your most-missed quest. ${dx.summary}`
    : dx.summary;

  const message = {
    onboarding: "Forget the mountain. Win the first small thing today. That is the whole game right now.",
    recovering: "Never miss twice. One disciplined action — not a grand gesture. Begin.",
    discipline_breaking: "Your mind is lying to you at 40%. The body is barely warm. Override it.",
    plateau: "Comfort is the plateau. Add the tension you've been avoiding.",
    playing_safe: "Safe is slow death. Take the harder path on purpose today.",
    momentum: "Momentum is a privilege you earned. Now go deeper. Stay hard.",
  }[dx.phase];

  const usedChunkIds = Array.from(
    new Set([...gym.used, ...maths.used, ...skincare.used, ...comm.used, ...mind.used])
  );
  const teachings = Array.from(
    new Set([...gym.mentors, ...maths.mentors, ...skincare.mentors, ...comm.mentors, ...mind.mentors])
  );

  return {
    date: todayStr(),
    generatedBy: "local",
    greeting,
    verdictOnYesterday: verdict,
    focus,
    gym: gym.block,
    maths: maths.block,
    skincare: skincare.block,
    communication: comm.block,
    mindset: mind.block,
    legendStory: mind.legendStory,
    message,
    diagnosis: { phase: dx.phase, summary: dx.summary, archetype: dx.archetype },
    bossTask: boss,
    sources: {
      gym: gym.source,
      maths: maths.source,
      skincare: skincare.source,
      communication: comm.source,
      mindset: mind.source,
    },
    usedChunkIds,
    teachings,
  };
}
