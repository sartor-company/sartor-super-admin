import type { BadgeVariant } from './index';

export type DoraQueueRow = {
  _id: string;
  adminId?: string;
  batch: string;
  client: string;
  product: string;
  labelType: string;
  images: string;
  status?: string;
  waiting: string;
  waitingDays?: number;
  sla: string;
  slaVariant: BadgeVariant;
  stage?: 'awaiting' | 'training' | 'review';
};
