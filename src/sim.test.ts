import { describe, expect, it } from 'vitest';
import {
  activeStrength,
  canPair,
  canPrestige,
  createInitialState,
  estimateKpPayout,
  lineageDepth,
  prestige,
  slipMultiplier,
  startMission,
  startPair,
  tick,
  type GameState,
  type Soldier,
} from './sim';

function withSoldiers(state: GameState, soldiers: Soldier[]): GameState {
  return { ...state, soldiers };
}

describe('MusterMill sim', () => {
  it('starts with two specialists', () => {
    const s = createInitialState();
    expect(activeStrength(s)).toBe(2);
    expect(s.soldiers.every((x) => x.stage === 'specialist')).toBe(true);
    expect(s.deployments).toBe(0);
  });

  it('rejects invalid pairs', () => {
    const s = createInitialState();
    const lone = s.soldiers[0]!;
    expect(canPair(lone, lone)).toBe(false);
  });

  it('awards slips when mission completes', () => {
    let s = createInitialState();
    const t0 = 1_000_000;
    s = startMission(s, t0);
    const expected = estimateKpPayout(s, t0);
    s = tick(s, t0 + 9000);
    expect(s.slips).toBe(expected);
    expect(s.slips).toBeGreaterThan(0);
  });

  it('estimates KP payout from eligible headcount', () => {
    const s = createInitialState();
    expect(estimateKpPayout(s)).toBe(26);
  });

  it('spawns recruit after pair timer', () => {
    let s = createInitialState();
    const t0 = 2_000_000;
    s = startPair(s, 1, 2, 'army', t0);
    s = tick(s, t0 + 7000);
    expect(activeStrength(s)).toBe(3);
    expect(lineageDepth(s)).toBeGreaterThanOrEqual(2);
  });

  it('blocks prestige until requirements met', () => {
    const s = createInitialState();
    expect(canPrestige(s).ok).toBe(false);
  });

  it('prestige resets roster and increments deployments', () => {
    const extra: Soldier = {
      id: 3,
      name: 'Recruit 3',
      stage: 'specialist',
      traits: ['11B Bloodline', 'Joint Task Force'],
      generation: 3,
      growthProgress: 1,
      onMission: false,
      branch: 'ocp',
    };
    let s = withSoldiers(createInitialState(), [
      ...createInitialState().soldiers,
      extra,
      { ...extra, id: 4, name: 'Recruit 4', generation: 3 },
    ]);
    s = { ...s, slips: 99, deployments: 0 };
    expect(canPrestige(s).ok).toBe(true);
    s = prestige(s, 'ocp');
    expect(activeStrength(s)).toBe(2);
    expect(s.slips).toBe(0);
    expect(s.deployments).toBe(1);
    expect(s.bloodlineTrait).toBe('11B Bloodline');
    expect(s.soldiers[0]?.weakenedTraits).toContain('11B Bloodline');
  });

  it('slip multiplier stacks per deployment', () => {
    expect(slipMultiplier(createInitialState())).toBe(1);
    const s = { ...createInitialState(), deployments: 3 };
    expect(slipMultiplier(s)).toBeCloseTo(1.3);
  });
});
