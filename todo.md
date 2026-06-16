# Mobile UI polish — HQ + header (keep Solo Leveling theme)

## Issues from screenshot
- [ ] Header crowded: 4 new tool icons + RAVI/UNRANKED name+rank jammed right; rank is redundant (card shows it huge)
- [ ] "POWER · XP" clipped top-right of Hunter card (UNRANKED title too wide on mobile)
- [ ] Hunter card very tall, figure floats in empty space
- [ ] Description text cut awkwardly with "..."

## Plan
- [ ] page.tsx: clean mobile header — brand+day left, tool icons right; drop redundant name/rank; pass hunter name to HunterStage
- [ ] HunterStage: responsive rank title (no clipping), show HUNTER name in HUD, tighten mobile height/HUD spacing
- [ ] Description: style as intentional system readout, no ugly clamp cut
- [ ] Verify finish header-tools work (already uncommitted) integrates cleanly
- [ ] Build clean, commit, push to main (Vercel auto-deploy), report
