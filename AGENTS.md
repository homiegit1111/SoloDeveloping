# AGENTS.md — Handoff for the next AI agent

You are continuing **SoloDeveloping**, a Solo Leveling–inspired 90-day transformation app for **Ravi (24)**, who is rebuilding body, mind, money, social skills and discipline after a major comeback. Read this fully before changing anything.

## The vision (don't lose it)
This is not a generic habit tracker. It is **The System** from Solo Leveling made real. Every screen should feel like a Hunter ascending: dark, dramatic, alive. The AI coaches in the *actual voices* of real legends using the *actual wisdom* of real books — never generic summaries, never fake quotes. "Read every page of every book" and apply concrete passages to the specific day.

## Architecture in 60 seconds
- **Next.js 14 App Router + Tailwind + Framer Motion. Mobile-first. No DB — all state in `localStorage`.**
- **State** lives in `lib/store.ts` (pure helpers, safe on server + client) and is exposed via the React context in `lib/context.tsx` (`useApp()`).
- **AI** is provider-agnostic in `lib/ai.ts` (Groq / Gemini / Anthropic, auto-detected from env keys). Prompts are in `lib/prompts.ts`. If no key is set, `lib/planner.ts` provides a strong local fallback so the app always works.
- **API routes** (`app/api/plan`, `app/api/report`, `app/api/books`) are stateless. The client sends `state` + retrieved book `chunks`; routes call the AI and merge results over the local scaffold.
- **Books**: preloaded as pre-chunked JSON in `public/books-data/`; uploads parsed by `app/api/books` via `pdf-parse`. Retrieval (`retrieveChunks` in `store.ts`) happens client-side from `localStorage`, then relevant chunks are posted to the AI.

## ⭐ HOW TO ADD THE NEXT BOOKS (most important recurring task)
Ravi uploads books **2 at a time** (context limits) and will say which categories he wants covered. To preload a new book so it ships with the app:

1. Extract text: `uv run --with pypdf python3` (or `pdf-parse`) → raw text. Scanned/image PDFs need OCR; flag those to Ravi.
2. Chunk it (~220 words/chunk) with page refs + category tags. Mirror the logic in `lib/chunk.ts` (an offline Python version was used originally — recreate it; keep tags consistent with the `KEYWORDS` map there: gym, skincare, grooming, communication, psychology, habits, masculine, biography, nutrition).
3. Write `public/books-data/<slug>.json` as `{ "chunks": [ { id, book, page, text, tags } ] }`.
4. Add an entry to `public/books-data/index.json` (`slug, title, author, categories, pages, chunkCount, file, preloaded:true`).
5. Add a human-readable wisdom file to `books-md/<category>/<slug>.md` summarising the *applied* lessons (this is for future agents and for grounding).
6. If the book introduces a NEW legend voice (e.g. an Arnold autobiography, an Alexander biography, a Marcus Aurelius/Buddha text, a David Goggins book), wire that legend's voice/quotes into `lib/legends.ts` and make sure `lib/prompts.ts` tells the AI to use it for the right pillar.

Books loaded (9 — the full set): **Glow From Within** (skincare), **MANMADE** (grooming), **The Complete Aristotle** (philosophy/habits — curated ~320 passages; → Aristotle voice), **Can't Hurt Me** / Goggins (toughness; → Goggins voice), **Beyond Bigger Leaner Stronger** / Matthews (gym/nutrition; → Arnold voice), **No More Mr. Nice Guy** / Glover (social/boundaries; → Glover voice), **King, Warrior, Magician, Lover** / Moore & Gillette (masculine archetypes/identity; → new Robert Moore voice), **The M.A.X. Muscle Plan 2.0** / Schoenfeld (hypertrophy science; → Arnold voice), **The Muscle & Strength Training Pyramid** / Helms (evidence-based training priorities; → Arnold voice). Legends now total **9** (see `lib/legends.ts`); `legendForFocus` routes: gym/strength → arnold, study/virtue/wisdom → aristotle, toughness/pain → goggins, social/communication/boundaries/nice-guy/masculinity → glover, archetype/king/warrior/magician/lover/identity/purpose → moore, discipline → marcus|buddha, habit → clear, else → alexander.

**localStorage architecture (IMPORTANT):** preloaded book chunks are **never** persisted to localStorage — `saveState` strips them (only uploaded books + user progress are saved) and `AppProvider` re-fetches all `public/books-data` chunks into memory on every app start. This means you can ship unlimited preloaded books without ever hitting the ~5MB localStorage quota. Only the small uploaded-book chunks + history/stats live in localStorage.

**Scanned PDFs:** some books (e.g. Can't Hurt Me) are image-only with no text layer. Detect (pypdf/pymupdf returns ~0 chars) and OCR them: render pages at 150 dpi with PyMuPDF and read with `rapidocr-onnxruntime` (pure-python, no system binary, ~1.5s/page). Then chunk as normal.

**Huge books:** if a book yields thousands of chunks (e.g. complete works), curate to the ~300 most transformation-relevant passages by keyword-relevance scoring (see how Aristotle was done) so localStorage stays under quota. Total across all books should stay well under ~3MB.

## Legend → pillar mapping (keep consistent)
- Arnold Schwarzenegger → gym/body
- Alexander the Great → ambition/life
- Buddha & Marcus Aurelius → discipline/desire/mind
- James Clear → habits/systems
- David Goggins → pain/mental toughness (also the default "punishment" voice)

## Curriculum
`data/curriculum/{gym,maths,communication,skincare}.ts` use a **day-N → content** mapping with modulo cycling so content always exists across all 90 days. Extend these arrays to add depth; keep the `*ForDay(day)` signatures.

## Build & verify before pushing
```bash
npm install && npm run build   # must compile with no type errors
```
Node 20 + Next 14.2.35 (pinned to a security-patched 14.2.x — do not downgrade).

## Conventions
- Tailwind theme colors: `void`, `mana`, `arise`, plus `gold`, `ember`, `jade` (see `tailwind.config.ts`).
- Fonts: Orbitron (display/titles) + Rajdhani (body).
- Keep everything mobile-first; the layout is a single `max-w-md` column with a bottom tab bar.
- Never hardcode secrets. AI keys are env-only and server-only.

## Definition of done for a change
1. `npm run build` passes. 2. Mobile layout still clean. 3. The Solo Leveling tone is preserved. 4. New book wisdom is *applied*, not summarised. 5. Push to `homiegit1111/SoloDeveloping`.
