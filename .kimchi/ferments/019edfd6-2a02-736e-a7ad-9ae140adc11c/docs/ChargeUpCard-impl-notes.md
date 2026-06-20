# ChargeUpCard Implementation Notes

## Component Design
- Replaces flat checkmarks in daily quest list with cinematic charge-up interaction
- Radial fill on hold/tap via SVG stroke-dasharray/CSS transition (no setState in rAF)
- Shockwave ripple on completion via Framer Motion AnimatePresence rings
- Number-roll streak counter via per-digit CSS translate
- Dark angular card matching existing quest-card aesthetic

## Key Decisions
- Outer `motion.button` for whileTap scale + entrance animation
- Inner `div.quest-card` for clip-path visual styling
- Shockwave/floating XP positioned as absolute siblings outside clip-path
- Pointer events on card; keyboard (Enter/Space) toggles instantly
- prefers-reduced-motion: instant toggle, no radial fill, no shockwave
- `addDays(todayStr(), -i)` used instead of `Date.now()-i*86400000`

## Integration Points
- HabitTracker.tsx: inline card replaced by ChargeUpCard component
- Props mirror existing data shape (HabitId, label, done, streak, xp, blurb, cracked, icon)
- Editing flow preserved via isEditing/editText/onSaveRename/onCancelRename/onEditChange
- onToggle wired to existing handle() function in HabitTracker

## CSS Additions (globals.css)
- .charge-ring / .charge-ring[data-charging] for SVG radial fill
- .digit-slot / .digit-track / .digit for number-roll animation
- prefers-reduced-motion overrides

## Testing Strategy
- Render and verify radial fill elements exist
- Verify shockwave class appears during animation
- Test keyboard accessibility (Enter/Space)
- Verify aria-pressed and aria-label on button
