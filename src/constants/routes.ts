import type { PageMeta } from '../types';

export const PAGE_META: Record<string, PageMeta> = {
  '/': { title: 'Platform Overview', subtitle: 'All clients · Live system health' },
  '/clients': { title: 'Client Management', subtitle: 'All active and onboarding clients' },
  '/clients/:code': { title: 'Client Detail', subtitle: 'Account overview, config, credits & team' },
  '/settings': { title: 'Platform Settings', subtitle: 'System-wide configuration — Super Admin only' },
  '/ops': { title: 'Operations Dashboard', subtitle: 'Onboarding pipeline · Platform health' },
  '/onboarding': { title: 'Onboarding Pipeline', subtitle: 'Track setup progress for all new clients' },
  '/am': { title: 'My Accounts', subtitle: 'Amaka Eze · 6 assigned clients' },
  '/finance': { title: 'Finance Dashboard', subtitle: 'Revenue, invoices & CRM subscriptions' },
  '/aiml': { title: 'DORA AI Dashboard', subtitle: 'Model training & performance · Internal only' },
  '/aiml/queue': { title: 'Training Queue', subtitle: 'Batches awaiting images or in training' },
  '/support': { title: 'Support Dashboard', subtitle: 'Open tickets · Escalation' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Platform-wide reporting · Export to CSV or PDF' },
  '/investigations': { title: 'Investigations', subtitle: 'P1, P2 and P3 counterfeiting investigations' },
};

export function matchPageMeta(pathname: string): PageMeta {
  if (pathname.startsWith('/clients/') && pathname !== '/clients') {
    return PAGE_META['/clients/:code'];
  }
  return PAGE_META[pathname] ?? PAGE_META['/'];
}
