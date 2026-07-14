import { lineageDepth, type GameState } from './sim';
import type { HudAction } from './game-view';

export interface UiProgress {
  pairsCompleted: number;
  kpRunsCompleted: number;
}

export interface UiUnlocks {
  kp: boolean;
  reinforce: boolean;
  deploy: boolean;
}

const DEFAULT_PROGRESS: UiProgress = { pairsCompleted: 0, kpRunsCompleted: 0 };

export function normalizeUiProgress(state: GameState): UiProgress {
  const raw = state.uiProgress;
  if (raw) return raw;
  return {
    pairsCompleted: lineageDepth(state) > 1 ? 1 : 0,
    kpRunsCompleted: state.slips > 0 ? 1 : 0,
  };
}

export function computeUiUnlocks(state: GameState): UiUnlocks {
  const p = normalizeUiProgress(state);
  return {
    kp: p.pairsCompleted >= 1,
    reinforce: p.kpRunsCompleted >= 1,
    deploy: lineageDepth(state) >= 3,
  };
}

export function hudVisibility(unlocks: UiUnlocks): Record<HudAction, boolean> {
  return {
    skins: true,
    muster: true,
    kp: unlocks.kp,
    reinforce: unlocks.reinforce,
    deploy: unlocks.deploy,
    reset: true,
  };
}

export function withUiProgress(state: GameState, patch: Partial<UiProgress>): GameState {
  const base = normalizeUiProgress(state);
  return { ...state, uiProgress: { ...base, ...patch } };
}
