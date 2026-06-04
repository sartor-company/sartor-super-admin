import type { Client } from '../data/clients';

export function scPillVariant(band: Client['scband']): string {
  if (band === 'Pilot') return 'pilot';
  if (band === 'Starter') return 'starter';
  return 'growth';
}

export function crmPillVariant(crm: string | null): string | null {
  if (!crm) return null;
  if (crm.includes('360')) return '360';
  if (crm.includes('+')) return 'snp';
  return 'sn';
}

export function crmPillLabel(crm: string | null): string | null {
  if (!crm) return null;
  if (crm.includes('360')) return 'CRM 360';
  if (crm.includes('+')) return 'Sales Nav+';
  return 'Sales Nav';
}

export function authColor(rate: string): string | undefined {
  if (rate === '—') return 'var(--text3)';
  const n = parseFloat(rate);
  if (n >= 95) return 'var(--gt)';
  if (n >= 90) return 'var(--at)';
  return 'var(--rt)';
}
