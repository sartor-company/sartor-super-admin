import type { CSSProperties } from 'react';
import { formatNaira } from './format';

/** Annual CRM billing discount (20% off yearly list price). */
export const CRM_ANNUAL_DISCOUNT = 0.2;

export function crmAnnualTotal(monthlySubtotal: number) {
  const yearlyList = monthlySubtotal * 12;
  const yearlyDue = Math.round(yearlyList * (1 - CRM_ANNUAL_DISCOUNT));
  const savings = yearlyList - yearlyDue;
  return { yearlyList, yearlyDue, savings, monthlyEffective: yearlyDue / 12 };
}

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

export function calcSkuAnnualFee(n: number) {
  const count = parseInt(String(n), 10) || 0;
  if (count < 1) return null;
  if (count <= 5) return { band: 'Starter', rate: 350000, total: count * 350000 };
  if (count <= 20) return { band: 'Growth', rate: 250000, total: count * 250000 };
  if (count <= 50) return { band: 'Enterprise', rate: 175000, total: count * 175000 };
  return { band: 'Enterprise+', rate: 0, total: 0, negotiated: true as const };
}

export function calcOnboardingTotal(opts: {
  engagement: 'pilot' | 'full';
  skuCount: number;
  crmOn: boolean;
  crmRate: number;
  crmSeats: number;
  crmCycle: string;
}) {
  const onboardingFee = opts.engagement === 'pilot' ? 3500000 : 4500000;
  const sku =
    opts.engagement === 'full' && opts.skuCount > 0
      ? calcSkuAnnualFee(opts.skuCount)
      : null;
  const crm =
    opts.crmOn && opts.crmRate && opts.crmSeats > 0
      ? calcCrmBilling(opts.crmRate, opts.crmSeats, opts.crmCycle === 'annual')
      : null;
  const skuTotal = sku && !sku.negotiated ? sku.total : 0;
  const crmTotal = crm?.total ?? 0;
  return {
    onboardingFee,
    sku,
    crm,
    grandTotal: onboardingFee + skuTotal + crmTotal,
  };
}

export function calcCrmBilling(rate: number, seats: number, annual: boolean) {
  const tierNames: Record<number, string> = {
    5000: 'Sales Navigator',
    12000: 'Sales Navigator Plus',
    25000: 'CRM 360',
  };
  const monthly = rate * seats;
  if (!annual) {
    return {
      tierName: tierNames[rate] ?? 'CRM',
      monthly,
      total: monthly,
      yearlyList: monthly * 12,
      savings: 0,
      monthlyEffective: monthly,
      label: `${formatNaira(monthly)}/month`,
      annual: false,
    };
  }
  const { yearlyList, yearlyDue, savings, monthlyEffective } = crmAnnualTotal(monthly);
  const label = `${formatNaira(yearlyDue)}/yr (20% off · list ${formatNaira(yearlyList)} · save ${formatNaira(savings)} · ${formatNaira(monthlyEffective)}/mo effective)`;
  return {
    tierName: tierNames[rate] ?? 'CRM',
    monthly,
    total: yearlyDue,
    yearlyList,
    savings,
    monthlyEffective,
    label,
    annual: true,
  };
}
