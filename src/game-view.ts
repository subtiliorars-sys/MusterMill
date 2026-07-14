import type { BranchSlug } from './sim';
import {
  drawSprite,
  paletteFor,
  spriteForActivity,
  type SoldierActivity,
} from './pixel-art';
import {
  BAR_TOP,
  BUILDINGS,
  HUD_H,
  lerpEntity,
  patrolPosition,
  slotOffset,
  WORLD_BOTTOM,
  WORLD_TOP,
  ZONES,
  type BuildingHit,
  type WorldEntity,
  zoneFor,
} from './world-map';

export type HudAction = 'skins' | 'muster' | 'kp' | 'reinforce' | 'deploy' | 'reset';

export interface HudButton {
  id: HudAction;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
}

export interface GameViewSoldier {
  id: number;
  branch: BranchSlug;
  stage: string;
  activity: SoldierActivity;
  name: string;
  selectable: boolean;
}

export interface WorldVignette {
  kind: 'muster_duffel';
  x: number;
  y: number;
  age: number;
}

export interface GameViewState {
  soldiers: GameViewSoldier[];
  selected: Set<number>;
  frame: number;
  stats: { strength: number; slips: number; lineage: number; deploys: number; slipPct: number };
  tip: string;
  title: string;
  subtitle: string;
  buttons: HudButton[];
  missionLeft: number | null;
  deployReady: boolean;
  kpActive: boolean;
  vignettes: WorldVignette[];
}

const SPRITE_SCALE = 3;
const HIT_R = 20;

export function defaultButtons(enabled: Record<HudAction, boolean>): HudButton[] {
  const y = BAR_TOP + 4;
  const h = 46;
  return [
    { id: 'skins', label: 'SKINS', x: 6, y, w: 52, h, enabled: true },
    { id: 'muster', label: 'MUSTER', x: 62, y, w: 72, h, enabled: enabled.muster },
    { id: 'kp', label: 'KP DUTY', x: 138, y, w: 72, h, enabled: enabled.kp },
    { id: 'reinforce', label: '+REC', x: 214, y, w: 58, h, enabled: enabled.reinforce },
    { id: 'deploy', label: 'DEPLOY', x: 276, y, w: 72, h, enabled: enabled.deploy },
    { id: 'reset', label: 'RST', x: 352, y, w: 44, h, enabled: true },
  ];
}

function drawTerrain(ctx: CanvasRenderingContext2D, w: number, frame: number): void {
  ctx.fillStyle = '#3d5a4a';
  ctx.fillRect(0, HUD_H, w, 28);
  ctx.fillStyle = '#5a7a5a';
  for (let i = 0; i < 12; i++) {
    const tx = (i * 47 + frame * 0.2) % (w + 40) - 20;
    ctx.fillRect(tx, HUD_H + 8, 28, 18);
  }

  ctx.fillStyle = '#3a5c32';
  ctx.fillRect(0, HUD_H + 28, w, WORLD_BOTTOM - HUD_H - 28);

  ctx.fillStyle = '#2a4028';
  ctx.fillRect(0, HUD_H + 28, 48, WORLD_BOTTOM - HUD_H - 28);
  ctx.fillStyle = '#1e301c';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 3; col++) {
      if ((row + col) % 2 === 0) {
        ctx.fillRect(4 + col * 14, HUD_H + 36 + row * 22, 10, 16);
      }
    }
  }

  ctx.fillStyle = '#6a5840';
  ctx.fillRect(48, 195, w - 48, 14);
  ctx.fillRect(155, 120, 14, 130);
  ctx.fillRect(255, 115, 14, 125);
  ctx.fillRect(355, 118, 14, 120);

  ctx.fillStyle = '#4a7038';
  for (let i = 0; i < 40; i++) {
    const gx = (i * 37 + 11) % w;
    const gy = HUD_H + 50 + ((i * 19) % (WORLD_BOTTOM - HUD_H - 60));
    ctx.fillRect(gx, gy, 2, 2);
  }
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bw: number,
  bh: number,
  roof: string,
  wall: string,
  label: string,
): void {
  ctx.fillStyle = wall;
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = roof;
  ctx.fillRect(x - 4, y - 8, bw + 8, 10);
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(x + bw / 2 - 6, y + bh - 14, 12, 14);
  ctx.font = '7px monospace';
  ctx.fillStyle = '#d4a017';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + bw / 2, y - 12);
}

