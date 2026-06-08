import type { ReactNode } from 'react';
import {
  OpsHealthChart,
  PlatformScanChart,
  RevenueBarChart,
  RevenueDonutChart,
} from '../charts/AdminCharts';
import { Card, CardHeader } from '../ui/Card';

export type ChartPanelKind =
  | 'platform-scan'
  | 'revenue-bar'
  | 'revenue-donut'
  | 'ops-health';

export type ChartSeries = {
  labels?: string[];
  values?: number[];
  colors?: string[];
};

export function ChartPanel({
  title,
  chart,
  height = 190,
  action,
  marginBottom = 0,
  series,
}: {
  title: string;
  chart: ChartPanelKind;
  height?: number;
  action?: ReactNode;
  marginBottom?: number;
  series?: ChartSeries;
}) {
  const props = { height, ...series };
  const ChartView =
    chart === 'platform-scan'
      ? PlatformScanChart
      : chart === 'revenue-bar'
        ? RevenueBarChart
        : chart === 'revenue-donut'
          ? RevenueDonutChart
          : OpsHealthChart;

  return (
    <Card style={{ marginBottom }}>
      <CardHeader title={title} action={action} />
      <ChartView {...props} />
    </Card>
  );
}
