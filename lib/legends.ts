import { LegendQuote } from "./types";

// ============================================================
// THE LEGENDS — each speaks in their own voice and domain.
// These are the fallback/local voices. When AI is enabled and a
// matching biography/psychology book is uploaded, the planner pulls
// the legend's ACTUAL words from the book chunks instead.
//
// Domains:
//   Arnold     -> gym / body
//   Alexander  -> the battlefield of life / ambition
//   Buddha     -> discipline / desire / the mind
//   Marcus     -> discipline / stoic control
//   Clear      -> habits / systems
//   Goggins    -> pain / mental toughness (masculine)
//   Aristotle  -> virtue / character / wisdom (study & self-mastery)
//   Glover     -> social confidence / boundaries / Nice Guy recovery
//   Moore      -> mature masculine archetypes (King/Warrior/Magician/Lover) -> identity & purpose
// ============================================================

export const LEGENDS = {
  arnold: { name: "Arnold Schwarzenegger", domain: "gym", color: "#f0a23b" },
  alexander: { name: "Alexander the Great", domain: "ambition", color: "#3da9fc" },
  buddha: { name: "Buddha", domain: "discipline", color: "#39d98a" },
  marcus: { name: "Marcus Aurelius", domain: "discipline", color: "#a78bfa" },
  clear: { name: "James Clear", domain: "habits", color: "#6fd3ff" },
  goggins: { name: "David Goggins", domain: "toughness", color: "#ff4d5e" },
  aristotle: { name: "Aristotle", domain: "virtue", color: "#c9a44c" },
  glover: { name: "Dr. Robert Glover", domain: "masculinity", color: "#5f9ea0" },
  moore: { name: "Robert Moore", domain: "archetypes", color: "#b8860b" },
} as const;

export type LegendKey = keyof typeof LEGENDS;

// Curated motivational lines per legend (used when no biography book chunk is
// available yet). Replaced/augmented by real book text once uploaded.
export const LEGEND_LINES: Record<LegendKey, string[]> = {
  arnold: [
    "The last three or four reps is what makes the muscle grow. That area of pain divides a champion from someone who is not a champion.",
    "Strength does not come from winning. Your struggles develop your strengths.",
    "The mind is the limit. As long as the mind can envision that you can do something, you can do it.",
    "You can't climb the ladder of success with your hands in your pockets. Go to the gym. Today.",
    "Milk is for babies. When you grow up you have to drink beer — no, you have to lift heavy and eat clean.",
  ],
  alexander: [
    "There is nothing impossible to him who will try. The battlefield is your day — fight it.",
    "I am not afraid of an army of lions led by a sheep; I am afraid of an army of sheep led by a lion. Lead yourself.",
    "Through every generation of the human race there has been a constant war — a war with fear. Conquer yours today.",
    "Remember: upon the conduct of each depends the fate of all. Your discipline today writes your empire.",
    "Holding back is how empires are lost. Move. Take the ground in front of you.",
  ],
  buddha: [
    "You yourself, as much as anybody in the entire universe, deserve your love and affection — so train, don't punish.",
    "It is a man's own mind, not his enemy or foe, that lures him to evil ways. Watch the urge; do not feed it.",
    "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
    "The mind is everything. What you think, you become. Think discipline, become disciplined.",
    "Drop by drop is the water pot filled. Drop by drop is the man rebuilt.",
  ],
  marcus: [
    "You have power over your mind — not outside events. Realise this, and you will find strength.",
    "Waste no more time arguing about what a good man should be. Be one.",
    "The impediment to action advances action. What stands in the way becomes the way. The missed day becomes the lesson.",
    "At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.",
    "Confine yourself to the present. The work of this single day decides the man.",
  ],
  clear: [
    "You do not rise to the level of your goals. You fall to the level of your systems. Trust the daily quests.",
    "Every action you take is a vote for the type of person you wish to become. Cast a good vote today.",
    "Habits are the compound interest of self-improvement. 1% better every day.",
    "You should be far more concerned with your current trajectory than with your current results.",
    "Never miss twice. Missing once is an accident. Missing twice is the start of a new (bad) habit.",
  ],
  goggins: [
    "You are stopping at 40% of what you're capable of. Reach for the other 60% today.",
    "The most important conversation is the one you have with yourself. Don't lie to yourself tonight.",
    "Motivation is crap. Motivation comes and goes. When you're driven, whatever is in front of you gets demolished.",
    "Suffering is the true test of life. Stay hard.",
    "You will never learn from people if you always tap dance around the truth. The truth: you can do more.",
    "Look in the Accountability Mirror. Put a sticky note on it for every excuse and attack it one by one.",
    "Callus your mind through suffering. The brain will quit at 40% — override it. Take souls.",
    "Reach into your cookie jar. Remember every hard thing you already survived, and use it as fuel.",
  ],
  aristotle: [
    "We are what we repeatedly do. Excellence, then, is not an act but a habit. Build it today.",
    "Virtue is a state of character concerned with choice, lying in a mean - the middle between excess and deficiency. Find your mean.",
    "The roots of education are bitter, but the fruit is sweet. Sit with the bitter study now.",
    "Knowing yourself is the beginning of all wisdom. Be honest about your weak pillar.",
    "Courage is the first of the virtues, because it makes all the others possible. Act despite the fear.",
    "It is well to be up before daybreak, for such habits contribute to health, wealth, and wisdom.",
    "Pleasure in the job puts perfection in the work. Love the discipline, not just the result.",
  ],
  glover: [
    "Stop seeking approval. The Nice Guy gives to get - drop the covert contracts and just be who you are.",
    "Make your needs a priority. You teach people how to treat you by how you treat yourself.",
    "If it frightens you, do it. Approach what you've been avoiding - that's where the man you want to be is waiting.",
    "Set the boundary. Saying no to others is how you say yes to yourself.",
    "Express what you feel and what you want, directly and without apology. Resentment is the price of hiding it.",
    "Take full responsibility for your own life. Stop waiting for permission to become the integrated man.",
    "Surround yourself with men who hold you accountable. You become your own man in the company of other men.",
  ],
  moore: [
    "Access the King: bring order to your inner kingdom. A man who rules himself first can bless and build everything around him.",
    "The Warrior energy is disciplined aggression aimed at a worthy goal. Decide, commit, and cut through — no half-measures.",
    "The Magician is the man of knowledge and insight. Master your craft, study the patterns, and use what you know with intention.",
    "The Lover keeps you alive and connected — to your body, your purpose, and your people. Don't go numb; feel it and channel it.",
    "Boyhood (the immature masculine) seeks attention and runs from responsibility. Manhood claims it. Step up into the mature king.",
    "Don't worship your own ego or collapse into the shadow. Stand in the center of the four archetypes and act from there.",
    "A man who is not connected to his deep masculine energies becomes either a tyrant or a weakling. Access them on purpose, every day.",
  ],
};

