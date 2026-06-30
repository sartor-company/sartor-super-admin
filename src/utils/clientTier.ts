import type { Client, CrmTierType } from '../data/clients';
import { BILL, computeBill, crmAnnualTotal, type CrmCycle, type EngagementType } from './pricing';
import { formatNaira } from './format';

export type ClientTierProfile = {
  hasAuth: boolean;
  hasCrm: boolean;
  crmTier: CrmTierType | null;
  tierLabel: string;
  engagementLabel: string;
  billingCycleLabel: string;
  domainTierLabel: string;
  seatSummary: string;
  subscriptionTitle: string;
  subscriptionSubtitle: string;
  subscriptionPrice: string;
  monthlyCrm: number;
  showSkuTab: boolean;
  showConfigTab: boolean;
  showScCredits: boolean;
};

export function normalizeCrmTier(client: Client): CrmTierType | null {
  if (client.crmTierType) return client.crmTierType;
  const c = (client.crm || '').toLowerCase();
  if (c.includes('360')) return '360';
  if (c.includes('depot')) return 'depot';
  if (c.includes('field')) return 'field';
  return client.crmEnabled ? 'field' : null;
}

/** SC+DORA auth surface (SKUs, credits, domain config). CRM 360 includes auth. */
export function clientHasAuth(client: Client): boolean {
  const tier = normalizeCrmTier(client);
  if (tier === '360') return true;
  if (client.services?.scdora === false) return false;
  return client.scEnabled !== false;
}

export function clientTierLabel(client: Client): string {
  const tier = normalizeCrmTier(client);
  const hasAuth = clientHasAuth(client);
  const hasCrm = !!(client.crmEnabled || client.crm);
  const cycle = client.crmBillingCycle === 'annual' ? 'annual' : 'monthly';

  if (tier === '360') {
    return `Sartor CRM 360 · Full Bundle (${cycle})`;
  }
  if (hasCrm && tier === 'field') return 'Sartor CRM Field';
  if (hasCrm && tier === 'depot') return 'Sartor CRM Depot';
  if (hasAuth) {
    if (client.engagement === 'pilot' || client.scband === 'Pilot') {
      return 'Sartor-Chain & DORA AI · Pilot (90-day)';
    }
    return 'Sartor-Chain & DORA AI · Full Deployment';
  }
  return client.products && client.products !== '—' ? client.products : '—';
}

function engagementLabel(client: Client): string {
  if (client.engagement === 'pilot' || client.scband === 'Pilot') return 'Pilot Programme';
  if (client.engagement === 'full') return 'Full Deployment';
  return 'Full Deployment';
}

function domainTierLabel(client: Client): string {
  const t = (client.domainTier || 'starter').toLowerCase();
  if (t === 'enterprise') return 'Enterprise';
  if (t === 'growth') return 'Growth';
  return 'Starter';
}

function seatSummary(client: Client, tier: CrmTierType | null): string {
  const rev = client.crmSeats ?? 0;
  const op = client.crmOpSeats ?? 0;
  if (tier === '360') return 'Unlimited seats';
  if (tier === 'depot') return `${rev} rev${rev !== 1 ? 's' : ''} + ${op} op`;
  if (tier === 'field') return `${rev} revenue seat${rev !== 1 ? 's' : ''}`;
  return '—';
}

function subscriptionFromBill(
  client: Client,
  tier: CrmTierType | null,
  hasAuth: boolean,
  hasCrm: boolean,
  cycle: CrmCycle,
  engagement: EngagementType,
  revSeats: number,
  opSeats: number,
): Pick<ClientTierProfile, 'subscriptionTitle' | 'subscriptionSubtitle' | 'subscriptionPrice' | 'monthlyCrm'> {
  const services =
    tier === '360'
      ? { scdora: true, crm: true }
      : hasCrm && !hasAuth
        ? { scdora: false, crm: true }
        : { scdora: hasAuth, crm: hasCrm };

  const bill = computeBill({
    company: client.name,
    services,
    engagement,
    pilotConvert: false,
    crmTier: tier || 'field',
    revSeats: Math.max(revSeats, tier === 'depot' ? 5 : tier === 'field' ? 3 : 0),
    opSeats,
    crmCycle: cycle,
    domainUpgrade: 'none',
    addCredits: [],
  });

  if (tier === '360') {
    const annual = cycle === 'annual';
    if (annual) {
      const total = bill.billableTotal;
      return {
        subscriptionTitle: 'CRM 360 — Full Bundle',
        subscriptionSubtitle: 'SC+DORA AI · CRM 360 · annual (−20%)',
        subscriptionPrice: `${formatNaira(total)}/yr`,
        monthlyCrm: total / 12,
      };
    }
    return {
      subscriptionTitle: 'CRM 360 — Full Bundle',
      subscriptionSubtitle: 'SC+DORA AI · CRM 360 · monthly',
      subscriptionPrice: `${formatNaira(bill.monthly)}/mo`,
      monthlyCrm: bill.monthly,
    };
  }

  if (tier === 'field') {
    const mo = revSeats * BILL.crmField;
    return {
      subscriptionTitle: 'Sartor CRM Field',
      subscriptionSubtitle: `${revSeats} revenue seats`,
      subscriptionPrice: `${formatNaira(mo)}/mo`,
      monthlyCrm: mo,
    };
  }

  if (tier === 'depot') {
    const mo = revSeats * BILL.crmDepotRev + opSeats * BILL.crmDepotOp;
    return {
      subscriptionTitle: 'Sartor CRM Depot',
      subscriptionSubtitle: `${revSeats} rev + ${opSeats} op seats`,
      subscriptionPrice: `${formatNaira(mo)}/mo`,
      monthlyCrm: mo,
    };
  }

  if (hasAuth) {
    if (engagement === 'pilot') {
      return {
        subscriptionTitle: 'Sartor-Chain & DORA AI',
        subscriptionSubtitle: 'Pilot Programme (90-day)',
        subscriptionPrice: formatNaira(BILL.pilotFee),
        monthlyCrm: 0,
      };
    }
    return {
      subscriptionTitle: 'Sartor-Chain & DORA AI',
      subscriptionSubtitle: 'Full Deployment · Year 1 onboarding',
      subscriptionPrice: formatNaira(BILL.fullFee),
      monthlyCrm: 0,
    };
  }

  return {
    subscriptionTitle: clientTierLabel(client),
    subscriptionSubtitle: '',
    subscriptionPrice: '—',
    monthlyCrm: 0,
  };
}

