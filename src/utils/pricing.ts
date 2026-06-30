import type { CSSProperties } from 'react';
import { formatNaira } from './format';

/** Annual CRM billing discount (20% off yearly list price). */
export const CRM_ANNUAL_DISCOUNT = 0.2;

export const BILL = {
  pilotFee: 3_500_000,
  fullFee: 4_500_000,
  pilotConvertFee: 1_000_000,
  crm360Annual: 4_500_000,
  crmField: 15_000,
  crmDepotRev: 22_000,
  crmDepotOp: 8_000,
  skuBands: [
    { max: 5, rate: 350_000 },
    { max: 20, rate: 250_000 },
    { max: 50, rate: 175_000 },
  ],
  domainGrowthSetup: 100_000,
  domainGrowthYr: 50_000,
  domainEntSetup: 150_000,
  domainEntYr: 200_000,
  credits: {
    batchStarter: 800_000,
    batchStandard: 2_100_000,
    batchPro: 3_600_000,
    pinEntry: 200_000,
    pinGrowth: 600_000,
    pinEnterprise: 1_800_000,
    smsStarter: 50_000,
    smsStandard: 200_000,
    smsEnterprise: 600_000,
  },
  defaultCredits: [
    { type: 'Batch Calibration', bundle: 'Starter', qty: '5 credits', value: 800_000 },
    { type: 'PIN Authentication', bundle: 'Entry', qty: '10,000 PINs', value: 200_000 },
    { type: 'SMS Notifications', bundle: 'Starter', qty: '10,000 SMS', value: 50_000 },
  ],
  annualDiscount: 0.8,
} as const;

export type CrmTierType = 'field' | 'depot' | '360';
export type EngagementType = 'pilot' | 'full';
export type CrmCycle = 'monthly' | 'annual';
export type DomainUpgrade = 'none' | 'growth' | 'enterprise';
export type AccountStatus = 'inactive' | 'active' | 'pilot';

export type OnboardBillInput = {
  company?: string;
  services: { scdora: boolean; crm: boolean };
  engagement: EngagementType;
  pilotConvert: boolean;
  crmTier: CrmTierType;
  revSeats: number;
  opSeats: number;
  crmCycle: CrmCycle;
  domainUpgrade: DomainUpgrade;
  addCredits: string[];
};

export type BillLine = {
  desc: string;
  amt: number;
  type: 'one-off' | 'monthly' | 'annual' | 'included';
};

export type BillResult = {
  lines: BillLine[];
  oneOff: number;
  monthly: number;
  annual: boolean;
  billableTotal: number;
};

const ADD_CREDIT_MAP: Record<string, [string, number]> = {
  batchStarter: ['Batch Calibration — Starter (5)', 800_000],
  batchStandard: ['Batch Calibration — Standard (15)', 2_100_000],
  batchPro: ['Batch Calibration — Professional (30)', 3_600_000],
  pinEntry: ['PIN Authentication — Entry (10,000)', 200_000],
  pinGrowth: ['PIN Authentication — Growth (50,000)', 600_000],
  pinEnterprise: ['PIN Authentication — Enterprise (200,000)', 1_800_000],
  smsStarter: ['SMS — Starter (10,000)', 50_000],
  smsStandard: ['SMS — Standard (50,000)', 200_000],
  smsEnterprise: ['SMS — Enterprise (200,000)', 600_000],
};

export function normalizeCrmTier(raw?: string | null): CrmTierType {
  const key = String(raw || 'field')
    .trim()
    .toLowerCase();
  if (key === '360' || key === 'crm 360') return '360';
  if (key === 'depot' || key.includes('depot') || key.includes('nav plus')) return 'depot';
  return 'field';
}

