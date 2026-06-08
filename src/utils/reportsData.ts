import type { Client } from '../data/clients';
import type { InvestigationRow } from '../data/investigations';
import { crmSeatRate, isCreditSaleInvoice, type PlatformInvoiceRow } from './financeDisplay';

export function filterClientsByName(clients: Client[], filter: string): Client[] {
  if (filter === 'All Clients') return clients;
  return clients.filter((c) => c.name === filter || c.name.includes(filter));
}

export type RevenueClientRow = {
  name: string;
  code: string;
  total: number;
  crm: number;
  credits: number;
  other: number;
  share: number;
};

export function revenueByClient(invoices: PlatformInvoiceRow[]): RevenueClientRow[] {
  const map = new Map<string, RevenueClientRow>();

  for (const inv of invoices.filter((i) => i.status === 'Paid')) {
    const key = inv.clientCode || inv.clientName || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        name: inv.clientName || key,
        code: inv.clientCode || '',
        total: 0,
        crm: 0,
        credits: 0,
        other: 0,
        share: 0,
      });
    }
    const row = map.get(key)!;
    row.total += inv.amount;
    const d = (inv.description || '').toLowerCase();
    if (d.includes('crm')) row.crm += inv.amount;
    else if (isCreditSaleInvoice(inv.description)) row.credits += inv.amount;
    else row.other += inv.amount;
  }

  const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0) || 1;
  return rows.map((r) => ({ ...r, share: (r.total / grandTotal) * 100 }));
}

export function countForClient(
  items: { clientCode?: string; clientName?: string; client?: string }[],
  client: Client,
): number {
  return items.filter(
    (i) =>
      i.clientCode === client.code ||
      i.clientName === client.name ||
      i.client === client.name ||
      (i.clientName && client.name.includes(i.clientName)),
  ).length;
}

export function openTicketsForClient(
  tickets: Record<string, unknown>[],
  client: Client,
): number {
  return tickets.filter((t) => {
    const status = String(t.status || '');
    if (status === 'Closed' || status === 'Resolved') return false;
    return (
      t.clientCode === client.code ||
      t.clientName === client.name ||
      (typeof t.clientName === 'string' && client.name.includes(t.clientName))
    );
  }).length;
}

export function investigationsForClient(
  investigations: InvestigationRow[],
  client: Client,
): number {
  return investigations.filter(
    (i) =>
      i.client === client.name ||
      i.clientShort === client.name.split(' ')[0] ||
      client.name.includes(i.clientShort),
  ).length;
}

export function invoiceDaysOverdue(dueAt?: number, status?: string): number | null {
  if (!dueAt || status === 'Paid' || status === 'Cancelled') return null;
  const days = Math.floor((Date.now() - dueAt) / 86400000);
  return days > 0 ? days : null;
}

export function invoiceDaysUntilDue(dueAt?: number, status?: string): number | null {
  if (!dueAt || status === 'Paid' || status === 'Overdue' || status === 'Cancelled') return null;
  const days = Math.floor((dueAt - Date.now()) / 86400000);
  return days >= 0 ? days : null;
}

export function crmMonthlyTotal(client: Client): number {
  const rate = crmSeatRate(client.crm);
  const seats = 10;
  return rate * seats;
}

export function creditHealthColor(label: string): string {
  if (label.toLowerCase().includes('critical') || label.toLowerCase().includes('low')) {
    return 'var(--rt)';
  }
  if (label.toLowerCase().includes('warning')) return 'var(--at)';
  return 'var(--gt)';
}
