import { AppState, BookChunk } from "./types";
import { authorFor, titleFor } from "./books";

export interface Lesson {
  chunk: BookChunk;
  book: string; // title
  author: string;
  bookSlug: string;
}

// Deterministic daily pick — same passage all day, rotates each date.
export function lessonOfTheDay(state: AppState): Lesson | null {
  const all: { slug: string; chunk: BookChunk }[] = [];
  for (const [slug, chunks] of Object.entries(state.bookChunks || {})) {
    for (const c of chunks || []) all.push({ slug, chunk: c });
  }
  if (all.length === 0) return null;
  const seed = dayHash(new Date().toISOString().slice(0, 10));
  const pick = all[seed % all.length];
  return {
    chunk: pick.chunk,
    book: titleFor(pick.slug),
    author: authorFor(pick.slug),
    bookSlug: pick.slug,
  };
}

function dayHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
