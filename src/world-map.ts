import type { SoldierActivity } from './pixel-art';

export const WORLD_TOP = 30;
export const WORLD_BOTTOM = 262;
export const HUD_H = 30;
export const BAR_TOP = 266;

export interface ZoneAnchor {
  id: SoldierActivity | 'deploy_pad';
  label: string;
  x: number;
  y: number;
}

export const ZONES: ZoneAnchor[] = [
  { id: 'boot_camp', label: 'BOOT CAMP', x: 72, y: 185 },
  { id: 'barracks', label: 'BARRACKS', x: 168, y: 145 },
  { id: 'heritage_muster', label: 'HERITAGE QTRS', x: 268, y: 138 },
  { id: 'kp_duty', label: 'MESS HALL', x: 368, y: 142 },
  { id: 'liberty', label: 'LIBERTY GATE', x: 405, y: 210 },
  { id: 'deploy_pad', label: 'DEPLOY PAD', x: 430, y: 235 },
];

export function zoneFor(activity: SoldierActivity): ZoneAnchor {
  if (activity === 'patrol') return ZONES[0]!;
  const z = ZONES.find((z) => z.id === activity);
  return z ?? ZONES[1]!;
}

export function slotOffset(id: number, index: number): { dx: number; dy: number } {
  const ring = index % 6;
  const angle = (ring / 6) * Math.PI * 2 + id * 0.4;
  const r = 14 + Math.floor(index / 6) * 10;
  return { dx: Math.cos(angle) * r, dy: Math.sin(angle) * r * 0.6 };
}

/** Patrol waypoints — perimeter loop */
export const PATROL_PATH = [
  { x: 40, y: 220 },
  { x: 40, y: 120 },
  { x: 120, y: 80 },
  { x: 240, y: 75 },
  { x: 400, y: 90 },
  { x: 450, y: 170 },
  { x: 420, y: 240 },
  { x: 200, y: 250 },
  { x: 40, y: 220 },
];

export function patrolPosition(id: number, frame: number): { x: number; y: number } {
  const path = PATROL_PATH;
  const speed = 0.004;
  const t = (frame * speed + id * 0.17) % 1;
  const seg = t * (path.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  const a = path[i]!;
  const b = path[Math.min(i + 1, path.length - 1)]!;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

export interface WorldEntity {
  id: number;
  x: number;
  y: number;
}

export function lerpEntity(e: WorldEntity, tx: number, ty: number, speed = 0.08): void {
  e.x += (tx - e.x) * speed;
  e.y += (ty - e.y) * speed;
}
