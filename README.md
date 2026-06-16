# ⚡ SoloDeveloping

> *"Arise."* — A Solo Leveling–inspired personal transformation system for a real 90-day comeback.

SoloDeveloping turns Ravi's daily grind — gym, study, discipline, skincare, clean food, building, maths — into an RPG of ascension. The System (an AI engine fed with the actual wisdom of real books and legends) reads yesterday's performance, your rank, your streaks, and your weak areas, then forges a personalised daily plan in the voices of Arnold, Alexander the Great, Buddha, Marcus Aurelius, James Clear and David Goggins.

Built with **Next.js 14 (App Router)**, **TailwindCSS**, **Framer Motion**. **Mobile-first.** **No database** — everything lives in `localStorage`. **One-click deploy to Vercel.**

---

## ✨ Features

1. **Habit Tracking** — 7 daily quests (Gym, Study, Discipline/no-fap, Skincare, Clean Food, Build/coding, Maths prep) with streaks, XP, history, and a perfect-day bonus.
2. **Rank & Progression** — UNRANKED → E → D → C → B → A → **S-Rank Monarch**. Your Hunter character (SVG) visually evolves — aura, armor, weapon, crown, shadow soldiers — as you climb.
3. **Reward & Punishment** — Cinematic LEVEL-UP overlays for milestones; a PENALTY-ZONE overlay with a brutal legend quote when you fall behind.
4. **AI Daily Planner** — Reads your state + book excerpts and returns a full plan: gym, maths, skincare, communication, mindset, a legend's story, and a brutal-or-motivating message.
5. **Book Intelligence Engine** — PDFs are parsed server-side, chunked + tagged by category, indexed, and relevant passages are injected into the AI prompt. Upload more books anytime; loaded books are listed and toggleable.
6. **Weekly Transformation Report** — Every 7 days, the System judges your physical/mental/skill evolution and the "legend chapter" you're living.
7. **Maths Curriculum** — Number system → reasoning, progressively (govt-exam oriented), with worked examples + practice.
8. **Communication Curriculum** — 22 progressive lessons with daily drills.
9. **Skincare Protocol** — AM/PM routines with the science + a rotating glow tip.
10. **Gym Curriculum** — A 6-day PPL split, beginner→intermediate, with sets/reps/rest/form cues.

---

## 🚀 Deploy to Vercel (one-click)

1. Push this repo to your GitHub (already at `homiegit1111/SoloDeveloping`).
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** this repo.
3. Framework preset auto-detects **Next.js**. No build settings to change.
4. **Add ONE environment variable** so the AI planner works (optional — without it, a strong local rule-based planner runs):
   - `AI_PROVIDER` = `groq` (or `gemini`, or `anthropic`)
   - …and the matching key: `GROQ_API_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`
   - Groq has a generous free tier and is fastest to start: [console.groq.com/keys](https://console.groq.com/keys)
5. **Deploy.** Done. Open it on your phone and "Add to Home Screen" (it's a PWA).

### Run locally
```bash
npm install
cp .env.example .env   # add your AI key (optional)
npm run dev            # http://localhost:3000
```

---

## 🔑 AI Provider

The AI is provider-agnostic (`lib/ai.ts`). It auto-detects whichever key is present, or you can force one with `AI_PROVIDER`. Supported: **Groq** (Llama 3.3 70B), **Google Gemini**, **Anthropic Claude**. Keys are server-only (used inside `/api/*` routes) and never shipped to the browser. If no key is set, the app falls back to a solid local rule-based planner so it always works.

See `.env.example` for all variables.

---

## 🧠 How the Book Intelligence works

- **Preloaded books** live as pre-chunked JSON in `public/books-data/` (generated offline). On first load the client fetches them into `localStorage`.
- **Uploaded books** are sent to `POST /api/books`, parsed with `pdf-parse`, chunked (~220 words) and tagged by category, then stored in `localStorage` exactly like preloaded ones. (Vercel's filesystem is ephemeral, so nothing is written to disk server-side.)
- At plan time, the client retrieves the most relevant chunks for today's focus and posts them to `/api/plan`, which injects them into the prompt so the AI quotes and applies the *actual* text.
- Human-readable extracted wisdom also lives in `books-md/` for future maintainers and agents.

---

## 📂 Project structure
```
app/            Next.js App Router (page.tsx, layout, api routes)
  api/plan      AI daily planner endpoint
  api/report    AI weekly report endpoint
  api/books     PDF → chunks upload endpoint
components/     React UI (HunterCharacter, RankPanel, HabitTracker, overlays, views)
lib/            Core logic (ranks, habits, legends, store, prompts, ai, chunk, types)
data/curriculum Gym / Maths / Communication / Skincare programs
public/books-data  Pre-chunked book JSON + index
books-md/       Extracted book wisdom as markdown (for humans & agents)
```

**See [`AGENTS.md`](./AGENTS.md) if you are an AI agent continuing this project — especially how to add the next books.**
