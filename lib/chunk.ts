import { BookChunk } from "./types";

// ============================================================
// Shared text chunking + category tagging (server-side).
// Mirrors the offline pre-processing so uploaded books behave
// identically to preloaded ones.
// ============================================================

const KEYWORDS: Record<string, string[]> = {
  gym: ["muscle", "rep", "set", "workout", "lift", "squat", "bench", "deadlift", "training", "exercise", "press", "biceps", "chest", "protein"],
  skincare: ["skin", "cleanse", "moisturiz", "exfoliat", "spf", "sunscreen", "serum", "acne", "wrinkle", "collagen", "hydrat", "pore", "glow", "retinol"],
  grooming: ["shave", "beard", "hair", "razor", "grooming", "cologne", "fragrance", "nails", "groom", "scent", "deodor"],
  communication: ["conversation", "listen", "speak", "speech", "rapport", "eye contact", "story", "vocabulary", "confidence", "social"],
  psychology: ["mind", "emotion", "fear", "anxiety", "belief", "behavior", "behaviour", "psycholog", "mental", "thought", "ego"],
  habits: ["habit", "routine", "discipline", "system", "consistency", "willpower", "trigger", "streak", "identity"],
  masculine: ["man", "masculine", "men", "father", "warrior", "strength", "honor", "honour", "courage"],
  biography: ["born", "empire", "battle", "emperor", "general", "conquered", "legacy", "throne", "reign"],
  nutrition: ["eat", "food", "diet", "calorie", "protein", "nutrition", "vitamin", "sugar", "meal", "greens"],
};

export function clean(t: string): string {
  return t
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\ufb01/g, "fi")
    .replace(/\ufb02/g, "fl")
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function tagChunk(text: string): string[] {
  const low = text.toLowerCase();
  const tags: string[] = [];
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    let hits = 0;
    for (const k of kws) hits += low.split(k).length - 1;
    if (hits >= 2) tags.push(cat);
  }
  return tags.length ? tags : ["general"];
}

// Split raw book text into ~targetWords chunks.
export function chunkText(slug: string, raw: string, targetWords = 220): BookChunk[] {
  const cleaned = clean(raw);
  const words = cleaned.split(/\s+/);
  const chunks: BookChunk[] = [];
  let buf: string[] = [];
  let idx = 0;
  // approximate page numbers assuming ~350 words/page
  const wordsPerPage = 350;
  let wordCount = 0;
  for (const w of words) {
    buf.push(w);
    wordCount++;
    if (buf.length >= targetWords) {
      const page = Math.max(1, Math.floor((wordCount - buf.length / 2) / wordsPerPage) + 1);
      const text = buf.join(" ");
      chunks.push({ id: `${slug}-${idx}`, book: slug, page, text, tags: tagChunk(text) });
      idx++;
      buf = [];
    }
  }
  if (buf.length) {
    const text = buf.join(" ");
    const page = Math.max(1, Math.floor(wordCount / wordsPerPage));
    chunks.push({ id: `${slug}-${idx}`, book: slug, page, text, tags: tagChunk(text) });
  }
  return chunks;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Infer book-level categories from the most common chunk tags.
export function inferCategories(chunks: BookChunk[]): string[] {
  const counts: Record<string, number> = {};
  for (const c of chunks) for (const t of c.tags) counts[t] = (counts[t] || 0) + 1;
  return Object.entries(counts)
    .filter(([t]) => t !== "general")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);
}
