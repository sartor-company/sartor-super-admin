import type { CSSProperties } from 'react';
import type { Client } from '../data/clients';

export type SubscriptionPill = {
  key: string;
  className: string;
  label: string;
  style?: CSSProperties;
};

export function hasScDora(client: Client): boolean {
  return client.services?.scdora !== false && client.scEnabled !== false;
}

export function subscriptionPills(client: Client): SubscriptionPill[] {
  const pills: SubscriptionPill[] = [];
  const hasSc = hasScDora(client);
  const hasCrm = !!client.crmEnabled && !!client.crm;
  const isPilot = client.scband === 'Pilot' || client.engagement === 'pilot';

  if (hasCrm) {
    const c = (client.crm || '').toLowerCase();
    if (c.includes('360')) {
      pills.push({ key: 'crm', className: 'tier-pill tier-360', label: 'CRM 360' });
    } else if (c.includes('depot') || c.includes('plus') || c.includes('nav+')) {
      pills.push({ key: 'crm', className: 'tier-pill tier-snp', label: 'CRM Depot' });
    } else {
      pills.push({ key: 'crm', className: 'tier-pill tier-sn', label: 'CRM Field' });
    }
  }

  if (hasSc) {
    const isC360 =
      hasCrm &&
      ((client.crm || '').toLowerCase().includes('360') || client.crmTierType === '360');
    if (hasCrm && !isC360) {
      pills.push({ key: 'sc-addon', className: 'tier-pill tier-sc', label: '+ SC-DORA SKUs' });
    } else {
      pills.push({
        key: 'sc',
        className: 'tier-pill tier-sc',
        label: isPilot ? 'SC-DORA · Pilot' : 'SC-DORA Full',
        style: isPilot ? { background: '#fef3e2', color: 'var(--at)' } : undefined,
      });
    }
  }

  return pills;
}

export function clientSkuLeadsLabel(client: Client): string {
  const hasSc = hasScDora(client);
  const hasCrm = !!client.crmEnabled;
  const leads = client.leadCount ?? 0;

  if (client.engagement === 'pilot' && client.pilotDaysTotal) {
    const remaining = client.pilotDaysRemaining ?? 0;
    const skuPart = client.skus ? `${client.skus} SKUs · ` : '';
    return `${skuPart}${remaining} of ${client.pilotDaysTotal} pilot days`;
  }

  if (hasSc && (client.skus ?? 0) > 0) {
    if (leads > 0) return `${client.skus} SKUs · ${leads} leads`;
    return `${client.skus} SKUs`;
  }
  if (hasCrm) {
    const seats = client.crmSeats ?? 0;
    if (leads > 0) return `${seats} seats · ${leads} leads`;
    return seats > 0 ? `${seats} seats` : leads > 0 ? `${leads} leads` : '—';
  }
  return client.skus ? `${client.skus} SKUs` : '—';
}

export function amTierLabel(client: Client): string {
  if (client.crm) {
    const c = client.crm.toLowerCase();
    if (c.includes('360')) return 'CRM 360';
    if (c.includes('depot')) return 'CRM Depot';
    if (c.includes('field')) return 'CRM Field';
  }
  if (client.scband === 'Pilot') return `Full · ${client.scband}`;
  return client.scband || 'Growth';
}

export function clientsForAccountManager(clients: Client[], managerName?: string): Client[] {
  const name = managerName?.trim();
  if (!name) return clients;
  const assigned = clients.filter((c) => (c.am || '').toLowerCase() === name.toLowerCase());
  return assigned;
}

export function scPillVariant(band: Client['scband']): string {
  if (band === 'Pilot') return 'pilot';
  if (band === 'Starter') return 'starter';
  return 'growth';
}

export function crmPillVariant(crm: string | null): string | null {
  if (!crm) return null;
  const c = crm.toLowerCase();
  if (c.includes('360')) return '360';
  if (c.includes('depot') || c.includes('nav+') || c.includes('plus')) return 'snp';
  if (c.includes('field') || c.includes('navigator') || c.includes('nav')) return 'sn';
  return 'sn';
}

export function crmPillLabel(crm: string | null): string | null {
  if (!crm) return null;
  const c = crm.toLowerCase();
  if (c.includes('360')) return 'CRM 360';
  if (c.includes('depot')) return 'CRM Depot';
  if (c.includes('field')) return 'CRM Field';
  if (c.includes('+') || c.includes('plus')) return 'Sales Nav+';
  if (c.includes('navigator') || c.includes('nav')) return 'Sales Nav';
  return crm;
}

export function authColor(rate: string): string | undefined {
  if (rate === '—') return 'var(--text3)';
  const n = parseFloat(rate);
  if (n >= 95) return 'var(--gt)';
  if (n >= 90) return 'var(--at)';
  return 'var(--rt)';
}

/** Tier pill class for client detail header (prototype v3-3) */
export function tierPillClass(client: Client): string {
  const crm = (client.crm || '').toLowerCase();
  if (crm.includes('360') || client.crmTierType === '360') return 'tier-360';
  if (crm.includes('depot') || client.crmTierType === 'depot') return 'tier-snp';
  if (crm.includes('field') || client.crmTierType === 'field') return 'tier-sn';
  return 'tier-sc';
}
