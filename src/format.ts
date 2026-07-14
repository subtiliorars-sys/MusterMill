/** Cookie Clicker–style compact numbers for HUD (1.2K, 3M, …). */
export function formatCompact(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs < 1000) return sign + String(Math.floor(abs));
  if (abs < 1_000_000) {
    const v = abs / 1000;
    const digits = abs < 10_000 ? 1 : 0;
    const s = v.toFixed(digits).replace(/\.0$/, '');
    return `${sign}${s}K`;
  }
  if (abs < 1_000_000_000) {
    const v = abs / 1_000_000;
    const digits = abs < 10_000_000 ? 1 : 0;
    const s = v.toFixed(digits).replace(/\.0$/, '');
    return `${sign}${s}M`;
  }
  const v = abs / 1_000_000_000;
  const s = v.toFixed(1).replace(/\.0$/, '');
  return `${sign}${s}B`;
}
