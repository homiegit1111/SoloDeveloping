// ============================================================
// STEP 3 — OPEN THE RIGHT BOOKS   +   STEP 6 — NEVER REPEAT
// Given the diagnosis and a domain, build a query FROM the diagnosis (never
// from a fixed curriculum), open only the books that own that domain, and pull
// the passage that fits this exact moment — excluding anything used in the last
// 7 days so every day reads like a new chapter.
// ============================================================
import { BookChunk } from "./types";
import { Diagnosis, Domain } from "./diagnosis";
import { DOMAIN_BOOKS, BOOKS } from "./books";

export interface Passage {
  chunk: BookChunk;
  book: string; // title
  author: string;
  mentor: string;
  page: number;
  text: string;
}

// Build the retrieval query for a domain straight from the diagnosed state.
export function queryForDomain(dx: Diagnosis, domain: Domain): string {
  switch (domain) {
    case "gym":
      return (
        {
          adherence: "adherence consistency habit form technique full body compound beginner show up",
          volume: "volume sets per week progression hypertrophy work capacity accumulate",
          intensity: "intensity load mechanical tension progressive overload heavy reps RPE",
          frequency: "frequency training split days per week recovery fresh sets",
          selection: "exercise selection specialization variation weak point isolation",
        }[dx.gymStage] + " muscle strength training"
      );
    case "study": {
      const ladder = [
        "term coefficient exponent factor expression definitions fundamentals",
        "addition subtraction signed numbers operations order parentheses",
        "special products factoring square binomial difference squares",
        "fractions lowest terms multiply divide reduce common denominator",
        "linear equation solve unknown transpose root",
        "simultaneous equations elimination substitution two unknowns",
        "quadratic equation factor complete square formula roots",
        "ratio proportion mean fourth proportional terms",
        "arithmetical geometrical progression series sum term",
      ];
      const i = Math.min(ladder.length - 1, dx.studyLevel);
      return ladder[i] + " virtue habit excellence study practice golden mean reason";
    }
    case "skincare":
      return dx.skincareLevel < 14
        ? "cleanse moisturise spf sunscreen basic routine morning evening hydrate skin barrier"
        : "treatment serum exfoliate retinol active ingredient repair glow grooming hair";
    case "social":
      return (
        "boundaries approval needs assertive directly express integrity nice guy covert contract " +
        archetypeTerms(dx.archetype)
      );
    case "mind":
      return (
        {
          onboarding: "consistency one thing small win calm order foundation",
          recovering: "comeback never miss twice one disciplined action callus restart",
          discipline_breaking: "accountability mirror 40 percent rule callus mind stay hard urge resist",
          plateau: "harder path push limit suffer next level discomfort",
          playing_safe: "advance edge comfort never consolidate seek the hard on purpose",
          momentum: "next level hard depth mastery callus take souls",
        }[dx.phase] +
        " " +
        archetypeTerms(dx.archetype)
      );
  }
}

function archetypeTerms(a: Diagnosis["archetype"]): string {
  return {
    King: "king order calm blessing foundation generativity center",
    Warrior: "warrior disciplined aggression worthy goal courage cut through decisive",
    Magician: "magician knowledge insight mastery study patterns transformation initiation",
    Lover: "lover passion aliveness connection feeling sensual energy reconnect",
  }[a];
}

// Score a chunk against query terms (mirrors store.retrieveChunks, deterministic).
function score(chunk: BookChunk, query: string): number {
  const low = chunk.text.toLowerCase();
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
  let s = 0;
  for (const t of terms) s += low.split(t).length - 1;
  for (const tag of chunk.tags) if (query.toLowerCase().includes(tag)) s += 3;
  return s;
}

// Decide which book each retrieved passage came from (slug -> entry).
function toPassage(chunk: BookChunk): Passage {
  const entry = BOOKS[chunk.book];
  return {
    chunk,
    book: entry?.title || chunk.book,
    author: entry?.author || chunk.book,
    mentor: entry?.mentor || chunk.book,
    page: chunk.page,
    text: chunk.text,
  };
}

// Pull up to k passages for a domain from the books that own it, preferring
// primary -> secondary -> tertiary, excluding recently-used chunk ids.
export function retrieveForDomain(
  allChunks: BookChunk[],
  dx: Diagnosis,
  domain: Domain,
  k = 2,
  exclude: Set<string> = new Set()
): Passage[] {
  const slugs = DOMAIN_BOOKS[domain];
  const query = queryForDomain(dx, domain);
  const out: Passage[] = [];

  for (const slug of slugs) {
    if (out.length >= k) break;
    const pool = allChunks.filter((c) => c.book === slug);
    if (pool.length === 0) continue;
    const ranked = pool
      .map((c) => ({ c, s: score(c, query) }))
      .sort((a, b) => b.s - a.s);
    // first try excluding recently-used; relax if nothing left
    let pick = ranked.find((r) => r.s > 0 && !exclude.has(r.c.id));
    if (!pick) pick = ranked.find((r) => !exclude.has(r.c.id));
    if (!pick) pick = ranked[0];
    if (pick) {
      out.push(toPassage(pick.c));
      exclude.add(pick.c.id);
    }
  }
  return out;
}

// Build the full per-domain passage set for today's plan.
export function retrieveAll(
  allChunks: BookChunk[],
  dx: Diagnosis
): Record<Domain, Passage[]> {
  const exclude = new Set<string>(dx.usedChunkIds);
  const domains: Domain[] = ["gym", "study", "skincare", "social", "mind"];
  const result = {} as Record<Domain, Passage[]>;
  for (const d of domains) {
    result[d] = retrieveForDomain(allChunks, dx, d, 2, exclude);
  }
  return result;
}

// Flatten a domain map to a plain chunk list (for the AI route payload / legacy).
export function flattenPassages(map: Record<Domain, Passage[]>): BookChunk[] {
  return Object.values(map).flat().map((p) => p.chunk);
}

const ALL_DOMAINS: Domain[] = ["gym", "study", "skincare", "social", "mind"];

export function emptyPassages(): Record<Domain, Passage[]> {
  const out = {} as Record<Domain, Passage[]>;
  for (const d of ALL_DOMAINS) out[d] = [];
  return out;
}

// Rebuild the per-domain Passage map from the chunk arrays the client sends.
export function passagesFromDomainChunks(
  map: Record<string, BookChunk[]> | undefined
): Record<Domain, Passage[]> {
  const out = emptyPassages();
  if (!map) return out;
  for (const d of ALL_DOMAINS) out[d] = (map[d] || []).map(toPassage);
  return out;
}

// Client helper: reduce the Passage map to plain chunk arrays for the payload.
export function domainChunksOf(map: Record<Domain, Passage[]>): Record<string, BookChunk[]> {
  const out: Record<string, BookChunk[]> = {};
  for (const d of ALL_DOMAINS) out[d] = (map[d] || []).map((p) => p.chunk);
  return out;
}
