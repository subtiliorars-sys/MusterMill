# MusterMill — GDD v0.1

**Genre:** incremental idle · **Franchise:** Mustermate Network spin-off (fiction only)  
**Platform:** web / itch first · **Tone:** PG-13 campy chibi, not romance VN

## One-liner

Pair chibi soldiers in Heritage Quarters, hatch recruits, idle them through boot camp, assign adults to KP for muster slips, prestige deployments to stack bloodline traits.

## Core loops

| Loop | Player action | Reward |
|------|---------------|--------|
| Micro | Tap collect, assign pair | Baby timer starts |
| Session | Wait growth bars, run KP mission | Muster slips (soft currency) |
| Meta | Prestige deployment | Keep best bloodline trait % |

## Growth stages

1. **Recruit** — newborn, cannot pair  
2. **Private** — can mission, cannot pair  
3. **Specialist** — can pair + mission

## Ten launch traits (MOS-flavored)

| Trait | Effect |
|-------|--------|
| 11B Bloodline | +5% KP payout |
| 68W Heritage | −10% growth time |
| 25U Signal | +1 trait roll on hatch |
| Joint Task Force | bonus if parents differ branch |
| High & Tight Gene | +3% prestige trait carry |
| DFAC Diplomat | +2% pair success |
| Range Day Reflex | faster first growth tick |
| Motor Pool Grease | building discount (v0.2) |
| Chapel Morale | idle mission cap +1 (v0.2) |
| NCO Academy | Specialist stage −15% time (v0.2) |

## Prestige rule (v0.2)

**Deployment:** reset all soldiers and buildings; keep one rolled bloodline trait at 50% strength; +10% global muster slip gain per deployment (stacking soft cap 5×).

## Monetization

- **Free:** OCP Camo Battalion (generic olive palette)  
- **Premium:** one branch skin pack ($3–5) — colors + mascot + 2 exclusive unit quips from `branch-brands.json`

## Guardrails

- Fictional chibi only; no DoD endorsement (same disclaimer as Mustermate)  
- UI copy: "Heritage Quarters" / "Legacy Muster" — not explicit dating language  
- Age gate 17+ if suggestive humor added later

## MVP checklist (v0.1)

- [x] 10 slots, 3 stages, 1 currency  
- [x] Pair → timer → baby with 2 inherited traits  
- [x] KP mission prints currency offline  
- [x] Branch skin toggle (demo gate)  
- [x] Save to localStorage  
- [x] itch page + cover SVG + zip script
