import type { BadgeVariant } from '../types';
import { formatNaira } from './format';

export interface PlatformInvoiceRow {
  _id: string;
  invoiceId: string;
  admin?: string;
  clientCode?: string;
  clientName?: string;
  description?: string;
  amount: number;
  status: string;
  issuedAt?: number;
  dueAt?: number;
  paidAt?: number;
  lineItems?: { desc?: string; amt?: number; type?: string }[];
  revenueType?: string;
  revenueLabel?: string;
  revenueVariant?: string;
  lineCount?: number;
  usdEquivalent?: number;
}

export function invoiceStatusVariant(status: string): BadgeVariant {
  if (status === 'Overdue') return 'br';
  if (status === 'Due Soon') return 'ba';
  if (status === 'Paid') return 'bg';
  if (status === 'Cancelled') return 'bx';
  return 'bx';
}

export function formatInvoiceDate(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

export function formatDueLabel(ts?: number, status?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const label = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  if (status === 'Overdue') return `${label} (overdue)`;
  return label;
}

export function formatInvoiceAmount(amount: number): string {
  return formatNaira(amount);
}

export function isCreditSaleInvoice(desc?: string): boolean {
  if (!desc) return false;
  const d = desc.toLowerCase();
  return (
    d.includes('sms') ||
    d.includes('pin') ||
    d.includes('credit') ||
    d.includes('batch') ||
    d.includes('calibration')
  );
}

export function crmSeatRate(tier: string | null): number {
  if (!tier) return 0;
  const t = tier.toLowerCase();
  if (t.includes('360')) return 25000;
  if (t.includes('+') || t.includes('plus') || t.includes('nav+')) return 12000;
  if (t.includes('nav')) return 5000;
  return 5000;
}

export function parseSeatsFromDescription(desc?: string): number | null {
  if (!desc) return null;
  const m = desc.match(/\((\d+)\s*seats?\)/i);
  return m ? Number(m[1]) : null;
}

export function revenueBadgeVariant(variant?: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    accent: 'bp',
    ba: 'ba',
    bgold: 'bgold',
    bb: 'bb',
    bg: 'bg',
    bp: 'bp',
    bx: 'bx',
  };
  return map[variant || ''] || 'bx';
}

export function formatUsd(ngnAmount: number, usdFromApi?: number): string {
  const usd = usdFromApi ?? Math.round(ngnAmount * 0.00063);
  return `$${usd.toLocaleString()}`;
}
