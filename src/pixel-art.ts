import type { BranchSlug } from './sim';
import { getBranchSkin } from './branches';

export type SoldierActivity =
  | 'boot_camp'
  | 'barracks'
  | 'liberty'
  | 'heritage_muster'
  | 'kp_duty'
  | 'patrol'
  | 'deploy_ready';

export interface PixelPalette {
  _: string;
  h: string;
  u: string;
  s: string;
  b: string;
  e: string;
  c: string;
  a: string;
  d: string;
  w: string;
}

const DEFAULT_PAL: PixelPalette = {
  _: 'transparent',
  h: '#4b5320',
  u: '#5c6640',
  s: '#e8c4a0',
  b: '#2a2218',
  e: '#1a1410',
  c: '#e8a0a0',
  a: '#c4b581',
  d: '#1a1f14',
  w: '#f0ead8',
};

const BRANCH_TINTS: Partial<Record<BranchSlug, Partial<PixelPalette>>> = {
  navy: { h: '#001f3f', u: '#003366', a: '#ffd700' },
  marines: { h: '#8b0000', u: '#a52a2a', a: '#ffd700' },
  air_force: { h: '#00308f', u: '#1e4d8c', a: '#87ceeb' },
  space_force: { h: '#1a1a2e', u: '#2d2d4a', a: '#e94560' },
  coast_guard: { h: '#003366', u: '#004d80', a: '#ff6600' },
  national_guard: { h: '#2d5016', u: '#3d6b22', a: '#f0e68c' },
  army: { h: '#4b5320', u: '#5c6640', a: '#c4b581' },
  ocp: { h: '#4b5320', u: '#6b7058', a: '#9a9588' },
};

export function paletteFor(branch: BranchSlug): PixelPalette {
  const skin = getBranchSkin(branch);
  const tint = BRANCH_TINTS[branch] ?? {};
  return {
    ...DEFAULT_PAL,
    h: tint.h ?? skin.colors.primary,
    u: tint.u ?? skin.colors.primary,
    a: tint.a ?? skin.colors.accent,
  };
}

const BODY = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '..hhheeehhh...',
  '..hhsssshh....',
  '...hssccshh...',
  '...hssssshh...',
  '....uuuuuu....',
  '...uuuuuuuu...',
  '..uuuuuuuuuu..',
  '..uuuaauuuuu..',
  '..uuuuuuuuuu..',
  '...uuuuuuuu...',
  '....uu..uu....',
  '....ub..bu....',
  '....ub..bu....',
  '....bb..bb....',
  '....bb..bb....',
];

const RECRUIT = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '..hhheeehhh...',
  '..hhsssshh....',
  '...hssccshh...',
  '...hssssshh...',
  '....uuuuuu....',
  '...uuuuuuuu...',
  '..uuuuuuuuuu..',
  '...uuuuuuuu...',
  '....uu..uu....',
  '....ub..bu....',
  '....bb..bb....',
];

const KP = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '..hhheeehhh...',
  '..hhsssshh....',
  '...hssccshh...',
  '...hssssshh...',
  '....uuuuuu....',
  '...uuuuuuuu...',
  '..uuuuuuuuuu..',
  '..uuuaauuuuu..',
  '...uuuuuuuu...',
  '....uu..uu....',
  '...aa....aa...',
  '..aa......aa..',
  '.aa........aa.',
];

const MUSTER = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '..hhheeehhh...',
  '..hhsssshh....',
  '...hssccshh...',
  '...hssssshh...',
  '....uuuuuu....',
  '...uuuuuuuu...',
  '..uuuuuuuuuu..',
  '..uuuaauuuuu..',
  '...uuuuuuuu...',
  '....uu..uu....',
  '....ub..bu....',
  '...w......w...',
  '..w........w..',
];

const PATROL = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '..hhheeehhh...',
  '..hhsssshh....',
  '...hssccshh...',
  '...hssssshh...',
  '....uuuuuu....',
  '...uuuuuuuu...',
  '..uuuuuuuuuu..',
  '..uuuaauuuuu..',
  '...uuuuuuuu...',
  '....uu..uu....',
  '....ub..bu....',
  '....ub..bu....',
  '...bb....bb...',
  '..bb......bb..',
];

