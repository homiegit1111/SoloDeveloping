// ============================================================
// THE BOOK REGISTRY — the 9 (now 10) books are the ONLY source of truth.
// No hardcoded curriculum, no fixed weekly schedule. Every plan is built by
// diagnosing the live hunter state and pulling the right passage from the
// right book. This registry maps each book to its mentor, role and domains
// so the retrieval engine knows which books to open for each part of the day.
// ============================================================

export type Mentor =
  | "helms"
  | "schoenfeld"
  | "matthews"
  | "goggins"
  | "moore"
  | "glover"
  | "aristotle"
  | "ssc"
  | "vargas"
  | "salgardo";

export type Domain = "gym" | "study" | "skincare" | "social" | "mind";

export interface BookEntry {
  slug: string;
  title: string;
  author: string;
  mentor: Mentor;
  role: string; // one-line role in the system
  domains: Domain[];
}

export const BOOKS: Record<string, BookEntry> = {
  "muscle-strength-pyramid": {
    slug: "muscle-strength-pyramid",
    title: "The Muscle & Strength Training Pyramid",
    author: "Eric Helms",
    mentor: "helms",
    role: "Sets the gym framework: adherence > volume > intensity > frequency > exercise selection. Never skip a level.",
    domains: ["gym"],
  },
  "max-muscle-plan": {
    slug: "max-muscle-plan",
    title: "The M.A.X. Muscle Plan 2.0",
    author: "Brad Schoenfeld",
    mentor: "schoenfeld",
    role: "Provides the science: mechanical tension, metabolic stress, muscle damage, periodised hypertrophy.",
    domains: ["gym"],
  },
  "beyond-bigger-leaner-stronger": {
    slug: "beyond-bigger-leaner-stronger",
    title: "Beyond Bigger Leaner Stronger",
    author: "Michael Matthews",
    mentor: "matthews",
    role: "Provides the execution: exact lifts, form cues, double-progression model.",
    domains: ["gym"],
  },
  "cant-hurt-me": {
    slug: "cant-hurt-me",
    title: "Can't Hurt Me",
    author: "David Goggins",
    mentor: "goggins",
    role: "Activates when streaks break or quitting is near: accountability mirror, the 40% rule, callusing the mind, taking souls.",
    domains: ["mind"],
  },
  "king-warrior-magician-lover": {
    slug: "king-warrior-magician-lover",
    title: "King, Warrior, Magician, Lover",
    author: "Robert Moore & Douglas Gillette",
    mentor: "moore",
    role: "Selects the archetype the hunter needs today: King (order), Warrior (disciplined aggression), Magician (mastery), Lover (aliveness).",
    domains: ["mind", "social"],
  },
  "no-more-mr-nice-guy": {
    slug: "no-more-mr-nice-guy",
    title: "No More Mr. Nice Guy",
    author: "Dr. Robert A. Glover",
    mentor: "glover",
    role: "Activates on social avoidance/isolation: boundaries, dropping approval-seeking, making your needs a priority, integrated masculinity.",
    domains: ["social"],
  },
  "complete-aristotle": {
    slug: "complete-aristotle",
    title: "The Complete Aristotle (Ethics & Wisdom)",
    author: "Aristotle",
    mentor: "aristotle",
    role: "The discipline of study: virtue built through daily practice, the golden mean, the bitter root and sweet fruit of learning.",
    domains: ["study", "mind"],
  },
  "ssc-cgl-quant": {
    slug: "ssc-cgl-quant",
    title: "Quantitative Aptitude for SSC CGL",
    author: "SSC CGL Quant Reference",
    mentor: "ssc",
    role: "The maths source of truth: the full SSC CGL / Indian government-exam quantitative syllabus — number system, percentages, ratio, profit & loss, interest, time-speed-distance, time & work, mixtures, algebra, geometry, mensuration, trigonometry and data interpretation, with formulas and worked examples.",
    domains: ["study"],
  },
  "glow-from-within": {
    slug: "glow-from-within",
    title: "Glow From Within",
    author: "Joanna Vargas",
    mentor: "vargas",
    role: "The glow science: where the hunter is in the skin journey, from basic routine to deeper treatment.",
    domains: ["skincare"],
  },
  manmade: {
    slug: "manmade",
    title: "MANMADE",
    author: "Chris Salgardo",
    mentor: "salgardo",
    role: "Male-specific grooming protocols applied to the hunter's reported concerns (hair, skin changes).",
    domains: ["skincare"],
  },
};

// Domain -> ordered book slugs (primary, secondary, tertiary). The retrieval
// engine opens these books, in this order of authority, for each domain.
export const DOMAIN_BOOKS: Record<Domain, string[]> = {
  // Helms sets the framework, Schoenfeld the science, Matthews the execution.
  gym: ["muscle-strength-pyramid", "max-muscle-plan", "beyond-bigger-leaner-stronger"],
  // SSC CGL government-exam maths first, Aristotle for the virtue of study.
  study: ["ssc-cgl-quant", "complete-aristotle"],
  // Vargas for glow, Salgardo for male-specific application.
  skincare: ["glow-from-within", "manmade"],
  // Glover for practical social application, Moore for the archetypal frame.
  social: ["no-more-mr-nice-guy", "king-warrior-magician-lover"],
  // Goggins for toughness, Moore for archetype, Aristotle for reason.
  mind: ["cant-hurt-me", "king-warrior-magician-lover", "complete-aristotle"],
};

export function bookFor(slug: string): BookEntry | undefined {
  return BOOKS[slug];
}

export function authorFor(slug: string): string {
  return BOOKS[slug]?.author || slug;
}

export function titleFor(slug: string): string {
  return BOOKS[slug]?.title || slug;
}