export function deriveClientTierProfile(
  client: Client,
  extra?: { lpoCount?: number; leadCount?: number; teamCount?: number },
): ClientTierProfile {
  const hasAuth = clientHasAuth(client);
  const hasCrm = !!(client.crmEnabled || client.crm);
  const crmTier = hasCrm ? normalizeCrmTier(client) : null;
  const cycle: CrmCycle = client.crmBillingCycle === 'annual' ? 'annual' : 'monthly';
  const engagement: EngagementType =
    client.engagement === 'full' || client.scband !== 'Pilot' ? 'full' : 'pilot';
  const revSeats = client.crmSeats ?? 0;
  const opSeats = client.crmOpSeats ?? 0;

  const sub = subscriptionFromBill(client, crmTier, hasAuth, hasCrm, cycle, engagement, revSeats, opSeats);

  let billingCycleLabel = '—';
  if (crmTier) {
    billingCycleLabel = cycle === 'annual' ? 'Annual (20% off)' : 'Monthly';
  } else if (client.engagement === 'pilot' || client.scband === 'Pilot') {
    billingCycleLabel = 'Pilot (one-off)';
  } else if (hasAuth) {
    billingCycleLabel = 'One-off + SKU licences (Yr 2+)';
  }

  return {
    hasAuth,
    hasCrm,
    crmTier,
    tierLabel: clientTierLabel(client),
    engagementLabel: hasAuth ? engagementLabel(client) : clientTierLabel(client),
    billingCycleLabel,
    domainTierLabel: domainTierLabel(client),
    seatSummary: seatSummary(client, crmTier),
    ...sub,
    showSkuTab: hasAuth,
    showConfigTab: hasAuth,
    showScCredits: hasAuth,
  };
}

export function crmBillingDetail(
  profile: ClientTierProfile,
  revSeats: number,
): { seats: string; rate: string; monthly: string; annual: string } {
  if (profile.crmTier === '360') {
    const mo = profile.monthlyCrm;
    const { yearlyDue } = crmAnnualTotal(mo);
    return {
      seats: 'Unlimited',
      rate: `${formatNaira(BILL.crm360Annual / 12)}/mo (bundle)`,
      monthly: formatNaira(mo),
      annual: formatNaira(yearlyDue),
    };
  }
  if (profile.crmTier === 'field') {
    const mo = revSeats * BILL.crmField;
    const { yearlyDue } = crmAnnualTotal(mo);
    return {
      seats: String(revSeats),
      rate: `${formatNaira(BILL.crmField)}/seat/mo`,
      monthly: formatNaira(mo),
      annual: formatNaira(yearlyDue),
    };
  }
  if (profile.crmTier === 'depot') {
    const rev = revSeats * BILL.crmDepotRev;
    const op = (profile.monthlyCrm - rev) || 0;
    const { yearlyDue } = crmAnnualTotal(profile.monthlyCrm);
    return {
      seats: `${revSeats} rev + ${Math.round(op / BILL.crmDepotOp)} op`,
      rate: `${formatNaira(BILL.crmDepotRev)} rev · ${formatNaira(BILL.crmDepotOp)} op`,
      monthly: formatNaira(profile.monthlyCrm),
      annual: formatNaira(yearlyDue),
    };
  }
  return { seats: '—', rate: '—', monthly: '—', annual: '—' };
}
