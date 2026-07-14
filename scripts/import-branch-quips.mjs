#!/usr/bin/env node
/**
 * Import culture_bits, grooming_bits, quotes from Mustermate branch-brands.json
 * into data/field-manual.json for MusterMill flavor rotation.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = join(root, '..', 'Mustermate', 'packages', 'shared', 'data', 'branch-brands.json');
const out = join(root, 'data', 'field-manual.json');

const brands = JSON.parse(readFileSync(source, 'utf8'));
const slugs = [
  'army',
  'navy',
  'marines',
  'air_force',
  'space_guard',
  'space_force',
  'coast_guard',
  'national_guard',
];

const manual = {
  version: 1,
  imported_at: new Date().toISOString().slice(0, 10),
  source: 'Mustermate/packages/shared/data/branch-brands.json',
  branches: {},
};

for (const [key, branch] of Object.entries(brands.branches ?? {})) {
  const b = branch;
  const lines = [
    ...(b.culture_bits ?? []),
    ...(b.grooming_bits ?? []),
    ...(b.quotes ?? []),
    ...(b.match_messages ?? []),
    b.grooming_roast,
    ...(b.bio_prompts ?? []),
  ].filter(Boolean);
  manual.branches[key] = {
    label: b.brand_name ?? key,
    tagline: b.tagline ?? '',
    lines: [...new Set(lines)],
  };
}

writeFileSync(out, JSON.stringify(manual, null, 2) + '\n');
const count = Object.values(manual.branches).reduce((n, b) => n + b.lines.length, 0);
console.log(`Wrote ${out} — ${Object.keys(manual.branches).length} branches, ${count} lines`);
