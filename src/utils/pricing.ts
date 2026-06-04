import type { CSSProperties } from 'react';
import { formatNaira } from './format';

export function calcConversionPreview(skus: number): { html: string; style: CSSProperties } {
  const n = parseInt(String(skus), 10) || 0;
  if (n >= 1 && n <= 5) {
    const rate = 350000;
    const total = n * rate;
    return {
      html: `<strong>Starter (1–5 SKUs)</strong> — ${formatNaira(rate)}/SKU/yr<br>Annual licence: ${formatNaira(total)} · Onboarding fee after pilot credit: <strong style="color:var(--gt)">₦1,000,000</strong><br><strong>Total at conversion: ${formatNaira(total + 1000000)}</strong>`,
      style: { padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginBottom: 13 },
    };
  }
  if (n >= 6 && n <= 20) {
    const rate = 250000;
    const total = n * rate;
    return {
      html: `<strong>Growth (6–20 SKUs)</strong> — ${formatNaira(rate)}/SKU/yr<br>Annual licence: ${formatNaira(total)} · Onboarding fee after pilot credit: <strong style="color:var(--gt)">₦1,000,000</strong><br><strong>Total at conversion: ${formatNaira(total + 1000000)}</strong>`,
      style: { padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginBottom: 13 },
    };
  }
  if (n >= 21 && n <= 50) {
    const rate = 175000;
    const total = n * rate;
    return {
      html: `<strong>Enterprise (21–50 SKUs)</strong> — ${formatNaira(rate)}/SKU/yr<br>Annual licence: ${formatNaira(total)} · Onboarding fee after pilot credit: <strong style="color:var(--gt)">₦1,000,000</strong><br><strong>Total at conversion: ${formatNaira(total + 1000000)}</strong>`,
      style: { padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginBottom: 13 },
    };
  }
  if (n > 50) {
    return {
      html: '<strong>Enterprise+</strong> — contact Sartor for negotiated pricing.',
      style: { padding: 9, background: 'var(--pb)', borderRadius: 7, fontSize: 12, color: 'var(--pt)', marginBottom: 13 },
    };
  }
  return {
    html: 'Enter SKU count above to calculate annual licence fee.',
    style: { padding: 9, background: 'var(--bg)', borderRadius: 7, fontSize: 12, color: 'var(--text2)', marginBottom: 13 },
  };
}

export function calcCrmBilling(rate: number, seats: number, annual: boolean) {
  const tierNames: Record<number, string> = {
    5000: 'Sales Navigator',
    12000: 'Sales Navigator Plus',
    25000: 'CRM 360',
  };
  const monthly = rate * seats;
  const total = annual ? monthly * 12 * 0.8 : monthly;
  const label = annual
    ? `${formatNaira(total)} annually (20% off · ${formatNaira(monthly * 12)} → ${formatNaira(total)})`
    : `${formatNaira(monthly)}/month`;
  return { tierNames: tierNames[rate] ?? 'CRM', monthly, total, label };
}
