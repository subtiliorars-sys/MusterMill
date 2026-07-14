# Agent handoff — MusterMill

**Canonical repo:** `~/projects/claude/MusterMill/` · https://github.com/subtiliorars-sys/MusterMill

## Design docs (read before UI work)

| Doc | Purpose |
|-----|---------|
| `docs/GDD.md` | Mechanics, monetization, guardrails |
| `docs/IDLE_UI_PHILOSOPHY.md` | **UI canon** — base-sim viewport, v0.4 audit, v0.5 roadmap |
| `docs/ITCH_PAGE_COPY.md` | itch paste |
| `docs/ITCH_UPLOAD.md` | butler / manual upload |
| Fleet `agent-corps/docs/IDLE_INCREMENTAL_UI_PHILOSOPHY.md` | Cross-game idle UI kernel |

**Do not** rebuild as scrollable HTML panels — genre research + fleet doc forbid it for core loop.

## Commands

```bash
cd ~/projects/claude/MusterMill
npm install && npm run dev    # localhost:5173
npm test && npm run build
bash scripts/deploy-pages.sh  # GitHub Pages
npm run build:itch            # dist/mustermill-itch.zip
```

## Shipped through v0.4

- Playable loop: Legacy Muster, boot camp, KP, reinforcements, prestige deploy
- Fullscreen canvas base map (480×320), walking pixel soldiers, patrol loop
- Canvas command ribbon: SKINS / MUSTER / KP / +REC / DEPLOY / RST
- Tap soldiers on map to select; no roster scroll
- Branch skins + Field Manual quips (`npm run import:quips`)
- Live: https://subtiliorars-sys.github.io/MusterMill/

## Next UI tasks (from `IDLE_UI_PHILOSOPHY.md` §6)

1. **P0** — Tap buildings as actions; bigger soldiers; muster/KP vignettes
2. **P1** — Production rate in HUD; +REC affordance bar; number abbrev
3. **P2** — Progressive disclosure (unlock KP → +REC → DEPLOY)
4. **P3** — Deploy pad ceremony; milestone popups

## Next non-UI tasks

- itch upload (`docs/ITCH_UPLOAD.md`) — needs `butler login`
- Real premium gate (replace demo checkbox)

## Do not

- Duplicate idle game elsewhere
- Use DoD trademarks / official slogans
- Paywall core loop behind branch skins
- Reintroduce scrollable roster as primary UI