const LIBERTY = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '..hhheeehhh...',
  '..hhsssshh....',
  '...hssccshh...',
  '...hssssshh...',
  '....uuuuuu....',
  '...uuuuuuuu...',
  '..uuuuuuuuuu..',
  '..uuuaauuuuu..',
  '...uuuuuuuu...',
  '....uu..uu....',
  '....ub..bu....',
  '...a......a...',
  '....a....a....',
];

const SPRITES: Record<string, string[]> = {
  body: BODY,
  recruit: RECRUIT,
  kp: KP,
  muster: MUSTER,
  patrol: PATROL,
  liberty: LIBERTY,
};

export function spriteForActivity(activity: SoldierActivity, stage: string): string[] {
  if (stage === 'recruit') return SPRITES.recruit;
  switch (activity) {
    case 'kp_duty':
      return SPRITES.kp;
    case 'heritage_muster':
      return SPRITES.muster;
    case 'patrol':
      return SPRITES.patrol;
    case 'liberty':
      return SPRITES.liberty;
    case 'boot_camp':
      return SPRITES.recruit;
    default:
      return SPRITES.body;
  }
}

export function activityLabel(activity: SoldierActivity): string {
  const labels: Record<SoldierActivity, string> = {
    boot_camp: 'Boot camp',
    barracks: 'On base',
    liberty: 'Liberty',
    heritage_muster: 'Heritage Muster',
    kp_duty: 'KP duty',
    patrol: 'Patrol',
    deploy_ready: 'Deploy staging',
  };
  return labels[activity];
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  pal: PixelPalette,
  x: number,
  y: number,
  scale: number,
  frame = 0,
): { w: number; h: number } {
  const bob = Math.sin(frame * 0.12) * (scale >= 3 ? 1 : 0.5);
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length));
  for (let row = 0; row < rows; row++) {
    const line = grid[row]!;
    for (let col = 0; col < line.length; col++) {
      const ch = line[col]!;
      if (ch === '.') continue;
      const color = pal[ch as keyof PixelPalette];
      if (!color || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col * scale, y + row * scale + bob, scale, scale);
    }
  }
  return { w: cols * scale, h: rows * scale };
}

export interface SceneZone {
  id: SoldierActivity;
  label: string;
  x: number;
  w: number;
  color: string;
}

export function sceneZones(canvasW: number): SceneZone[] {
  const pad = 4;
  const w = (canvasW - pad * 6) / 5;
  return [
    { id: 'boot_camp', label: 'Boot camp', x: pad, w, color: '#2a3020' },
    { id: 'barracks', label: 'Barracks', x: pad * 2 + w, w, color: '#1f2818' },
    { id: 'heritage_muster', label: 'Heritage', x: pad * 3 + w * 2, w, color: '#2a2418' },
    { id: 'kp_duty', label: 'Mess hall', x: pad * 4 + w * 3, w, color: '#282018' },
    { id: 'liberty', label: 'Liberty', x: pad * 5 + w * 4, w, color: '#1a2030' },
  ];
}

