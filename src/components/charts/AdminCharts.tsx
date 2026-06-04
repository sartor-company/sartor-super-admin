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

export function PlatformScanChart({ height = 190 }: { height?: number }) {
  return (
    <ChartBox height={height}>
      <Line
        data={{
          labels: DAY_LABELS_14,
          datasets: [{
            data: SCAN_VOLUME_DATA,
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

export function RevenueBarChart({ height = 190 }: { height?: number }) {
  return (
    <ChartBox height={height}>
      <Bar
        data={{
          labels: MONTH_LABELS,
          datasets: [{
            data: REVENUE_MONTHLY_DATA,
            backgroundColor: REVENUE_BAR_COLORS,
            borderRadius: 4,
          }],
        }}
        options={barChartOptions}
      />
    </ChartBox>
  );
}

export function RevenueDonutChart({ height = 145 }: { height?: number }) {
  return (
    <ChartBox height={height}>
      <Doughnut
        data={{
          labels: ['SKU', 'Credits', 'CRM', 'Onboarding'],
          datasets: [{ data: DONUT_VALUES, backgroundColor: DONUT_COLORS, borderWidth: 0 }],
        }}
        options={doughnutOptions}
      />
    </ChartBox>
  );
}

export function OpsHealthChart({ height = 160 }: { height?: number }) {
  return (
    <ChartBox height={height}>
      <Bar
        data={{
          labels: DAY_LABELS_14,
          datasets: [{
            data: [100, 100, 99.8, 100, 100, 99.9, 100, 100, 100, 99.7, 100, 100, 100, 100],
            backgroundColor: '#1A2D7C',
            borderRadius: 3,
            barThickness: 12,
          }],
        }}
        options={{
          ...barChartOptions,
          scales: {
            ...barChartOptions.scales,
            y: { ...barChartOptions.scales?.y, min: 99, max: 100.1 },
          },
        }}
      />
    </ChartBox>
  );
}
