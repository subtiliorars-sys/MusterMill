import { describe, expect, it } from 'vitest';
import { formatCompact } from './format';

describe('formatCompact', () => {
  it('leaves small numbers intact', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(999)).toBe('999');
  });

  it('abbreviates thousands and millions', () => {
    expect(formatCompact(1200)).toBe('1.2K');
    expect(formatCompact(12000)).toBe('12K');
    expect(formatCompact(1_500_000)).toBe('1.5M');
  });
});
