// ============================================================
// SKINCARE PROTOCOL — built-in AM/PM routine + rotating glow tip.
// Grounded in the uploaded books: MANMADE (Chris Salgardo) core
// mantra "Cleanse, Moisturize, Protect" + Glow From Within
// (Joanna Vargas) "consistency + nutrition" thesis.
// Science explained simply.
// ============================================================

export interface RoutineStep {
  step: string;
  how: string;
  science: string;
}

export const MORNING_ROUTINE: RoutineStep[] = [
  {
    step: "1. Cleanse",
    how: "Splash lukewarm water, use a gentle face wash (not bar soap). 20-30 sec, then pat dry.",
    science:
      "Overnight oil + sweat sit on the skin. A gentle cleanser clears them without stripping the barrier. (MANMADE: 'cleanse, moisturize, protect — in that order')",
  },
  {
    step: "2. (Optional) Vitamin C / Treat",
    how: "A few drops of a light serum, pressed in with the ring finger.",
    science:
      "Antioxidants like Vitamin C fight daytime free-radical damage and brighten tone over weeks.",
  },
  {
    step: "3. Moisturise",
    how: "Pea-sized amount, smooth over the whole face & neck while skin is slightly damp.",
    science:
      "Locks water into the skin. Even oily skin needs it — strip the skin and it over-produces oil. (Salgardo: 'moisturize. Every time.')",
  },
  {
    step: "4. Protect (SPF)",
    how: "Finish with a moisturiser or sunscreen containing SPF 30-50. Every single morning.",
    science:
      "UV is the #1 cause of ageing and damage — for every skin tone. SPF is the single highest-ROI step. (Both books insist: daily SPF.)",
  },
];

export const EVENING_ROUTINE: RoutineStep[] = [
  {
    step: "1. Cleanse",
    how: "Wash off the day's dirt, sweat, sunscreen. Double cleanse if you wore SPF all day.",
    science:
      "Removing the day's buildup prevents clogged pores and lets night repair happen cleanly.",
  },
  {
    step: "2. Exfoliate (2-3× / week only)",
    how: "Gentle exfoliant on exfoliation nights — not daily. Avoid scrubbing raw.",
    science:
      "Supports natural shedding (desquamation) so fresh skin surfaces. Over-exfoliating damages the barrier. (Glow From Within)",
  },
  {
    step: "3. Treat",
    how: "Serum or targeted treatment (e.g. for spots/tone). Ring-finger press, no dragging.",
    science:
      "Night is when skin repairs. Active ingredients (hyaluronic acid, retinoids if used) work best now.",
  },
  {
    step: "4. Moisturise",
    how: "Slightly richer moisturiser at night to support overnight repair.",
    science:
      "Hydrated skin repairs faster and looks plumper by morning. (Vargas: heavier moisturiser over serum if dehydrated.)",
  },
];

export const GLOW_TIPS: string[] = [
  "Consistency beats intensity. Same routine, every day, beats expensive products used randomly. (Vargas)",
  "Drink water and eat your greens — skin glows from nutrition first, products second. (Glow From Within)",
  "Never skip SPF, even indoors or on cloudy days. UV is cumulative and invisible.",
  "Apply products with your ring finger — it presses the lightest, especially around the eyes. (MANMADE)",
  "Don't over-cleanse. Twice a day is plenty; more strips your barrier.",
  "Sleep is skincare. 7-8 hours is when repair and collagen-building happen.",
  "Shave WITH the grain, not against — prevents irritation and ingrown hairs. (MANMADE)",
  "Moisturise while skin is still slightly damp to trap more water.",
  "Greens and fruit feed your skin cells — pile them on the plate. (Glow From Within)",
  "Cut sugar spikes — they accelerate skin ageing (glycation).",
  "Patch-test new products. What glows your friend may break you out. (Vargas breaks out from marula oil she recommends!)",
  "Moisturise your hands daily too — they age fastest and tell the truth about your habits. (MANMADE)",
  "Grooming is your first intentional act of the day — 'getting ready is becoming ready'. (Anthony Mackie, MANMADE foreword)",
  "Less is more. A few solid steps done daily beat a 10-step routine you abandon.",
];

export function skincareTipForDay(dayNumber: number): string {
  const idx = (Math.max(1, dayNumber) - 1) % GLOW_TIPS.length;
  return GLOW_TIPS[idx];
}

// Exfoliation suggested on roughly every 3rd day
export function isExfoliationDay(dayNumber: number): boolean {
  return dayNumber % 3 === 0;
}
