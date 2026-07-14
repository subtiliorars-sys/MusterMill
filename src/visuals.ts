import type { GameState, Soldier } from './sim';
import type { SoldierActivity } from './pixel-art';

export function soldierActivity(s: Soldier, _state: GameState): SoldierActivity {
  if (s.onMission) return 'kp_duty';
  if (s.pairedUntil) return 'heritage_muster';
  if (s.stage === 'recruit' || s.stage === 'private') return 'boot_camp';
  if (s.id % 5 === 0) return 'patrol';
  if (s.id % 2 === 0) return 'liberty';
  return 'barracks';
}

export function sceneCaption(state: GameState): string {
  const counts: Partial<Record<SoldierActivity, number>> = {};
  for (const s of state.soldiers) {
    const a = soldierActivity(s, state);
    counts[a] = (counts[a] ?? 0) + 1;
  }
  const parts: string[] = [];
  if (counts.boot_camp) parts.push(`${counts.boot_camp} in boot camp`);
  if (counts.barracks) parts.push(`${counts.barracks} on base`);
  if (counts.liberty) parts.push(`${counts.liberty} on liberty`);
  if (counts.heritage_muster) parts.push(`${counts.heritage_muster} mustering`);
  if (counts.kp_duty) parts.push(`${counts.kp_duty} on KP`);
  if (counts.patrol) parts.push(`${counts.patrol} on patrol`);
  if (state.missionEndsAt && Date.now() < state.missionEndsAt) {
    parts.push('mess hall active');
  }
  return parts.length ? parts.join(' · ') : 'Barracks quiet. Awaiting orders.';
}

export function sceneSoldiers(state: GameState) {
  return state.soldiers.map((s) => ({
    id: s.id,
    branch: s.branch,
    stage: s.stage,
    activity: soldierActivity(s, state),
  }));
}
