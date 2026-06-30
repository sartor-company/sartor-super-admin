import type { InvestigationDetail } from '../types';

export type InvestigationRow = InvestigationDetail & {
  clientShort: string;
  description: string;
  assigned: string;
  assignedName?: string;
  opened: string;
  status: string;
  statusVariant: 'ba' | 'br' | 'bg';
  action: 'review' | 'assign';
};

export function severityBadge(sev: InvestigationDetail['severity']) {
  if (sev === 'P1') return { label: 'P1 Critical', variant: 'br' as const };
  if (sev === 'P2') return { label: 'P2 High', variant: 'ba' as const };
  return { label: 'P3 Medium', variant: 'bx' as const };
}
