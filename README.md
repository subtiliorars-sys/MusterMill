# MusterMill

Idle incremental spin-off of the **Mustermate Network** — pair chibi soldiers, hatch recruits, grow battalion strength. Satire only; not affiliated with DoD.

## Play locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Branch skin toggle

Swaps **colors + mascot emoji + battalion label** for parody factions (Allied Camo Coalition free, Big Green free, Branch Packs premium). Enable **Preview all branches** on itch to demo locked skins.

URL: `?demo=0` disables preview (production premium gate test).

## itch.io publish

```bash
npm run build:itch
# uploads dist/mustermill-itch.zip — index.html at zip root
```

Page copy: [`docs/ITCH_PAGE_COPY.md`](docs/ITCH_PAGE_COPY.md)  
Cover: `public/itch-cover.svg` → export 630×500 PNG for itch upload.

## Verify

```bash
npm test
npm run build
```

## Design

- GDD: [`docs/GDD.md`](docs/GDD.md)
- **UI philosophy:** [`docs/IDLE_UI_PHILOSOPHY.md`](docs/IDLE_UI_PHILOSOPHY.md) · fleet [`IDLE_INCREMENTAL_UI_PHILOSOPHY.md`](../../shared/agent-corps/docs/IDLE_INCREMENTAL_UI_PHILOSOPHY.md)
- **Agent handoff:** [`docs/AGENT_HANDOFF.md`](docs/AGENT_HANDOFF.md) — canonical owner doc for continuing work
- Branch data: [`data/branch-skins.json`](data/branch-skins.json) (from Mustermate `branch-brands.json`)

## v0.4

- **Full-screen game view** — no scrolling; one canvas fills the viewport
- **Zoomed-out base map** — forest, grass, roads, barracks, heritage quarters, mess hall, liberty gate, deploy pad
- **Walking soldiers** — chibis lerp to zones; patrol loop around perimeter
- **In-game HUD** — stats + action buttons drawn on canvas; tap soldiers to select

## v0.3

- **Pixel art chibi soldiers** — branch-tinted sprites on roster cards
- **Base operations scene** — live diorama: boot camp, barracks, heritage, mess hall, liberty, patrol strip

## v0.2

- **Deployment prestige** — reset roster, carry bloodline trait at 50%, +10% slip bonus per deploy (max 5)
- **Field Manual** — 188 branch quips imported from Mustermate `branch-brands.json`
- itch release script: `npm run release:itch`

## v0.1

- Pairing, growth bars, KP idle, reinforcements (40 slips)
- 8 branch skins + localStorage save
- Joint Task Force trait on cross-branch pairs

## Franchise map

```
Mustermate Network (dating, ID.me)
├── Branch apps (HooahHook, FleetMate, …)
└── MusterMill (this repo) — single-player idle
```