function drawZoneDecor(
  ctx: CanvasRenderingContext2D,
  zone: SceneZone,
  y: number,
  h: number,
  frame: number,
): void {
  const cx = zone.x + zone.w / 2;
  ctx.fillStyle = zone.color;
  ctx.fillRect(zone.x, y, zone.w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(zone.x, y, zone.w, 14);

  ctx.font = '6px monospace';
  ctx.fillStyle = 'rgba(212,160,23,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText(zone.label.toUpperCase(), cx, y + 10);

  const t = frame * 0.05;
  switch (zone.id) {
    case 'boot_camp': {
      ctx.fillStyle = '#5c6640';
      ctx.fillRect(zone.x + 8, y + h - 18, zone.w - 16, 4);
      ctx.fillStyle = '#c4b581';
      ctx.fillRect(zone.x + 12 + (t % 20), y + h - 22, 6, 6);
      break;
    }
    case 'barracks': {
      ctx.fillStyle = '#3d4a30';
      ctx.fillRect(zone.x + 10, y + h - 28, zone.w - 20, 20);
      ctx.fillStyle = '#2a3020';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(zone.x + 14 + i * 18, y + h - 24, 10, 8);
      }
      break;
    }
    case 'heritage_muster': {
      ctx.fillStyle = '#4a4030';
      ctx.fillRect(zone.x + 12, y + h - 20, zone.w - 24, 12);
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(zone.x + zone.w / 2 - 8, y + h - 16, 16, 8);
      break;
    }
    case 'kp_duty': {
      ctx.fillStyle = '#6a5a40';
      ctx.fillRect(zone.x + 8, y + h - 16, zone.w - 16, 8);
      const steam = Math.sin(t * 2) * 2;
      ctx.fillStyle = 'rgba(200,200,200,0.25)';
      ctx.fillRect(zone.x + zone.w / 2 - 2, y + h - 28 + steam, 4, 8);
      ctx.fillRect(zone.x + zone.w / 2 + 6, y + h - 26 - steam, 3, 6);
      break;
    }
    case 'liberty': {
      ctx.fillStyle = '#e94560';
      ctx.font = '5px monospace';
      ctx.fillText('LIBERTY', cx, y + h - 10);
      const blink = Math.sin(t * 3) > 0 ? 1 : 0.4;
      ctx.globalAlpha = blink;
      ctx.fillRect(zone.x + 6, y + h - 18, zone.w - 12, 3);
      ctx.globalAlpha = 1;
      break;
    }
  }
}

export interface SceneSoldier {
  id: number;
  branch: BranchSlug;
  stage: string;
  activity: SoldierActivity;
}

export function drawScene(
  canvas: HTMLCanvasElement,
  soldiers: SceneSoldier[],
  frame: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0d1218');
  grad.addColorStop(1, '#1a1f14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#141a10';
  ctx.fillRect(0, h - 24, w, 24);
  ctx.fillStyle = '#2a3020';
  ctx.fillRect(0, h - 6, w, 6);

  const zones = sceneZones(w);
  const zoneTop = 18;
  const zoneH = h - 42;

  for (const zone of zones) {
    drawZoneDecor(ctx, zone, zoneTop, zoneH, frame);
  }

  const grouped = new Map<SoldierActivity, SceneSoldier[]>();
  for (const s of soldiers) {
    if (s.activity === 'patrol') continue;
    const list = grouped.get(s.activity) ?? [];
    list.push(s);
    grouped.set(s.activity, list);
  }

  for (const zone of zones) {
    const list = grouped.get(zone.id) ?? [];
    const scale = 2;
    const maxPerRow = Math.max(1, Math.floor((zone.w - 8) / (14 * scale)));
    list.forEach((soldier, i) => {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const countInRow = Math.min(maxPerRow, list.length - row * maxPerRow);
      const rowW = countInRow * 14 * scale;
      const sx =
        zone.x + (zone.w - rowW) / 2 + col * 14 * scale + Math.sin(frame * 0.1 + soldier.id) * 0.5;
      const sy = zoneTop + zoneH - 36 - row * 22;
      const pal = paletteFor(soldier.branch);
      const grid = spriteForActivity(soldier.activity, soldier.stage);
      drawSprite(ctx, grid, pal, sx, sy, scale, frame + soldier.id);
    });
  }

  const patrol = soldiers.filter((s) => s.activity === 'patrol');
  patrol.forEach((soldier, i) => {
    const pal = paletteFor(soldier.branch);
    const grid = spriteForActivity('patrol', soldier.stage);
    const px = ((frame * 0.8 + i * 40 + soldier.id * 17) % (w + 40)) - 20;
    drawSprite(ctx, grid, pal, px, h - 30, 2, frame + soldier.id);
  });
}

export function drawCardSprite(
  canvas: HTMLCanvasElement,
  branch: BranchSlug,
  activity: SoldierActivity,
  stage: string,
  frame: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pal = paletteFor(branch);
  const grid = spriteForActivity(activity, stage);
  const scale = 3;
  const cols = Math.max(...grid.map((r) => r.length));
  const rows = grid.length;
  const sx = (canvas.width - cols * scale) / 2;
  const sy = (canvas.height - rows * scale) / 2;
  drawSprite(ctx, grid, pal, sx, sy, scale, frame);
}
