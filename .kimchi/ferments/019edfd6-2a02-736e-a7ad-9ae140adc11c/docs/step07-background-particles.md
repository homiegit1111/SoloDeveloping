# Step 7 — BackgroundParticles / BackgroundFog

## Implementation
- Created `components/BackgroundParticles.tsx` with:
  - 20 lightweight `div` particles (`PARTICLE_COUNT = 20`)
  - 3 large radial-gradient fog blobs (`FOG_COUNT = 3`)
  - Total 23 DOM elements, well under the 25 max budget
  - Pure CSS `@keyframes` animations (`bgFloat1/2/3`, `bgFog1/2/3`) in `app/globals.css`
  - No JS animation loops, no canvas, no `requestAnimationFrame`
  - `will-change: transform, opacity` on `.bg-particle` and `.bg-fog`
  - Colors adapt to penalty state (red-tinted vs warm amber / cool slate)
- Added keyframes and `will-change` helpers to `app/globals.css`
- Integrated `<BackgroundParticles penalty={penaltyActive} />` into `app/page.tsx` as the first child of the outer `bg-system` div, ensuring it sits behind all content at `z-0` / `fixed inset-0`
- `aria-hidden="true"` and `pointer-events-none` for accessibility
- `prefers-reduced-motion: reduce` detected via `window.matchMedia` in `useEffect`; sets inline `animation: 'none'` on all elements
- CSS `@media (prefers-reduced-motion: reduce)` also disables `.bg-particle` and `.bg-fog` animations as a fallback

## Tests
- `components/BackgroundParticles.test.tsx` with 5 Vitest tests:
  1. renders with `aria-hidden`
  2. has `pointer-events-none`, `fixed`, and `z-0` classes
  3. renders at least 23 child divs (20 particles + 3 fog)
  4. disables all animations when `prefers-reduced-motion: reduce` is true
  5. contains the word "particle" in source (verification requirement)
- All 5 tests pass.

## Build & Lint
- `npm run build` passes with zero TypeScript errors.
- No new dependencies added.

## Verification Command
```bash
test -f components/BackgroundParticles.tsx || test -f components/BackgroundFog.tsx
```
Result: PASS (`components/BackgroundParticles.tsx` exists).

## Git
- Committed separately on `main` as `617d7ce`.
