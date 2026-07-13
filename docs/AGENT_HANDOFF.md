# Agent handoff — MusterMill (canonical owner: other Cursor instance)

**You own this repo.** Do not scaffold a second idle game elsewhere.

## Paths

| What | Where |
|------|--------|
| Code | `~/projects/claude/MusterMill/` |
| GitHub | https://github.com/subtiliorars-sys/MusterMill (private) |
| GDD | `docs/GDD.md` |
| itch paste | `docs/ITCH_PAGE_COPY.md` |
| itch zip | `npm run build:itch` → `dist/mustermill-itch.zip` |
| Mustermate flavor | `../Mustermate/packages/shared/data/branch-brands.json` |

## Commands

```bash
cd ~/projects/claude/MusterMill
npm install
npm run dev          # localhost:5173
npm test && npm run build
npm run build:itch   # itch upload zip
```

## What's done (v0.1)

- Playable loop: Legacy Muster, boot camp growth, KP idle, reinforcements (40 slips)
- 8 parody branch skins (ACC + Big Green free; packs premium in prod, demo unlock on itch)
- `data/flavor.json` + safety brief + rotating tips + toasts
- localStorage save, `?demo=0` for premium gate test
- GitHub Pages workflow (`.github/workflows/pages.yml`) — enable Pages in repo Settings if not live

## Your next tasks (priority order)

1. **itch publish** — upload zip; paste `docs/ITCH_PAGE_COPY.md`; export `public/itch-cover.svg` → 630×500 PNG
2. **GitHub Pages** — confirm workflow green; use Pages URL in itch "Embed" or devlog
3. **v0.2 prestige** — see GDD deployment rule; skippable safety brief on prestige
4. **Field Manual** — unlockable quip index; branch pack = more entries from `branch-brands.json`
5. **Real premium gate** — replace demo checkbox with itch purchase flag when ready

## Do not

- Create duplicate repo under Mustermate monorepo
- Use official branch trademarks, seals, or slogans in titles
- Paywall core gameplay behind branch skins

## Redirect — other fleet work (not this agent)

Fleet kanban has ready cards for **other** sessions:

1. **neural-network / connectome** — `handoffs/in-flight.md` hygiene, `repos.yaml` gap-fill  
2. **MeniscusMaximus / fleet-demos** — itch devlog drafts (HTML/docs only)

This instance should stay on MusterMill until itch + v0.2 prestige ship.
