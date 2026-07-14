# MusterMill — Idle UI Philosophy & Gap Analysis

**Genre archetype:** **C. Base sim viewport** (Fallout Shelter × Dorodango living workshop)  
**Fleet parent doc:** `projects/shared/agent-corps/docs/IDLE_INCREMENTAL_UI_PHILOSOPHY.md`  
**Mechanics GDD:** `GDD.md` · **Implementation:** `src/game-view.ts`, `src/world-map.ts`, `src/pixel-art.ts`

---

## 1. Design intent

MusterMill is not a visual novel, not a Cookie Clicker clone, and not a Melvor depth sink. It is a **campy military base toy** where:

- **Eyes stay on chibi soldiers** walking, mustering, scrubbing pots, hitting liberty, patrolling.
- **The base map is the UI** — buildings are landmarks *and* affordances.
- **One full-screen viewport** — no scrolling to play (itch embed, phone, desktop).
- **Comedy over romance** in all zone labels and animations (Heritage Quarters, not dating).

Player fantasy: *"I run the most unhinged battalion on a tiny pixel base."*

---

## 2. Benchmark mapping

| Reference | What we take | MusterMill expression |
|-----------|--------------|------------------------|
| **Fallout Shelter** | Zoomed base, dwellers walk to rooms | Soldiers lerp to Boot / Barracks / Heritage / Mess / Liberty |
| **Cookie Clicker** | Top resource strip + affordability | STR / SLIPS / GEN / DEPLOY HUD; button glow states |
| **Dorodango workshop** | Watch parallel work | Multiple soldiers in different zones simultaneously |
| **Melvor** | Fixed HUD, one main stage | Single canvas stage; SKINS in modal only |
| **MindStudios idle** | Live surroundings | Patrol loop, steam from mess hall, liberty sign blink |

---

## 3. Screen layout (v0.4 canonical)

```
┌─────────────────────────────────────────────┐  ← Top HUD (canvas): title, stats, tip ticker
│  MusterMill · ACC          STR SLIPS GEN D  │
├─────────────────────────────────────────────┤
│ forest │  BOOT ─ BARRACKS ─ HERITAGE ─ MESS │  ← World layer (70% height)
│ edge   │       roads · grass · soldiers     │     Soldiers are focal layer
│        │              LIBERTY GATE    DEPLOY │
│        │  ═══════ patrol path ═════════════ │
├─────────────────────────────────────────────┤
│ [SKINS][MUSTER][KP][+REC][DEPLOY][RST]      │  ← Command ribbon (canvas, diegetic)
│                          2/2 selected       │
└─────────────────────────────────────────────┘
```

**Resolution:** 480×320 internal · scales to `100vh` · `image-rendering: pixelated`

---

## 4. Interaction model

| Input | Action |
|-------|--------|
| Tap soldier (specialist, idle) | Select/deselect for Legacy Muster (gold ring) |
| Tap **MUSTER** (2 selected) | Pair → walk to Heritage Quarters |
| Tap **KP DUTY** | Available adults → Mess Hall |
| Tap **+REC** | Spend 40 slips → new specialist spawns at Barracks |
| Tap **DEPLOY** | Prestige confirm → reset → Deploy Pad ceremony (v0.5 polish) |
| Tap **SKINS** | HTML modal (faction picker — exception to diegetic rule) |
| Tap zone building (v0.5) | Same as corresponding button |

**Why HTML modal for skins:** 8 faction chips + demo toggle = too much for canvas v0.4; modal is fleet-acceptable per parent doc §5.

---

## 5. v0.4 compliance audit (vs fleet kernel)

