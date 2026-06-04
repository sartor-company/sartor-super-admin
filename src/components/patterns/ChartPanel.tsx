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

const CHARTS: Record<ChartPanelKind, React.ComponentType<{ height?: number }>> = {
  'platform-scan': PlatformScanChart,
  'revenue-bar': RevenueBarChart,
  'revenue-donut': RevenueDonutChart,
  'ops-health': OpsHealthChart,
};

export function ChartPanel({
  title,
  chart,
  height = 190,
  action,
  marginBottom = 0,
}: {
  title: string;
  chart: ChartPanelKind;
  height?: number;
  action?: ReactNode;
  marginBottom?: number;
}) {
  const ChartView = CHARTS[chart];
  return (
    <Card style={{ marginBottom }}>
      <CardHeader title={title} action={action} />
      <ChartView height={height} />
    </Card>
  );
}