function drawWorldBuildings(ctx: CanvasRenderingContext2D, frame: number, vs: GameViewState): void {
  drawBuilding(ctx, 48, 155, 52, 38, '#4a4030', '#5c5040', 'BOOT');
  drawBuilding(ctx, 140, 108, 58, 48, '#3d4a30', '#4a5840', 'BARRACKS');
  drawBuilding(ctx, 238, 100, 62, 52, '#4a4038', '#5a5048', 'HERITAGE');
  drawBuilding(ctx, 338, 104, 64, 50, '#5a4838', '#6a5848', 'MESS');
  drawKpMessDecor(ctx, frame, vs.kpActive);
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(378, 188, 54, 8);
  ctx.fillRect(382, 168, 8, 28);
  ctx.fillRect(420, 168, 8, 28);
  ctx.fillStyle = '#e94560';
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  const libertyBlink = Math.sin(frame * 0.12) > 0 ? 1 : 0.45;
  ctx.globalAlpha = libertyBlink;
  ctx.fillText('LIBERTY', 405, 182);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#4a4a50';
  ctx.fillRect(400, 218, 70, 36);
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 2;
  ctx.strokeRect(404, 222, 62, 28);
  ctx.fillStyle = '#d4a017';
  ctx.fillText('DEPLOY', 435, 240);

  drawBuildingHighlights(ctx, vs);
}

function buildingHighlight(b: BuildingHit, vs: GameViewState): boolean {
  switch (b.action) {
    case 'muster':
      return vs.selected.size === 2;
    case 'kp':
      return vs.buttons.find((x) => x.id === 'kp')?.enabled ?? false;
    case 'deploy':
      return vs.deployReady;
    default:
      return false;
  }
}

