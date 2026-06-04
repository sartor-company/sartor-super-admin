import type { BadgeVariant } from '../types';

export type QueueAwaitingRow = {
  batch: string;
  client: string;
  clientFollowUp: string;
  product: string;
  labelType: string;
  images: string;
  waiting: string;
  waitingColor?: string;
  sla: string;
  slaVariant: BadgeVariant;
  followUpMessage: string;
};

export const QUEUE_AWAITING: QueueAwaitingRow[] = [
  {
    batch: 'BATCH-DP-042',
    client: 'DankePharma',
    clientFollowUp: 'DankePharma Ltd',
    product: 'Paracetamol 500mg',
    labelType: '2-Sided',
    images: 'None',
    waiting: '6 days',
    waitingColor: 'var(--rt)',
    sla: 'Breached',
    slaVariant: 'br',
    followUpMessage: 'BATCH-DP-042 images 6 days overdue.',
  },
  {
    batch: 'BATCH-NK-018',
    client: 'NaturalKing',
    clientFollowUp: 'NaturalKing FMCG',
    product: 'Body Cream 200ml',
    labelType: 'Round',
    images: 'None',
    waiting: '4 days',
    waitingColor: 'var(--at)',
    sla: 'Due today',
    slaVariant: 'ba',
    followUpMessage: 'BATCH-NK-018 images required.',
  },
  {
    batch: 'BATCH-FN-002',
    client: 'FreshNow',
    clientFollowUp: 'FreshNow Consumer',
    product: 'Liquid Soap 500ml',
    labelType: '2-Sided',
    images: 'None',
    waiting: '3 days',
    waitingColor: 'var(--at)',
    sla: 'OK',
    slaVariant: 'bx',
    followUpMessage: 'BATCH-FN-002 images required.',
  },
  {
    batch: 'BATCH-SH-041',
    client: 'Sartor Health',
    clientFollowUp: 'Sartor Health Co. Ltd',
    product: 'Carabiner Holder',
    labelType: '2-Sided',
    images: 'None',
    waiting: '1 day',
    sla: 'OK',
    slaVariant: 'bx',
    followUpMessage: 'BATCH-SH-041 images required.',
  },
];

export const QUEUE_TRAINING = [
  { batch: 'BATCH-BH-031', client: 'Bright Home', product: 'Laundry Detergent 1kg', progress: 65, started: 'May 10', eta: 'May 13', status: 'Training', statusVariant: 'bp' as const },
  { batch: 'BATCH-DP-039', client: 'DankePharma', product: 'Vitamin C Tablets', progress: 30, started: 'May 11', eta: 'May 15', status: 'Training', statusVariant: 'bp' as const },
  { batch: 'BATCH-NK-016', client: 'NaturalKing', product: 'Shea Butter 100g', progress: 88, progressColor: 'var(--green)', started: 'May 10', eta: 'Today', status: 'Nearly done', statusVariant: 'bg' as const },
];

export const QUEUE_REVIEW = [
  { batch: 'BATCH-NK-014', client: 'NaturalKing', product: 'Hair Oil 100ml', score: 58, issue: 'F3 below threshold. Possible label variation.', issueColor: 'var(--rt)' },
  { batch: 'BATCH-FN-001', client: 'FreshNow', product: 'Hand Wash 250ml', score: 62, issue: 'F1 score low. Insufficient image resolution.', issueColor: 'var(--at)' },
];
