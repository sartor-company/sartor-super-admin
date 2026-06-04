export function formatNaira(n: number, maxFrac = 0): string {
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: maxFrac })}`;
}
