# SoloDeveloping — Senior Engineering Review

A full pass over the codebase: bugs fixed in this commit, remaining risks, performance
notes, code smells, and a prioritised feature/refactor roadmap. The build is clean
(`npm run build` ✓, Next 14.2.35, no type errors) — so everything below is runtime /
correctness / product, not compilation.

---

## ✅ Fixed in this pass

| # | Severity | Area | Fix |
|---|----------|------|-----|
| 1 | **High** | Date math | **Timezone off-by-one.** `todayStr`/`daysBetween`/`addDays` anchored on **UTC** midnight. For any user ahead of UTC (IST = +5:30) the day only rolled at 05:30 local, so early-morning quests logged to *yesterday*, "today's plan" could mismatch, streaks/penalty could be wrong. Rewrote all three to **local** calendar dates and routed the 4 stray inline `new Date().toISOString().slice(0,10)` keys (page, intelligence, planner, lesson) through them so the whole app shares one convention. |
| 2 | Med | Startup perf | **Book hydration was sequential** — 10 books fetched one-after-another on every cold start (10 serial round-trips). Now fetched in **parallel** with `Promise.all`. |
| 3 | Med | Cloud sync | **`pushState` uploaded the multi-MB preloaded chunks** to Supabase on every sync (the in-memory state re-hydrates them). Extracted `slimState()` and now strip preloaded chunks before syncing *and* saving. |
| 4 | Low | Determinism | `legendForFocus` used `Math.random()` for the discipline voice → the same day's plan could change between renders/regenerations. Now a deterministic hash of the focus string. |
| 5 | Low | AI | Gemini fallback list led with `gemini-3.5-flash` (not a real model — it always 404'd before self-healing). Replaced with the current valid chain. |
| 6 | Low | UX | After **Reset progress**, onboarding didn't reappear until a manual reload (`started` stayed true). Now resets too. |
| 7 | — | 3D / 2D | (prev commit) 3D pedestal-strip fit fix + 2D toon shadow-monarch redraw. |

---

## ⚠️ Remaining issues & risks (not yet changed — by priority)

### High value
- **Maths book is anemic.** `public/books-data/ssc-cgl-quant.json` has only **26 chunks** for the entire SSC CGL quant syllabus, while the other books have 100–476. The study/maths plan will always feel shallow until this is expanded (formulas + worked examples per topic, chunked like the rest). The in-app `MATHS_LADDER` (14 topics with 2 practice Qs each) is a decent floor but is hardcoded in `intelligence.ts` rather than book-derived.
- **No tests at all.** The state engine (`recomputeDerived`, streak bridging, `statCondition`, XP rollups) is pure and *highly* testable. A handful of Vitest unit tests here would prevent regressions in exactly the logic that's easy to break (and just got date-shifted). Highest ROI next step.
- **No error boundary.** A throw in any client component (e.g. the canvas/WebGL on an odd device) white-screens the whole app. Add a React error boundary around `<main>` and a WebGL-support check before mounting the 3D model.

### Medium
- **`diagnose(state)` runs on every render** of `DailyPlanView` (it walks history + plans each time). Wrap in `useMemo([state])`.
- **`saveState` fires on every state change** and re-serialises the whole save synchronously (JSON.stringify) on the main thread — including a deep `JSON.parse(JSON.stringify(state))` clone inside `toggleHabit`/`applyFreeze`. Fine at current data sizes; debounce the write (e.g. 300–500ms) and replace the deep clone with structured updates if history grows large.
- **`ReminderToggle` effect depends on `state.history`** → it tears down & rebuilds the 5-min interval on every quest toggle. Depend on a derived `doneToday` count instead.
- **Service worker / true PWA offline.** README calls it a PWA and there's a `manifest.json`, but there's no service worker, so it isn't installable-offline or push-capable. The "daily reminder" only fires while the tab is open (correctly disclaimed, but a real SW + notification would be the upgrade).
- **AI prompt trusts the model's JSON.** `extractJSON` is solid, but the merged `plan`/`report` aren't schema-validated — a malformed-but-parseable object could blank a section. Validate fields (zod) and fall back per-field, not per-plan.

### Low / cleanup
- **`HunterStage` toggle reads `(state.settings as any).use3dModel`** — `use3dModel` is already typed in `AppState.settings`; drop the `as any`.
- Duplicate `import … from "@/lib/store"` lines in `page.tsx` (harmless; merge them).
- `chunkText` page numbers are an approximation (`~350 words/page`); fine for citations but don't treat as exact.
- `completionRate`, `statCondition`, `missCounts`, `recentZeroDays` still build dates via `Date.now() - i*86400000` then format — correct in a no-DST zone (IST), but switching them to `addDays(todayStr(), -i)` would make them DST-proof and match the rest of the app.

---

## 🚀 Feature roadmap (suggested)

**Tier 1 — deepen the core loop**
1. **History / calendar heatmap** — a GitHub-style 90-day grid of completion. The data (`state.history`) already exists; it's the single most motivating view you don't have yet.
2. **Per-stat trend sparklines** — `statCondition` is computed but only shown as current bars; show the 30-day trajectory.
3. **Expand the SSC maths corpus** (see above) so "Study" pulls real worked problems from the book like every other pillar.

**Tier 2 — retention**
4. **Real PWA**: add a service worker (offline shell + cached `/books-data`) and local notifications so the daily reminder fires even when the tab is closed.
5. **Plan completion feedback loop** — let Ravi tick off plan sub-objectives; feed "did the boss task / did the plan" back into `diagnose()` so the next day adapts to plan adherence, not just habit ticks.
6. **Onboarding "import existing streak"** — let a returning user backfill a few past days so day 1 isn't always literally day 1.

**Tier 3 — polish**
7. **3D**: the GLB has no animation clips — add a subtle idle (procedural breathing is already there) or swap in a rigged model for real idle/summon anims; gate the 3D behind a WebGL capability check with graceful 2D fallback.
8. **Settings screen** consolidating sound / reminders / 2D-3D / cloud-sync / backup (they're scattered across panels today).
9. **Accessibility**: the canvas Hunter needs an `aria-label`/role; overlays should trap focus and close on `Esc`.

---

## Architecture notes (the good)
- Clean separation: pure `lib/store` + `lib/diagnosis` + `lib/intelligence` (deterministic engine) with the AI as an *optional prose layer* over a always-works local floor. This is the right call and makes the app robust offline.
- localStorage-first with preloaded chunks deliberately not persisted (re-hydrated each load) is a smart quota strategy.
- The "books are the only source of truth → diagnose → retrieve → build" pipeline is genuinely well-factored. Keep it.
