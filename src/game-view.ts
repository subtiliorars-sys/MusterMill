import type { BranchSlug } from './sim';
import {
  drawSprite,
  paletteFor,
  spriteForActivity,
  type SoldierActivity,
} from './pixel-art';
import {
  BAR_TOP,
  HUD_H,
  lerpEntity,
  patrolPosition,
  slotOffset,
  WORLD_BOTTOM,
  WORLD_TOP,
  ZONES,
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
}

const SPRITE_SCALE = 2;
const HIT_R = 14;

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

function drawWorldBuildings(ctx: CanvasRenderingContext2D, frame: number): void {
  drawBuilding(ctx, 48, 155, 52, 38, '#4a4030', '#5c5040', 'BOOT');
  drawBuilding(ctx, 140, 108, 58, 48, '#3d4a30', '#4a5840', 'BARRACKS');
  drawBuilding(ctx, 238, 100, 62, 52, '#4a4038', '#5a5048', 'HERITAGE');
  drawBuilding(ctx, 338, 104, 64, 50, '#5a4838', '#6a5848', 'MESS');
  const steam = Math.sin(frame * 0.08) * 3;
  ctx.fillStyle = '#888';
  ctx.fillRect(388, 88 + steam, 6, 12);
  ctx.fillRect(394, 82 + steam * 1.2, 4, 8);
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(378, 188, 54, 8);
  ctx.fillRect(382, 168, 8, 28);
  ctx.fillRect(420, 168, 8, 28);
  ctx.fillStyle = '#e94560';
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LIBERTY', 405, 182);
  ctx.fillStyle = '#4a4a50';
  ctx.fillRect(400, 218, 70, 36);
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 2;
  ctx.strokeRect(404, 222, 62, 28);
  ctx.fillStyle = '#d4a017';
  ctx.fillText('DEPLOY', 435, 240);
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
  drawWorldBuildings(ctx, vs.frame);

  ctx.font = '6px monospace';
  ctx.fillStyle = 'rgba(212,160,23,0.5)';
  ctx.textAlign = 'center';
  for (const z of ZONES) {
    if (z.id === 'deploy_pad') continue;
    ctx.fillText(z.label, z.x, z.y + 28);
  }

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
    const sx = Math.round(e.x - 14);
    const sy = Math.round(e.y - 28);

    if (vs.selected.has(s.id)) {
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 4, 12, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawSprite(ctx, grid, pal, sx, sy, SPRITE_SCALE, vs.frame + s.id);

    ctx.font = '5px monospace';
    ctx.fillStyle = '#f0ead8';
    ctx.textAlign = 'center';
    ctx.fillText(s.name.split(' ').pop()?.slice(0, 6) ?? '', e.x, sy - 2);

    if (s.stage !== 'specialist') {
      ctx.fillStyle = '#87ceeb';
      ctx.fillText(s.stage.slice(0, 3).toUpperCase(), e.x, sy + 34);
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
    const d = Math.hypot(px - e.x, py - (e.y - 8));
    if (d < HIT_R && (!best || d < best.d)) best = { id: s.id, d };
  }
  return best?.id ?? null;
}

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