export function computeBill(obData: OnboardBillInput): BillResult {
  const d = obData;
  const disc = BILL.annualDiscount;
  const lines: BillLine[] = [];
  let oneOff = 0;
  let monthly = 0;
  const annual = d.crmCycle === 'annual';
  const is360 = d.services.crm && d.crmTier === '360';
  const isFieldDepot = d.services.crm && (d.crmTier === 'field' || d.crmTier === 'depot');

  if (is360) {
    const scBase = d.pilotConvert ? BILL.pilotConvertFee : BILL.fullFee;
    const crmBase = BILL.crm360Annual;
    if (annual) {
      const sc = scBase * disc;
      const crm = crmBase * disc;
      lines.push({
        desc: `Sartor-Chain & DORA AI — ${d.pilotConvert ? 'Full Deployment (Pilot Convert)' : 'Full Deployment'} [annual, 20% off]`,
        amt: sc,
        type: 'annual',
      });
      lines.push({
        desc: 'Sartor CRM 360 — access, unlimited seats [annual, 20% off]',
        amt: crm,
        type: 'annual',
      });
      oneOff += sc + crm;
    } else {
      const scMo = scBase / 12;
      const crmMo = crmBase / 12;
      lines.push({
        desc: `Sartor-Chain & DORA AI — ${d.pilotConvert ? 'Full Deployment (Pilot Convert)' : 'Full Deployment'} [monthly]`,
        amt: scMo,
        type: 'monthly',
      });
      lines.push({
        desc: 'Sartor CRM 360 — access, unlimited seats [monthly]',
        amt: crmMo,
        type: 'monthly',
      });
      monthly += scMo + crmMo;
    }
    BILL.defaultCredits.forEach((c) =>
      lines.push({
        desc: `${c.type} — ${c.bundle} (${c.qty}) — INCLUDED`,
        amt: 0,
        type: 'included',
      }),
    );
  } else if (isFieldDepot) {
    const revRate = d.crmTier === 'field' ? BILL.crmField : BILL.crmDepotRev;
    let mo = d.revSeats * revRate;
    let label = `Sartor CRM ${d.crmTier === 'field' ? 'Field' : 'Depot'} — ${d.revSeats} revenue seat${d.revSeats > 1 ? 's' : ''}`;
    if (d.crmTier === 'depot' && d.opSeats > 0) {
      mo += d.opSeats * BILL.crmDepotOp;
      label += ` + ${d.opSeats} op`;
    }
    if (annual) {
      const annualAmt = mo * 12 * disc;
      lines.push({ desc: `${label} [annual, 20% off]`, amt: annualAmt, type: 'annual' });
      oneOff += annualAmt;
    } else {
      lines.push({ desc: `${label} [monthly]`, amt: mo, type: 'monthly' });
      monthly += mo;
    }
  } else if (d.services.scdora) {
    if (d.engagement === 'pilot') {
      lines.push({
        desc: 'Sartor-Chain & DORA AI — Pilot Programme (90-day)',
        amt: BILL.pilotFee,
        type: 'one-off',
      });
      oneOff += BILL.pilotFee;
    } else {
      const fee = d.pilotConvert ? BILL.pilotConvertFee : BILL.fullFee;
      lines.push({
        desc: `Sartor-Chain & DORA AI — ${d.pilotConvert ? 'Full Deployment (Pilot Convert)' : 'Full Deployment Onboarding'}`,
        amt: fee,
        type: 'one-off',
      });
      oneOff += fee;
      if (d.domainUpgrade === 'growth') {
        lines.push({ desc: 'Growth Subdomain — setup', amt: BILL.domainGrowthSetup, type: 'one-off' });
        oneOff += BILL.domainGrowthSetup;
        lines.push({ desc: 'Growth Subdomain — annual maintenance', amt: BILL.domainGrowthYr, type: 'annual' });
        oneOff += BILL.domainGrowthYr;
      } else if (d.domainUpgrade === 'enterprise') {
        lines.push({ desc: 'Enterprise CNAME — setup', amt: BILL.domainEntSetup, type: 'one-off' });
        oneOff += BILL.domainEntSetup;
        lines.push({ desc: 'Enterprise CNAME — annual maintenance', amt: BILL.domainEntYr, type: 'annual' });
        oneOff += BILL.domainEntYr;
      }
    }
    BILL.defaultCredits.forEach((c) =>
      lines.push({
        desc: `${c.type} — ${c.bundle} (${c.qty}) — INCLUDED`,
        amt: 0,
        type: 'included',
      }),
    );
  }

  if (!isFieldDepot) {
    d.addCredits.forEach((key) => {
      const row = ADD_CREDIT_MAP[key];
      if (row) {
        lines.push({ desc: `${row[0]} (added)`, amt: row[1], type: 'one-off' });
        oneOff += row[1];
      }
    });
  }

  return {
    lines,
    oneOff,
    monthly,
    annual,
    billableTotal: oneOff > 0 ? oneOff : monthly,
  };
}

export function onboardingStepTotal(obData: Pick<OnboardBillInput, 'services' | 'crmTier'>): number {
  if (obData.services.crm && !obData.services.scdora && obData.crmTier !== '360') return 3;
  return 5;
}

