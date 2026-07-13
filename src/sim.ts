export type GrowthStage = 'recruit' | 'private' | 'specialist';

export const TRAITS = [
  '11B Bloodline',
  '68W Heritage',
  '25U Signal',
  'Joint Task Force',
  'High & Tight Gene',
  'DFAC Diplomat',
  'Range Day Reflex',
  'Motor Pool Grease',
  'Chapel Morale',
  'NCO Academy',
] as const;

export type TraitName = (typeof TRAITS)[number];

export type BranchSlug =
  | 'ocp'
  | 'army'
  | 'navy'
  | 'marines'
  | 'air_force'
  | 'space_force'
  | 'coast_guard'
  | 'national_guard';

export interface Soldier {
  id: number;
  name: string;
  stage: GrowthStage;
  traits: TraitName[];
  generation: number;
  growthProgress: number;
  onMission: boolean;
  pairedUntil?: number;
  branch: BranchSlug;
}

export interface GameState {
  soldiers: Soldier[];
  slips: number;
  nextId: number;
  missionEndsAt: number | null;
  missionSoldierIds: number[];
  heritageBranch: BranchSlug;
}

export const MAX_SLOTS = 10;
export const GROWTH_TICK_MS = 4000;
export const PAIR_DURATION_MS = 6000;
export const MISSION_DURATION_MS = 8000;
export const BASE_KP_PAYOUT = 12;

export const REINFORCEMENT_COST = 40;

export function createInitialState(): GameState {
  const mk = (id: number, name: string, branch: BranchSlug): Soldier => ({
    id,
    name,
    stage: 'specialist',
    traits: id === 1 ? ['11B Bloodline', 'DFAC Diplomat'] : ['68W Heritage', 'Range Day Reflex'],
    generation: 1,
    growthProgress: 1,
    onMission: false,
    branch,
  });
  return {
    soldiers: [mk(1, 'Pvt. Pebble', 'ocp'), mk(2, 'Pvt. Patch', 'ocp')],
    slips: 0,
    nextId: 3,
    missionEndsAt: null,
    missionSoldierIds: [],
    heritageBranch: 'ocp',
  };
}

export function canPair(a: Soldier, b: Soldier): boolean {
  if (a.id === b.id) return false;
  if (a.stage !== 'specialist' || b.stage !== 'specialist') return false;
  if (a.onMission || b.onMission) return false;
  if (a.pairedUntil || b.pairedUntil) return false;
  return true;
}

export function pickTraits(parentA: Soldier, parentB: Soldier): TraitName[] {
  const pool = [...new Set([...parentA.traits, ...parentB.traits, ...TRAITS])];
  if (parentA.branch !== parentB.branch && !pool.includes('Joint Task Force')) {
    pool.push('Joint Task Force');
  }
  const roll = () => pool[Math.floor(Math.random() * pool.length)]!;
  const first = roll();
  let second = roll();
  if (second === first) second = pool[(pool.indexOf(first) + 1) % pool.length]!;
  return [first, second];
}

export function pickChildBranch(parentA: Soldier, parentB: Soldier, activeBranch: BranchSlug): BranchSlug {
  if (parentA.branch === parentB.branch) return parentA.branch;
  return activeBranch;
}

export function startPair(
  state: GameState,
  idA: number,
  idB: number,
  activeBranch: BranchSlug = 'army',
  now = Date.now(),
): GameState {
  const a = state.soldiers.find((s) => s.id === idA);
  const b = state.soldiers.find((s) => s.id === idB);
  if (!a || !b || !canPair(a, b)) return state;
  if (state.soldiers.length >= MAX_SLOTS) return state;

  const pairedUntil = now + PAIR_DURATION_MS;
  return {
    ...state,
    heritageBranch: activeBranch,
    soldiers: state.soldiers.map((s) => {
      if (s.id === idA || s.id === idB) return { ...s, pairedUntil };
      return s;
    }),
  };
}

