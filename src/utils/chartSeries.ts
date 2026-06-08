import { DONUT_COLORS, MONTH_LABELS, REVENUE_BAR_COLORS } from '../components/charts/chartConfig';
import type { PlatformInvoiceRow } from './financeDisplay';

export type PlatformCharts = {
  scanVolume?: { label: string; count: number }[];
  healthTimeline?: { label: string; pct: number }[];
  monthlyRevenue?: { label: string; total: number }[];
  revenueBreakdown?: { sku: number; credits: number; crm: number; onboarding: number };
};

export function revenueSeriesFromInvoices(invoices: PlatformInvoiceRow[]) {
  const year = new Date().getFullYear();
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(year, i, 1).getTime();
    const end = new Date(year, i + 1, 1).getTime();
    const total = invoices
      .filter((inv) => inv.status === 'Paid')
      .filter((inv) => {
        const ts = inv.paidAt || inv.issuedAt;
        return ts && ts >= start && ts < end;
      })
      .reduce((s, inv) => s + inv.amount, 0);
    return total;
  });

  return {
    labels: [...MONTH_LABELS],
    values: monthly,
    colors: monthly.map((v, i) =>
      v > 0 ? (i === new Date().getMonth() ? '#FF5C35' : '#0B1640') : '#E8EAF2',
    ),
  };
}

export function donutFromBreakdown(breakdown?: PlatformCharts['revenueBreakdown']) {
  if (!breakdown) {
    return {
      labels: ['SKU / Other', 'Credits', 'CRM', 'Onboarding'],
      values: [0, 0, 0, 0],
      legend: DONUT_COLORS.map((color, i) => ({
        color,
        label: ['SKU / Other', 'Credits', 'CRM', 'Onboarding'][i],
        pct: '0%',
      })),
    };
  }

  const values = [breakdown.sku, breakdown.credits, breakdown.crm, breakdown.onboarding];
  const total = values.reduce((s, v) => s + v, 0) || 1;
  const labels = ['SKU / Other', 'Credit Bundles', 'CRM Subscriptions', 'Onboarding Fees'];

  return {
    labels,
    values,
    legend: labels.map((label, i) => ({
      color: DONUT_COLORS[i],
      label,
      pct: `${Math.round((values[i] / total) * 100)}%`,
    })),
  };
}

export function revenueSeriesFromCharts(charts: PlatformCharts | null) {
  if (!charts?.monthlyRevenue?.length) return null;
  const values = charts.monthlyRevenue.map((m) => m.total);
  const labels = charts.monthlyRevenue.map((m) => m.label);
  return {
    labels,
    values,
    colors: values.map((v, i) =>
      v > 0 ? (i === new Date().getMonth() ? '#FF5C35' : '#0B1640') : '#E8EAF2',
    ),
  };
}

export function scanSeriesFromCharts(charts: PlatformCharts | null) {
  if (!charts?.scanVolume?.length) return null;
  return {
    labels: charts.scanVolume.map((d) => d.label),
    values: charts.scanVolume.map((d) => d.count),
  };
}

export function healthSeriesFromCharts(charts: PlatformCharts | null) {
  if (!charts?.healthTimeline?.length) return null;
  return {
    labels: charts.healthTimeline.map((d) => d.label),
    values: charts.healthTimeline.map((d) => d.pct),
  };
}

export { REVENUE_BAR_COLORS };