export function crmAnnualTotal(monthlySubtotal: number) {
  const yearlyList = monthlySubtotal * 12;
  const yearlyDue = Math.round(yearlyList * (1 - CRM_ANNUAL_DISCOUNT));
  const savings = yearlyList - yearlyDue;
  return { yearlyList, yearlyDue, savings, monthlyEffective: yearlyDue / 12 };
}

export function calcConversionPreview(skus: number): { html: string; style: CSSProperties } {
  const n = parseInt(String(skus), 10) || 0;
  if (n >= 1 && n <= 5) {
    const rate = 350_000;
    const total = n * rate;
    return {
      html: `<strong>Starter (1–5 SKUs)</strong> — ${formatNaira(rate)}/SKU/yr<br>Annual licence: ${formatNaira(total)} · Onboarding fee after pilot credit: <strong style="color:var(--gt)">₦1,000,000</strong><br><strong>Total at conversion: ${formatNaira(total + 1_000_000)}</strong>`,
      style: { padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginBottom: 13 },
    };
  }
  if (n >= 6 && n <= 20) {
    const rate = 250_000;
    const total = n * rate;
    return {
      html: `<strong>Growth (6–20 SKUs)</strong> — ${formatNaira(rate)}/SKU/yr<br>Annual licence: ${formatNaira(total)} · Onboarding fee after pilot credit: <strong style="color:var(--gt)">₦1,000,000</strong><br><strong>Total at conversion: ${formatNaira(total + 1_000_000)}</strong>`,
      style: { padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginBottom: 13 },
    };
  }
  if (n >= 21 && n <= 50) {
    const rate = 175_000;
    const total = n * rate;
    return {
      html: `<strong>Enterprise (21–50 SKUs)</strong> — ${formatNaira(rate)}/SKU/yr<br>Annual licence: ${formatNaira(total)} · Onboarding fee after pilot credit: <strong style="color:var(--gt)">₦1,000,000</strong><br><strong>Total at conversion: ${formatNaira(total + 1_000_000)}</strong>`,
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
  if (count <= 5) return { band: 'Starter', rate: 350_000, total: count * 350_000 };
  if (count <= 20) return { band: 'Growth', rate: 250_000, total: count * 250_000 };
  if (count <= 50) return { band: 'Enterprise', rate: 175_000, total: count * 175_000 };
  return { band: 'Enterprise+', rate: 0, total: 0, negotiated: true as const };
}

/** @deprecated Legacy wizard — maps to computeBill where possible */
export function calcOnboardingTotal(opts: {
  engagement: EngagementType;
  skuCount: number;
  crmOn: boolean;
  crmRate: number;
  crmSeats: number;
  crmCycle: string;
}) {
  const crmTier: CrmTierType =
    opts.crmRate === 25_000 || opts.crmRate === 25000 ? '360' : opts.crmRate >= 12_000 ? 'depot' : 'field';
  const bill = computeBill({
    company: '',
    services: { scdora: true, crm: opts.crmOn },
    engagement: opts.engagement,
    pilotConvert: false,
    crmTier,
    revSeats: parseInt(String(opts.crmSeats), 10) || 0,
    opSeats: 0,
    crmCycle: opts.crmCycle === 'annual' ? 'annual' : 'monthly',
    domainUpgrade: 'none',
    addCredits: [],
  });
  const onboardingFee = opts.engagement === 'pilot' ? BILL.pilotFee : BILL.fullFee;
  const sku =
    opts.engagement === 'full' && opts.skuCount > 0 ? calcSkuAnnualFee(opts.skuCount) : null;
  const crm =
    opts.crmOn && opts.crmSeats > 0
      ? calcCrmBilling(opts.crmRate, opts.crmSeats, opts.crmCycle === 'annual')
      : null;
  const skuTotal = sku && !('negotiated' in sku && sku.negotiated) ? sku.total : 0;
  const crmTotal = crm?.total ?? 0;
  return {
    onboardingFee,
    sku,
    crm,
    grandTotal: bill.billableTotal || onboardingFee + skuTotal + crmTotal,
    bill,
  };
}

export function calcCrmBilling(rate: number, seats: number, annual: boolean) {
  const tierNames: Record<number, string> = {
    5000: 'Sales Navigator',
    12000: 'Sales Navigator Plus',
    15000: 'CRM Field',
    22000: 'CRM Depot',
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