export function tick(state: GameState, now = Date.now()): GameState {
  let next = { ...state, soldiers: [...state.soldiers] };

  if (next.missionEndsAt && now >= next.missionEndsAt) {
    const missionIds = next.missionSoldierIds;
    const payoutPer = BASE_KP_PAYOUT;
    const bonus = next.soldiers
      .filter((s) => missionIds.includes(s.id))
      .reduce((sum, s) => sum + (s.traits.includes('11B Bloodline') ? 1 : 0), 0);
    const total = missionIds.length * payoutPer + bonus * 2;
    next = {
      ...next,
      slips: next.slips + total,
      missionEndsAt: null,
      missionSoldierIds: [],
      soldiers: next.soldiers.map((s) =>
        missionIds.includes(s.id) ? { ...s, onMission: false } : s,
      ),
    };
  }

  const births: Soldier[] = [];
  const paired = new Map<number, number>();
  for (const s of next.soldiers) {
    if (s.pairedUntil && now >= s.pairedUntil && !paired.has(s.id)) {
      const partner = next.soldiers.find(
        (p) => p.id !== s.id && p.pairedUntil === s.pairedUntil && !paired.has(p.id),
      );
      if (partner) {
        paired.set(s.id, partner.id);
        paired.set(partner.id, s.id);
        const gen = Math.max(s.generation, partner.generation) + 1;
        births.push({
          id: next.nextId,
          name: `Recruit ${next.nextId}`,
          stage: 'recruit',
          traits: pickTraits(s, partner),
          generation: gen,
          growthProgress: 0,
          onMission: false,
          branch: pickChildBranch(s, partner, next.heritageBranch),
        });
        next.nextId += 1;
      }
    }
  }

  if (births.length && next.soldiers.length + births.length <= MAX_SLOTS) {
    next.soldiers = [
      ...next.soldiers.map((s) => (s.pairedUntil && now >= s.pairedUntil ? { ...s, pairedUntil: undefined } : s)),
      ...births,
    ];
  } else {
    next.soldiers = next.soldiers.map((s) =>
      s.pairedUntil && now >= s.pairedUntil ? { ...s, pairedUntil: undefined } : s,
    );
  }

  return next;
}

export function advanceGrowth(state: GameState, deltaMs: number): GameState {
  return {
    ...state,
    soldiers: state.soldiers.map((s) => {
      if (s.stage === 'specialist' || s.onMission || s.pairedUntil) return s;
      const rate = s.traits.includes('68W Heritage') ? 1.15 : 1;
      let progress = s.growthProgress + (deltaMs / GROWTH_TICK_MS) * rate;
      let stage: GrowthStage = s.stage;
      while (progress >= 1 && stage !== 'specialist') {
        progress -= 1;
        stage = stage === 'recruit' ? 'private' : 'specialist';
      }
      return { ...s, growthProgress: stage === 'specialist' ? 1 : Math.min(progress, 0.999), stage };
    }),
  };
}

export function startMission(state: GameState, now = Date.now()): GameState {
  if (state.missionEndsAt && now < state.missionEndsAt) return state;
  const ids = state.soldiers
    .filter((s) => (s.stage === 'private' || s.stage === 'specialist') && !s.onMission && !s.pairedUntil)
    .map((s) => s.id);
  if (!ids.length) return state;
  return {
    ...state,
    missionEndsAt: now + MISSION_DURATION_MS,
    missionSoldierIds: ids,
    soldiers: state.soldiers.map((s) => (ids.includes(s.id) ? { ...s, onMission: true } : s)),
  };
}

export function buyReinforcement(state: GameState, activeBranch: BranchSlug): GameState {
  if (state.slips < REINFORCEMENT_COST) return state;
  if (state.soldiers.length >= MAX_SLOTS) return state;
  const soldier: Soldier = {
    id: state.nextId,
    name: `Pvt. ${state.nextId}`,
    stage: 'specialist',
    traits: ['DFAC Diplomat', 'Range Day Reflex'],
    generation: 1,
    growthProgress: 1,
    onMission: false,
    branch: activeBranch,
  };
  return {
    ...state,
    slips: state.slips - REINFORCEMENT_COST,
    nextId: state.nextId + 1,
    soldiers: [...state.soldiers, soldier],
  };
}

export function activeStrength(state: GameState): number {
  return state.soldiers.length;
}

export function lineageDepth(state: GameState): number {
  return state.soldiers.reduce((max, s) => Math.max(max, s.generation), 0);
}
