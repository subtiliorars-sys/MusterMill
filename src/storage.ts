import type { GameState } from './sim';

const SAVE_KEY = 'mustermill-save-v1';

export interface PersistedBundle {
  game: GameState;
  branchSlug: string;
  demoUnlock: boolean;
  savedAt: number;
}

export function loadBundle(): PersistedBundle | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedBundle;
    if (!parsed?.game?.soldiers?.length) return null;
    return parsed;
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