| Kernel principle | v0.4 status | Notes |
|------------------|-------------|-------|
| Watch layer first | ✅ Strong | Soldiers walk, patrol loops, zone decor |
| Loop legible in 5s | ⚠️ Partial | Needs first-run pointer or pulse on MUSTER |
| Primary currency visible | ✅ | SLIPS in top HUD |
| Production rate visible | ❌ Gap | No `+X slips/run` or KP ETA in HUD |
| Instant feedback | ✅ | Toasts, selection ring, button highlight |
| Affordability obvious | ⚠️ Partial | +REC disables; no green glow or progress-to-40 bar |
| Progressive disclosure | ❌ Gap | All buttons visible session 1 |
| No core-loop scroll | ✅ | `overflow: hidden`, full viewport |
| Prestige ceremony | ⚠️ Partial | Confirm dialog only; no pad animation |
| Return hook | ❌ Gap | No offline recap (browser idle OK for v0.1) |
| Touch targets | ✅ | Command ribbon buttons ≥44px tall |
| Identity monetization | ✅ | Branch skins; demo unlock on itch |

**Score:** 6/12 strong · 3 partial · 3 gaps → **v0.5 UI sprint targets gaps**

---

## 6. v0.5–v0.6 UI roadmap (research-backed)

Priority order from idle genre conventions:

### P0 — Watch layer upgrades
1. **Tap buildings** — Mess Hall = KP, Heritage = muster hint, Deploy Pad = prestige
2. **Bigger soldiers** — scale 2→3 in world; readability on phone
3. **Muster vignette** — two soldiers + tiny duffel spawn pixel anim at Heritage
4. **KP potato steam + scrub sprite** — mess hall activity more readable

### P1 — Cookie Clicker economics UX
5. **Production strip** — `+12 slips/KP run` · `KP 42s` under stats
6. **+REC afford bar** — fill toward 40 slips (Phaser idle tutorial pattern)
7. **Number abbrev** — 1.2K slips at scale

### P2 — Progressive disclosure
8. **Session unlock order:**
   - Start: tap-two-soldiers tutorial toast only
   - After first muster: show KP DUTY
   - After first KP complete: show +REC
   - Lineage ≥3: DEPLOY button appears (hidden before)

### P3 — Return & prestige juice
9. **Offline recap** — "While away: +0 slips (session clock)" — honest for web
10. **Deploy ceremony** — plane silhouette + bloodline trait banner on pad
11. **Milestone popups** — Gen 3, first prestige, 10 soldiers (pixel confetti)

### P4 — Depth (Melvor lane, only if content warrants)
12. **Building tree panel** — slide-over, not main view (GDD v0.3 buildings)
13. **Field Manual** — diegetic bulletin board on barracks wall

---

## 7. Copy & zone lexicon (UI surfaces)

| Zone | Player sees | Never say |
|------|-------------|-----------|
| Boot camp field | Recruits training | "Breed pen" |
| Barracks | On-base idle | "Dorm hookup" |
| Heritage Quarters | Legacy Muster | "Dating room" |
| Mess Hall | KP duty | — |
| Liberty Gate | Off-base | "Club" |
| Deploy Pad | Prestige | "Reset button" |

Rotating tip ticker = Field Manual voice (from `flavor.json` + `field-manual.json`).

---

## 8. Technical constraints

- **Canvas-first** — `game-view.ts` owns HUD + world; HTML only for modals/toasts
- **No roster cards** — deprecated v0.3; soldiers selectable on map only
- **60fps target** — `requestAnimationFrame` loop; lerp positions per soldier
- **Save** — `localStorage` v2; world entities ephemeral (re-lerp on load)

---

## 9. Acceptance tests (human-ready bar)

Manual QA before itch push:

1. iPhone Safari / Chrome Android: no vertical scroll; all buttons tappable
2. Fresh save: within 60s player completes one Legacy Muster without reading README
3. KP send: soldiers visually walk to Mess Hall within 2s
4. 10 soldiers on map: no overlap unreadable (slot offset + rows)
5. Prestige: DEPLOY only enabled when GDD rules met; confirm → world resets

---

## 10. Doc maintenance

| Trigger | Update |
|---------|--------|
| Layout archetype change | §3 diagram + fleet parent doc |
| New benchmark shipped (e.g. copied Melvor panel) | §2 table |
| v0.5 milestone | §5 audit scores |
| GDD mechanic adds UI surface | §6 roadmap + GDD cross-link |

**Canonical links in README:** `docs/IDLE_UI_PHILOSOPHY.md` · `docs/GDD.md`