// Map a focus/habit to the legend that should coach it
export function legendForFocus(focus: string): LegendKey {
  const f = focus.toLowerCase();
  if (f.includes("gym") || f.includes("body") || f.includes("train") || f.includes("strength"))
    return "arnold";
  if (f.includes("disciplin") || f.includes("urge") || f.includes("fap") || f.includes("control")) {
    // Deterministic (not Math.random) so the same focus always maps to the same
    // voice — keeps a given day's plan stable across re-renders/regenerations.
    let h = 0;
    for (let i = 0; i < f.length; i++) h = (h * 31 + f.charCodeAt(i)) >>> 0;
    return h % 2 === 0 ? "marcus" : "buddha";
  }
  if (f.includes("habit") || f.includes("streak") || f.includes("system")) return "clear";
  if (f.includes("pain") || f.includes("hard") || f.includes("tough") || f.includes("punish"))
    return "goggins";
  if (
    f.includes("archetype") || f.includes("king") || f.includes("warrior") ||
    f.includes("magician") || f.includes("lover") || f.includes("identity") ||
    f.includes("purpose") || f.includes("maturity") || f.includes("manhood") ||
    f.includes("initiation")
  )
    return "moore";
  if (
    f.includes("social") || f.includes("communicat") || f.includes("boundary") ||
    f.includes("boundaries") || f.includes("assert") || f.includes("confidence") ||
    f.includes("relationship") || f.includes("dating") || f.includes("masculin") ||
    f.includes("nice guy")
  )
    return "glover";
  if (
    f.includes("study") || f.includes("maths") || f.includes("math") || f.includes("learn") ||
    f.includes("wisdom") || f.includes("virtue") || f.includes("character") || f.includes("mind")
  )
    return "aristotle";
  return "alexander";
}

export function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export const ALL_QUOTES: LegendQuote[] = (
  Object.keys(LEGENDS) as LegendKey[]
).flatMap((k) =>
  LEGEND_LINES[k].map((text) => ({
    legend: LEGENDS[k].name,
    domain: LEGENDS[k].domain,
    text,
  }))
);
