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

export const INVESTIGATIONS: InvestigationRow[] = [
  {
    id: 'INV-2026-112',
    clientShort: 'NaturalKing',
    client: 'NaturalKing FMCG',
    batch: 'BATCH-NK-019',
    severity: 'P1',
    desc: 'Batch mismatch — Shanghai origin suspected. Product hash mismatch on 312/800 scanned units in Kano market. Client has flagged distributor.',
    description: 'Batch mismatch — Shanghai origin. 312/800 units affected.',
    assigned: 'Chidi Ogu',
    opened: 'May 9',
    status: 'In Progress',
    statusVariant: 'ba',
    action: 'review',
  },
  {
    id: 'INV-2026-098',
    clientShort: 'DankePharma',
    client: 'DankePharma Ltd',
    batch: 'BATCH-DP-037',
    severity: 'P1',
    desc: '3 consumer complaints: packaging inconsistency reported. SMS trail shows verified scans from unusual location cluster.',
    description: 'Consumer complaints — packaging inconsistency with confirmed DORA scans.',
    assigned: 'Unassigned',
    opened: 'May 7',
    status: 'Open',
    statusVariant: 'br',
    action: 'assign',
  },
  {
    id: 'INV-2026-089',
    clientShort: 'Sartor Health',
    client: 'Sartor Health Co. Ltd',
    batch: 'BATCH-SH-038',
    severity: 'P2',
    desc: 'High scan velocity from single location (Alaba Market, Lagos). 1,200 scans in 6 hours — grey market reseller.',
    description: 'Unusual scan velocity — 1,200 scans in 6hrs, single location.',
    assigned: 'Chidi Ogu',
    opened: 'May 5',
    status: 'In Progress',
    statusVariant: 'ba',
    action: 'review',
  },
  {
    id: 'INV-2026-081',
    clientShort: 'Bright Home',
    client: 'Bright Home Products',
    batch: 'BATCH-BH-029',
    severity: 'P2',
    desc: 'Suspected label lift-and-reprint.',
    description: 'Suspected label lift-and-reprint using expired batch QR codes.',
    assigned: 'Unassigned',
    opened: 'Apr 30',
    status: 'Open',
    statusVariant: 'br',
    action: 'review',
  },
  {
    id: 'INV-2026-074',
    clientShort: 'NaturalKing',
    client: 'NaturalKing FMCG',
    batch: 'BATCH-NK-015',
    severity: 'P3',
    desc: 'Single consumer report.',
    description: 'Single consumer report — possible label variant from early production.',
    assigned: 'Chidi Ogu',
    opened: 'Apr 25',
    status: 'In Progress',
    statusVariant: 'ba',
    action: 'review',
  },
];

export function severityBadge(sev: InvestigationDetail['severity']) {
  if (sev === 'P1') return { label: 'P1 Critical', variant: 'br' as const };
  if (sev === 'P2') return { label: 'P2 High', variant: 'ba' as const };
  return { label: 'P3 Medium', variant: 'bx' as const };
}
