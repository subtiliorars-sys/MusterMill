import { describe, expect, it } from 'vitest';
import {
  activeStrength,
  canPair,
  createInitialState,
  lineageDepth,
  startMission,
  startPair,
  tick,
} from './sim';

describe('MusterMill sim', () => {
  it('starts with two specialists', () => {
    const s = createInitialState();
    expect(activeStrength(s)).toBe(2);
    expect(s.soldiers.every((x) => x.stage === 'specialist')).toBe(true);
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
    s = tick(s, t0 + 9000);
    expect(s.slips).toBeGreaterThan(0);
  });

  it('spawns recruit after pair timer', () => {
    let s = createInitialState();
    const t0 = 2_000_000;
    s = startPair(s, 1, 2, 'army', t0);
    s = tick(s, t0 + 7000);
    expect(activeStrength(s)).toBe(3);
    expect(lineageDepth(s)).toBeGreaterThanOrEqual(2);
  });
});
