import skinsJson from '../data/branch-skins.json';

export interface BranchColors {
  primary: string;
  accent: string;
  hot: string;
  bg: string;
  panel: string;
}

export interface BranchSkin {
  slug: string;
  label: string;
  short_label: string;
  subtitle: string;
  mascot_emoji: string;
  premium: boolean;
  colors: BranchColors;
}

const catalog = skinsJson as {
  default_slug: string;
  free_slug: string;
  skins: Record<string, BranchSkin>;
};

export const DEFAULT_BRANCH = catalog.default_slug;
export const FREE_BRANCH = catalog.free_slug;
export const DEMO_UNLOCK_KEY = 'mustermill-demo-unlock';

export function listBranchSkins(): BranchSkin[] {
  return Object.values(catalog.skins);
}

export function getBranchSkin(slug: string): BranchSkin {
  return catalog.skins[slug] ?? catalog.skins[catalog.default_slug]!;
}

export function isBranchUnlocked(slug: string, demoUnlock: boolean): boolean {
  const skin = getBranchSkin(slug);
  if (!skin.premium) return true;
  return demoUnlock;
}

export function applyBranchTheme(slug: string): BranchSkin {
  const skin = getBranchSkin(slug);
  const root = document.documentElement;
  root.style.setProperty('--bg', skin.colors.bg);
  root.style.setProperty('--panel', skin.colors.panel);
  root.style.setProperty('--primary', skin.colors.primary);
  root.style.setProperty('--accent', skin.colors.accent);
  root.style.setProperty('--hot', skin.colors.hot);
  root.dataset.branch = slug;
  return skin;
}
