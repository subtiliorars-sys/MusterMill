import { describe, expect, it } from 'vitest';
import { createInitialState } from './sim';
import { computeUiUnlocks, hudVisibility, normalizeUiProgress } from './ui-unlocks';

describe('ui-unlocks', () => {
  it('starts with only muster path unlocked', () => {
    const s = createInitialState();
    expect(computeUiUnlocks(s)).toEqual({ kp: false, reinforce: false, deploy: false });
    const vis = hudVisibility(computeUiUnlocks(s));
    expect(vis.kp).toBe(false);
    expect(vis.muster).toBe(true);
  });

  it('unlocks kp after first muster', () => {
    const s = { ...createInitialState(), uiProgress: { pairsCompleted: 1, kpRunsCompleted: 0 } };
    expect(computeUiUnlocks(s).kp).toBe(true);
  });

  it('unlocks reinforce after first KP', () => {
    const s = {
      ...createInitialState(),
      uiProgress: { pairsCompleted: 1, kpRunsCompleted: 1 },
    };
    expect(computeUiUnlocks(s).reinforce).toBe(true);
  });

  it('migrates legacy saves with slips and lineage', () => {
    const s = { ...createInitialState(), slips: 12 };
    expect(normalizeUiProgress(s).kpRunsCompleted).toBe(1);
  });
});
