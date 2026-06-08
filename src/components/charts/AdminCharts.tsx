import type { ReactNode } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './chartSetup';
import {
  barChartOptions,
  DAY_LABELS_14,
  DONUT_COLORS,
  DONUT_VALUES,
  doughnutOptions,
  lineChartOptions,
  MONTH_LABELS,
  REVENUE_BAR_COLORS,
  REVENUE_MONTHLY_DATA,
  SCAN_VOLUME_DATA,
} from './chartConfig';

function ChartBox({ height, children }: { height: number; children: ReactNode }) {
  return <div style={{ position: 'relative', height, width: '100%' }}>{children}</div>;
}

type SeriesProps = {
  height?: number;
  labels?: string[];
  values?: number[];
};

export function PlatformScanChart({ height = 190, labels, values }: SeriesProps) {
  const data = values ?? SCAN_VOLUME_DATA;
  const lbls = labels ?? DAY_LABELS_14;
  return (
    <ChartBox height={height}>
      <Line
        data={{
          labels: lbls,
          datasets: [{
            data,
            borderColor: '#FF5C35',
            backgroundColor: 'rgba(255,92,53,.07)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          }],
        }}
        options={lineChartOptions}
      />
    </ChartBox>
  );
}

export function RevenueBarChart({
  height = 190,
  labels,
  values,
  colors,
}: SeriesProps & { colors?: string[] }) {
  const data = values ?? REVENUE_MONTHLY_DATA;
  const lbls = labels ?? MONTH_LABELS;
  const bg = colors ?? REVENUE_BAR_COLORS;
  return (
    <ChartBox height={height}>
      <Bar
        data={{
          labels: lbls,
          datasets: [{
            data,
            backgroundColor: bg,
            borderRadius: 4,
          }],
        }}
        options={barChartOptions}
      />
    </ChartBox>
  );
}

export function RevenueDonutChart({
  height = 145,
  labels,
  values,
}: SeriesProps) {
  const data = values ?? DONUT_VALUES;
  const lbls = labels ?? ['SKU', 'Credits', 'CRM', 'Onboarding'];
  return (
    <ChartBox height={height}>
      <Doughnut
        data={{
          labels: lbls,
          datasets: [{ data, backgroundColor: DONUT_COLORS, borderWidth: 0 }],
        }}
        options={doughnutOptions}
      />
    </ChartBox>
  );
}

export function OpsHealthChart({ height = 160, labels, values }: SeriesProps) {
  const data =
    values ??
    [100, 100, 99.8, 100, 100, 99.9, 100, 100, 100, 99.7, 100, 100, 100, 100];
  const lbls = labels ?? DAY_LABELS_14;
  const min = Math.min(95, ...data) - 0.5;
  return (
    <ChartBox height={height}>
      <Bar
        data={{
          labels: lbls,
          datasets: [{
            data,
            backgroundColor: '#1A2D7C',
            borderRadius: 3,
            barThickness: 12,
          }],
        }}
        options={{
          ...barChartOptions,
          plugins: {
            ...barChartOptions.plugins,
            tooltip: {
              callbacks: {
                label: (ctx) => `${Number(ctx.raw).toFixed(1)}%`,
              },
            },
          },
          scales: {
            ...barChartOptions.scales,
            y: { ...barChartOptions.scales?.y, min, max: 100.1 },
          },
        }}
      />
    </ChartBox>
  );
}
