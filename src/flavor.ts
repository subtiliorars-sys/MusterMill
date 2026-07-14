import flavorJson from '../data/flavor.json';
import manualJson from '../data/field-manual.json';
import type { BranchSlug } from './sim';

type FlavorPool = Record<string, string[]>;

interface FlavorData {
  disclaimer: string;
  safety_brief: string[];
  universal_tips: string[];
  pair_start: FlavorPool & { universal: string[] };
  birth: FlavorPool & { universal: string[] };
  mission_complete: FlavorPool & { universal: string[] };
  premium_cta: string;
  deployment: { universal: string[]; ready: string[] };
}

const data = flavorJson as FlavorData;

interface FieldManualBranch {
  label: string;
  tagline: string;
  lines: string[];
}

const fieldManual = manualJson as {
  branches: Record<string, FieldManualBranch>;
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

export function randomTip(branch: BranchSlug, fieldManualEnabled = true): string {
  if (fieldManualEnabled && branch !== 'ocp') {
    const section = fieldManual.branches[branch];
    if (section?.lines?.length && Math.random() < 0.7) {
      return pick(section.lines);
    }
  }
  return pick(data.universal_tips.concat(branchPool(data.pair_start, branch)));
}

export function fieldManualCount(branch: BranchSlug): number {
  return fieldManual.branches[branch]?.lines.length ?? 0;
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

export function deploymentMessage(): string {
  return pick(data.deployment.universal);
}

export function deploymentReadyMessage(): string {
  return pick(data.deployment.ready);
}
