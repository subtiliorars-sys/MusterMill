import flavorJson from '../data/flavor.json';
import type { BranchSlug } from './sim';

type FlavorPool = Record<string, string[]>;

const data = flavorJson as {
  disclaimer: string;
  safety_brief: string[];
  universal_tips: string[];
  pair_start: FlavorPool & { universal: string[] };
  birth: FlavorPool & { universal: string[] };
  mission_complete: FlavorPool & { universal: string[] };
  premium_cta: string;
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function branchPool(pool: FlavorPool & { universal: string[] }, branch: BranchSlug): string[] {
  const specific = pool[branch];
  return specific?.length ? [...pool.universal, ...specific] : pool.universal;
}

export function getDisclaimer(): string {
  return data.disclaimer;
}

export function getSafetyBriefLines(): string[] {
  return data.safety_brief;
}

export function randomTip(branch: BranchSlug): string {
  return pick(data.universal_tips.concat(branchPool(data.pair_start, branch)));
}

export function pairStartMessage(branch: BranchSlug): string {
  return pick(branchPool(data.pair_start, branch));
}

export function birthMessage(branch: BranchSlug): string {
  return pick(branchPool(data.birth, branch));
}

export function missionCompleteMessage(branch: BranchSlug): string {
  return pick(branchPool(data.mission_complete, branch));
}

export function premiumCta(): string {
  return data.premium_cta;
}
