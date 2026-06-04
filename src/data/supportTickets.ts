import type { BadgeVariant } from '../types';

export type SupportTicket = {
  id: string;
  client: string;
  type: string;
  typeVariant: BadgeVariant;
  desc: string;
  priority: string;
  priorityVariant: BadgeVariant;
  assigned: string;
  age: string;
  ageColor?: string;
  status: string;
  statusVariant: BadgeVariant;
  action: 'escalate' | 'resolve' | 'assign' | 'followup';
  followUpMessage?: string;
};

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-2026-088',
    client: 'NaturalKing',
    type: 'P1 Fraud',
    typeVariant: 'br',
    desc: 'BATCH-NK-019 mismatch. Client requesting lock.',
    priority: 'Critical',
    priorityVariant: 'br',
    assigned: 'Chidi Ogu',
    age: '2 days',
    ageColor: 'var(--rt)',
    status: 'In Progress',
    statusVariant: 'ba',
    action: 'escalate',
  },
  {
    id: 'TKT-2026-091',
    client: 'DankePharma',
    type: 'Credits',
    typeVariant: 'ba',
    desc: 'PIN package download error on Step 3.',
    priority: 'High',
    priorityVariant: 'ba',
    assigned: 'Chidi Ogu',
    age: '1 day',
    ageColor: 'var(--at)',
    status: 'In Progress',
    statusVariant: 'ba',
    action: 'resolve',
  },
  {
    id: 'TKT-2026-094',
    client: 'Sartor Health',
    type: 'CRM',
    typeVariant: 'bb',
    desc: 'Sales Rep login issue — password reset not working.',
    priority: 'Medium',
    priorityVariant: 'bx',
    assigned: 'Unassigned',
    age: '6 hrs',
    status: 'New',
    statusVariant: 'bb',
    action: 'assign',
  },
  {
    id: 'TKT-2026-095',
    client: 'Bright Home',
    type: 'Training',
    typeVariant: 'bx',
    desc: 'BATCH-BH-031 training past ETA.',
    priority: 'Low',
    priorityVariant: 'bx',
    assigned: 'Chidi Ogu',
    age: '4 hrs',
    status: 'New',
    statusVariant: 'bb',
    action: 'resolve',
  },
  {
    id: 'TKT-2026-096',
    client: 'FreshNow',
    type: 'Onboarding',
    typeVariant: 'ba',
    desc: 'Client unresponsive to image requests.',
    priority: 'High',
    priorityVariant: 'ba',
    assigned: 'Amaka Eze',
    age: '2 hrs',
    status: 'New',
    statusVariant: 'bb',
    action: 'followup',
    followUpMessage: 'Onboarding images required.',
  },
];