function drawBuildingHighlights(ctx: CanvasRenderingContext2D, vs: GameViewState): void {
  const pulse = 0.55 + Math.sin(vs.frame * 0.1) * 0.25;
  for (const b of BUILDINGS) {
    if (!buildingHighlight(b, vs)) continue;
    ctx.strokeStyle = `rgba(212,160,23,${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
  }
}

function drawKpMessDecor(ctx: CanvasRenderingContext2D, frame: number, active: boolean): void {
  const baseX = 358;
  const baseY = 88;
  const steam = Math.sin(frame * 0.1) * 4;
  ctx.fillStyle = active ? 'rgba(220,220,220,0.55)' : 'rgba(136,136,136,0.45)';
  ctx.fillRect(388, baseY + steam, 6, 14);
  ctx.fillRect(394, baseY - 6 + steam * 1.3, 5, 10);
  ctx.fillRect(376, baseY + 4 - steam * 0.8, 4, 8);

  if (!active) return;

  ctx.fillStyle = '#8b6914';
  ctx.fillRect(baseX, 148, 10, 8);
  ctx.fillRect(baseX + 12, 150, 9, 7);
  ctx.fillRect(baseX + 22, 149, 8, 8);
  ctx.fillStyle = '#c4a035';
  ctx.fillRect(baseX + 2, 150, 3, 3);
  ctx.fillRect(baseX + 15, 152, 3, 2);

  const scrub = Math.sin(frame * 0.25) * 3;
  ctx.fillStyle = 'rgba(200,230,255,0.35)';
  ctx.fillRect(370 + scrub, 132, 8, 6);
  ctx.fillRect(382 - scrub, 128, 6, 5);
  ctx.font = '5px monospace';
  ctx.fillStyle = '#87ceeb';
  ctx.textAlign = 'center';
  ctx.fillText('scrub', 378, 126);
}

function drawDuffel(ctx: CanvasRenderingContext2D, x: number, y: number, age: number): void {
  const rise = Math.min(age * 0.6, 18);
  const bob = Math.sin(age * 0.2) * 2;
  const dy = y - rise + bob;
  const alpha = age < 100 ? 1 : Math.max(0, 1 - (age - 100) / 20);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#4a4030';
  ctx.fillRect(x - 8, dy, 16, 10);
  ctx.fillStyle = '#6a5848';
  ctx.fillRect(x - 6, dy - 4, 12, 5);
  ctx.fillStyle = '#c4b581';
  ctx.fillRect(x - 2, dy - 2, 4, 3);
  if (age % 12 < 6) {
    ctx.fillStyle = '#e94560';
    ctx.fillRect(x + 6, dy - 10, 3, 3);
    ctx.fillRect(x - 8, dy - 8, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawMusterHearts(ctx: CanvasRenderingContext2D, soldiers: GameViewSoldier[], entities: Map<number, WorldEntity>, frame: number): void {
  const mustering = soldiers.filter((s) => s.activity === 'heritage_muster');
  if (mustering.length < 2) return;
  const positions = mustering
    .map((s) => entities.get(s.id))
    .filter((e): e is WorldEntity => !!e);
  if (positions.length < 2) return;
  const cx = (positions[0]!.x + positions[1]!.x) / 2;
  const cy = (positions[0]!.y + positions[1]!.y) / 2 - 20;
  const pulse = 1 + Math.sin(frame * 0.18) * 0.15;
  ctx.fillStyle = '#e94560';
  const s = 3 * pulse;
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  ctx.fillRect(cx - s * 3, cy - s * 0.5, s * 2, s * 2);
  ctx.fillRect(cx + s, cy - s * 0.5, s * 2, s * 2);
}

function drawVignettes(ctx: CanvasRenderingContext2D, vignettes: WorldVignette[]): void {
  for (const v of vignettes) {
    if (v.kind === 'muster_duffel') drawDuffel(ctx, v.x, v.y, v.age);
  }
}

function drawTopHud(ctx: CanvasRenderingContext2D, w: number, vs: GameViewState): void {
  ctx.fillStyle = '#141a10';
  ctx.fillRect(0, 0, w, HUD_H);
  ctx.fillStyle = '#2a3020';
  ctx.fillRect(0, HUD_H - 2, w, 2);

  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#c4b581';
  ctx.textAlign = 'left';
  ctx.fillText(vs.title.slice(0, 22), 6, 12);

  ctx.font = '8px monospace';
  ctx.fillStyle = '#9a9588';
  ctx.fillText(vs.subtitle.slice(0, 28), 6, 22);

  const s = vs.stats;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#d4a017';
  ctx.fillText(
    `STR ${s.strength}  SLIPS ${s.slips}  GEN ${s.lineage}  D${s.deploys}  +${s.slipPct}%`,
    w - 6,
    16,
  );

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a9580';
  ctx.font = '7px monospace';
  const tip = vs.tip.length > 58 ? vs.tip.slice(0, 56) + '…' : vs.tip;
  ctx.fillText(tip, w / 2, 26);
}

function drawActionBar(ctx: CanvasRenderingContext2D, w: number, vs: GameViewState): void {
  ctx.fillStyle = '#141a10';
  ctx.fillRect(0, BAR_TOP, w, 320 - BAR_TOP);
  ctx.fillStyle = '#2a3020';
  ctx.fillRect(0, BAR_TOP, w, 2);

  for (const btn of vs.buttons) {
    ctx.fillStyle = btn.enabled ? '#4b5320' : '#2a3020';
    if (btn.id === 'deploy' && btn.enabled) ctx.fillStyle = '#8a6a18';
    if (btn.id === 'muster' && vs.selected.size === 2) ctx.fillStyle = '#6a7a28';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = btn.enabled ? '#c4b581' : '#3a4030';
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.w - 1, btn.h - 1);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = btn.enabled ? '#f0ead8' : '#6a6858';
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 3);
  }

  const sel = vs.selected.size;
  ctx.textAlign = 'left';
  ctx.font = '7px monospace';
  ctx.fillStyle = '#d4a017';
  ctx.fillText(sel ? `${sel}/2 selected` : 'Tap specialists', 400, BAR_TOP + 14);
  if (vs.missionLeft !== null) {
    ctx.fillStyle = '#87ceeb';
    ctx.fillText(`KP ${vs.missionLeft}s`, 400, BAR_TOP + 26);
  }
}

export function updateWorldEntities(
  entities: Map<number, WorldEntity>,
  soldiers: GameViewSoldier[],
  frame: number,
): void {
  const byActivity = new Map<string, GameViewSoldier[]>();
  for (const s of soldiers) {
    const list = byActivity.get(s.activity) ?? [];
    list.push(s);
    byActivity.set(s.activity, list);
  }

  for (const s of soldiers) {
    let entity = entities.get(s.id);
    if (!entity) {
      entity = { id: s.id, x: 240, y: 160 };
      entities.set(s.id, entity);
    }

    if (s.activity === 'patrol') {
      const p = patrolPosition(s.id, frame);
      lerpEntity(entity, p.x, p.y, 0.12);
    } else {
      const zone = zoneFor(s.activity);
      const mates = byActivity.get(s.activity) ?? [];
      const idx = mates.findIndex((m) => m.id === s.id);
      const off = slotOffset(s.id, Math.max(0, idx));
      let tx = zone.x + off.dx;
      let ty = zone.y + off.dy;
      if (s.activity === 'heritage_muster') {
        tx += Math.sin(frame * 0.15 + s.id) * 2;
      }
      lerpEntity(entity, tx, ty, 0.06);
    }
  }

  for (const id of [...entities.keys()]) {
    if (!soldiers.some((s) => s.id === id)) entities.delete(id);
  }
}

export function drawGameFrame(
  canvas: HTMLCanvasElement,
  vs: GameViewState,
  entities: Map<number, WorldEntity>,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, canvas.height);

  drawTopHud(ctx, w, vs);
  drawTerrain(ctx, w, vs.frame);
  drawWorldBuildings(ctx, vs.frame, vs);

  ctx.font = '6px monospace';
  ctx.fillStyle = 'rgba(212,160,23,0.5)';
  ctx.textAlign = 'center';
  for (const z of ZONES) {
    if (z.id === 'deploy_pad') continue;
    ctx.fillText(z.label, z.x, z.y + 28);
  }

  drawVignettes(ctx, vs.vignettes);
  drawMusterHearts(ctx, vs.soldiers, entities, vs.frame);

  const sorted = [...vs.soldiers].sort((a, b) => {
    const ea = entities.get(a.id);
    const eb = entities.get(b.id);
    return (ea?.y ?? 0) - (eb?.y ?? 0);
  });

  for (const s of sorted) {
    const e = entities.get(s.id);
    if (!e) continue;
    const pal = paletteFor(s.branch);
    const grid = spriteForActivity(s.activity, s.stage);
    const sx = Math.round(e.x - 21);
    const sy = Math.round(e.y - 42);

    if (vs.selected.has(s.id)) {
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 6, 16, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawSprite(ctx, grid, pal, sx, sy, SPRITE_SCALE, vs.frame + s.id);

    ctx.font = '5px monospace';
    ctx.fillStyle = '#f0ead8';
    ctx.textAlign = 'center';
    ctx.fillText(s.name.split(' ').pop()?.slice(0, 6) ?? '', e.x, sy - 2);

    if (s.stage !== 'specialist') {
      ctx.fillStyle = '#87ceeb';
      ctx.fillText(s.stage.slice(0, 3).toUpperCase(), e.x, sy + 52);
    }
  }

  drawActionBar(ctx, w, vs);
}

export function hitTestSoldier(
  entities: Map<number, WorldEntity>,
  soldiers: GameViewSoldier[],
  px: number,
  py: number,
): number | null {
  if (py < WORLD_TOP || py > WORLD_BOTTOM) return null;
  let best: { id: number; d: number } | null = null;
  for (const s of soldiers) {
    const e = entities.get(s.id);
    if (!e) continue;
    const d = Math.hypot(px - e.x, py - (e.y - 10));
    if (d < HIT_R && (!best || d < best.d)) best = { id: s.id, d };
  }
  return best?.id ?? null;
}

export { hitTestBuilding } from './world-map';
export type { BuildingHit } from './world-map';

export function hitTestHudButton(buttons: HudButton[], px: number, py: number): HudAction | null {
  for (const btn of buttons) {
    if (px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h) {
      return btn.id;
    }
  }
  return null;
}

export function canvasCoords(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}
