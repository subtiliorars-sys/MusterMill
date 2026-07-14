# MusterMill — GDD v0.4 (canonical)

**Genre:** incremental idle · **Franchise:** Mustermate Network spin-off (fiction only)  
**Platform:** web / itch / GitHub Pages · **Tone:** PG-13 campy chibi — comedy over romance  
**Repo:** https://github.com/subtiliorars-sys/MusterMill  
**Flavor bible:** `../Mustermate/packages/shared/data/branch-brands.json` + `data/flavor.json`  
**UI philosophy:** `IDLE_UI_PHILOSOPHY.md` · Fleet: `projects/shared/agent-corps/docs/IDLE_INCREMENTAL_UI_PHILOSOPHY.md`

## One-liner

Pair chibi soldiers in Heritage Quarters, hatch recruits, idle boot camp, run KP for muster slips, prestige deployments to stack bloodline traits. Free as generic camo; pay for the faction that roasts **your** branch.

## Guardrails (locked)

| Rule | Implementation |
|------|----------------|
| Fictional chibi only | No photoreal ranks or likenesses |
| Comedy over romance | Heritage Muster / Unit Compatibility — never mate/breed/love in UI |
| PG-13 broad appeal | Campy forum humor; no 17+ gate needed at launch |
| No DoD trademarks | Parody faction names only; splash disclaimer every session |
| Sell identity not progress | Branch packs = skins + quips; never paywall core loop |

**Splash (always):** *Satire. Not affiliated with the U.S. Department of Defense or any branch. All characters fictional. Do not eat crayons IRL.*

## Copy lexicon

| Don't say | Do say |
|-----------|--------|
| Mate / breed | **Heritage Muster** / **Lineage Assignment** |
| Love | **Unit Compatibility** |
| Baby | **Recruit Chibi** / **Fresh Muster** |
| Grow up | **Clear Boot Camp** / **Pin Rank** |
| Pair | **Assign to Heritage Quarters** (*for unit continuity purposes*) |

Pairing header: **"S-1 has questions about your manpower forecast."**

## UI philosophy (archetype C — base sim viewport)

MusterMill follows the **Fallout Shelter / living workshop** idle pattern: one full-screen map, soldiers walking between zones, diegetic canvas HUD. Not a scrollable web form.

| Doc | Purpose |
|-----|---------|
| `IDLE_UI_PHILOSOPHY.md` | Game-specific layout, audit, v0.5 roadmap |
| Fleet `agent-corps/docs/IDLE_INCREMENTAL_UI_PHILOSOPHY.md` | Cross-game idle UI kernel |

**v0.4 shipped:** fullscreen canvas, tap soldiers, integrated command ribbon.  
**v0.5 targets:** tap buildings, production rate HUD, progressive button unlock, deploy ceremony.

## Core loops

| Loop | Player action | Reward |
|------|---------------|--------|
| Micro | Select two Specialists → Legacy Muster | Pair timer → hatch |
| Session | Growth bars, KP mission | Muster slips |
| Meta | Prestige deployment (v0.2) | Bloodline trait carry + global slip multiplier |

## Growth stages

1. **Recruit** — cannot pair  
2. **Private** — KP only  
3. **Specialist** — pair + KP

## Parody factions (branch skins)

| Branch | Parody name | Premium | Tagline |
|--------|-------------|---------|---------|
| Generic | **Allied Camo Coalition** (ACC) | Free | Generic olive · free forever |
| Army | **Big Green Machine** | Free | *AR 670-1 wrote this battalion. Still in appeals.* |
| Navy | **Boat Catfish** | $2.99 Pack | *Not ghosting — comms blackout.* |
| Marines | **Crayon Legion** | Pack | *Semper Maybe.* (not Semper Fi) |
| Air Force | **Chair Patrol** | Pack | *Aim Somewhere. Land at the BX.* |
| Space Force | **Orbital Confusion Corps** | Pack | *Still explaining job at Thanksgiving.* |
| Coast Guard | **Puddle Pirates** | Pack | *Real branch joke. Real muster though.* |
| Guard | **Weekend Warriors** | Pack | *Sorry I missed your text — drill.* |

Data: `data/branch-skins.json` · Itch demo: **Preview all branches** checkbox (or `?demo=1`).

## Ten core traits

| Trait | Effect |
|-------|--------|
| 11B Bloodline | +5% KP payout |
| 68W Heritage | −10% growth time |
| 25U Signal | +1 trait roll on hatch |
| Joint Task Force | Cross-branch pair bonus |
| High & Tight Gene | +3% prestige carry (v0.2) |
| DFAC Diplomat | Pair flavor / future morale |
| Range Day Reflex | Faster first growth tick |
| Crayon Constitution | Marines pack — chaos trait (v0.2) |
| Strategic Nap Doctrine | Air Force pack — idle buff 1300–1500 (v0.2) |
| NCO Academy | Specialist stage −15% (v0.2) |

## Monetization (test pricing)

| Tier | Price | Contents |
|------|-------|----------|
| Free ACC + Big Green | $0 | Full prestige path, branch-neutral humor |
| Branch Pack | **$2.99** | One faction: reskin + ~50 quips + 5 traits |
| All Branches Bundle | **$7.99** | Seven packs + cross-branch synergies |
| MOS mini-pack | $1.99 | Future: 11B / 0311 / IT rate lines |
| Shammer's DLC | $4.99 | Future: cosmetic idle (CONEX nap, "at dental") |

**Never sell:** breeding speed as only paid path.

## Prestige rule (v0.2 — shipped)

**Deployment:** reset soldiers; keep one bloodline trait at 50% (+3% with High & Tight Gene); +10% slip gain per deployment (max 5 deploys = +50%). Requires lineage ≥3, strength ≥4, no active KP/muster.

## MVP checklist

- [x] v0.1 playable loop (pair, growth, KP, reinforcements)  
- [x] Branch skin toggle + localStorage  
- [x] Parody faction names + flavor toasts  
- [x] itch zip + page copy + cover SVG  
- [x] GitHub repo + Pages deploy script  
- [x] v0.2 prestige deployment  
- [x] v0.3 pixel soldiers + zone scene  
- [x] v0.4 fullscreen base map + canvas HUD (no scroll)  
- [x] UI philosophy docs (game + fleet)  
- [ ] itch upload (owner / butler key)  
- [ ] v0.5 UI polish (see `IDLE_UI_PHILOSOPHY.md` §6)  
- [ ] Building tree (v0.6)  
- [ ] Real IAP gate (itch / Stripe) — demo unlock OK for now

## Franchise map

```
Mustermate Network (dating, ID.me)
├── Branch apps (HooahHook, FleetMate, …)
└── MusterMill (this repo) — idle SKU, shared brand DNA
```
