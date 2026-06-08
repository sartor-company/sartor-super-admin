import type { Client } from '../data/clients';
import type { InvestigationRow } from '../data/investigations';
import type { OnboardingRow } from '../data/onboarding';
import type { NavBadgeKey } from '../types';

export function computeNavBadges(input: {
  clients: Client[];
  onboarding: OnboardingRow[];
  doraQueue: Record<string, unknown>[];
  investigations: InvestigationRow[];
  tickets: Record<string, unknown>[];
}): Partial<Record<NavBadgeKey, number>> {
  const attentionClients = input.clients.filter((c) => c.status === 'Attention').length;
  const openInvestigations = input.investigations.filter((i) => i.status !== 'Closed').length;
  const openTickets = input.tickets.filter((t) =>
    ['Open', 'In Progress'].includes(String(t.status || '')),
  ).length;

  const badges: Partial<Record<NavBadgeKey, number>> = {};
  if (attentionClients > 0) badges.attentionClients = attentionClients;
  if (input.onboarding.length > 0) badges.onboarding = input.onboarding.length;
  if (input.doraQueue.length > 0) badges.doraQueue = input.doraQueue.length;
  if (openInvestigations > 0) badges.investigations = openInvestigations;
  if (openTickets > 0) badges.support = openTickets;
  return badges;
}
