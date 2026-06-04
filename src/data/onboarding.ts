export type OnboardingRow = {
  client: string;
  product: string;
  productLabel: string;
  step: string;
  progress: number;
  progressColor?: string;
  blocker: string;
  blockerColor?: string;
  assigned: string;
  assignedColor?: string;
  started: string;
  followUpMessage?: string;
  viewClientCode?: string;
  action: 'followup' | 'view' | 'assign';
};

export const ONBOARDING_PIPELINE: OnboardingRow[] = [
  {
    client: 'FreshNow Consumer',
    product: 'pilot',
    productLabel: 'SC·Pilot',
    step: '3/4',
    progress: 75,
    progressColor: 'var(--amber)',
    blocker: 'Images missing',
    blockerColor: 'var(--at)',
    assigned: 'Amaka Eze',
    started: 'Apr 19',
    followUpMessage: 'DORA reference images required.',
    action: 'followup',
  },
  {
    client: 'PharmaPlus Ltd',
    product: 'growth',
    productLabel: 'SC·Growth',
    step: '2/4',
    progress: 50,
    blocker: 'None',
    blockerColor: 'var(--text3)',
    assigned: 'Emeka Nnaji',
    started: 'Apr 24',
    viewClientCode: 'SHC',
    action: 'view',
  },
  {
    client: 'CoolBreeze FMCG',
    product: 'starter',
    productLabel: 'SC·Starter',
    step: '1/4',
    progress: 25,
    progressColor: 'var(--blue)',
    blocker: 'Unassigned',
    blockerColor: 'var(--rt)',
    assigned: 'Unassigned',
    assignedColor: 'var(--rt)',
    started: 'Apr 26',
    action: 'assign',
  },
];

export const OPS_ONBOARDING_ROWS = ONBOARDING_PIPELINE.map((r) => ({
  ...r,
  stepDetail: r.step === '3/4' ? '3/4 — DORA images' : r.step === '2/4' ? '2/4 — SKU setup' : '1/4 — Account setup',
  status: r.action === 'followup' ? 'Blocked' : r.action === 'view' ? 'In Progress' : 'New',
  statusVariant: (r.action === 'followup' ? 'ba' : r.action === 'view' ? 'bg' : 'bb') as 'ba' | 'bg' | 'bb',
  age: r.started === 'Apr 19' ? '8d' : r.started === 'Apr 24' ? '3d' : '1d',
}));
