import type { ChartOptions } from 'chart.js';

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY_LABELS_14 = Array.from({ length: 14 }, (_, i) => `Apr ${i + 1}`);

export const REVENUE_BAR_COLORS = [
  '#0B1640', '#0B1640', '#0B1640', '#FF5C35', '#E8EAF2', '#E8EAF2', '#E8EAF2',
  '#E8EAF2', '#E8EAF2', '#E8EAF2', '#E8EAF2', '#E8EAF2',
];

export const REVENUE_MONTHLY_DATA = [7200000, 8100000, 9400000, 8750000, 0, 0, 0, 0, 0, 0, 0, 0];

export const SCAN_VOLUME_DATA = [
  8200, 9400, 11200, 8800, 14100, 12700, 10400, 15200, 14800, 17400, 19100, 17600, 21000, 22800,
];

export const DONUT_COLORS = ['#0B1640', '#FF5C35', '#1DB87A', '#C4860A'];
export const DONUT_VALUES = [55, 22, 12, 11];

const axisTicks = {
  x: { grid: { display: false }, ticks: { color: '#8A92B0', font: { size: 10 }, maxTicksLimit: 7 } },
  y: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { color: '#8A92B0', font: { size: 10 } } },
};

export const lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: axisTicks,
};

export const barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `₦${Number(ctx.raw).toLocaleString('en-NG')}`,
      },
    },
  },
  scales: axisTicks,
};

export const doughnutOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: { legend: { display: false } },
};
