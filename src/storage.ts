import type { GameState } from './sim';
import { BLOODLINE_CARRY_DEFAULT } from './sim';
import { normalizeUiProgress } from './ui-unlocks';

const SAVE_KEY = 'mustermill-save-v2';

export interface PersistedBundle {
  game: GameState;
  branchSlug: string;
  demoUnlock: boolean;
  savedAt: number;
}

export function normalizeGameState(raw: GameState): GameState {
  const base = {
    ...raw,
    deployments: raw.deployments ?? 0,
    bloodlineTrait: raw.bloodlineTrait ?? null,
    bloodlineStrength: raw.bloodlineStrength ?? BLOODLINE_CARRY_DEFAULT,
    soldiers: raw.soldiers.map((s) => ({
      ...s,
      weakenedTraits: s.weakenedTraits ?? [],
    })),
    milestonesSeen: raw.milestonesSeen ?? [],
  };
  return { ...base, uiProgress: normalizeUiProgress(base) };
}

export function loadBundle(): PersistedBundle | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedBundle;
    if (!parsed?.game?.soldiers?.length) return null;
    return { ...parsed, game: normalizeGameState(parsed.game) };
  } catch {
    return null;
  }
}

export function saveBundle(bundle: PersistedBundle): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(bundle));
  } catch {
    /* private mode / quota */
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
