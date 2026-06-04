import type { RoleConfig, RoleId } from '../types';

export const ROLES: Record<RoleId, RoleConfig> = {
  super: {
    label: 'CEO / Super Admin',
    pill: 'CEO',
    pillClass: 'pill-super',
    user: 'Nwachukwu Confidence',
    initials: 'NC',
    avatarBg: '#FF5C35',
    roleTitle: 'MD / CEO · Sartor Limited',
    defaultPath: '/',
    nav: [
      {
        title: 'Platform',
        items: [
          { label: 'Overview', path: '/', icon: 'grid' },
          { label: 'All Clients', path: '/clients', icon: 'users', badge: 2 },
          { label: 'Platform Settings', path: '/settings', icon: 'cog' },
        ],
      },
      {
        title: 'Operations',
        items: [
          { label: 'Onboarding Pipeline', path: '/onboarding', icon: 'flow', badge: 3 },
          { label: 'DORA Training Queue', path: '/aiml/queue', icon: 'brain', badge: 7 },
        ],
      },
      {
        title: 'Finance',
        items: [
          { label: 'Finance Dashboard', path: '/finance', icon: 'chart' },
          { label: 'Invoices', path: '/finance?finTab=invoices', icon: 'doc', finTab: 'invoices' },
          { label: 'CRM Subscriptions', path: '/finance?finTab=crm', icon: 'credit', finTab: 'crm' },
          { label: 'SC Credit Sales', path: '/finance?finTab=credits', icon: 'credit', finTab: 'credits' },
        ],
      },
      { title: 'Analytics', items: [{ label: 'Reports & Analytics', path: '/reports', icon: 'line' }] },
      {
        title: 'Security',
        items: [{ label: 'Investigations', path: '/investigations', icon: 'alert', badge: 23 }],
      },
      { title: 'Support', items: [{ label: 'Support Queue', path: '/support', icon: 'help', badge: 5 }] },
    ],
  },
  ops: {
    label: 'Operations Manager',
    pill: 'OPS',
    pillClass: 'pill-ops',
    user: 'Emeka Nnaji',
    initials: 'EN',
    avatarBg: '#1A2D7C',
    roleTitle: 'Operations · Sartor Limited',
    defaultPath: '/ops',
    nav: [
      { title: 'Overview', items: [{ label: 'Dashboard', path: '/ops', icon: 'grid' }] },
      {
        title: 'Clients',
        items: [
          { label: 'Onboarding Pipeline', path: '/onboarding', icon: 'flow', badge: 3 },
          { label: 'All Clients', path: '/clients', icon: 'users' },
        ],
      },
      { title: 'AI & Training', items: [{ label: 'DORA Training Queue', path: '/aiml/queue', icon: 'brain', badge: 7 }] },
      { title: 'Analytics', items: [{ label: 'Reports & Analytics', path: '/reports', icon: 'line' }] },
      { title: 'Support', items: [{ label: 'Support Queue', path: '/support', icon: 'help', badge: 5 }] },
    ],
  },
  am: {
    label: 'Account Manager',
    pill: 'AM',
    pillClass: 'pill-am',
    user: 'Amaka Eze',
    initials: 'AE',
    avatarBg: '#0D7A4E',
    roleTitle: 'Account Management · Sartor Limited',
    defaultPath: '/am',
    nav: [
      {
        title: 'My Portfolio',
        items: [
          { label: 'My Accounts', path: '/am', icon: 'users' },
          { label: 'Client Detail', path: '/clients/SHC', icon: 'grid' },
        ],
      },
      { title: 'Analytics', items: [{ label: 'My Reports', path: '/reports', icon: 'line' }] },
      { title: 'Support', items: [{ label: 'Support Queue', path: '/support', icon: 'help' }] },
    ],
  },
  finance: {
    label: 'Finance Admin',
    pill: 'FINANCE',
    pillClass: 'pill-finance',
    user: 'Fatima Bello',
    initials: 'FB',
    avatarBg: '#C4860A',
    roleTitle: 'Finance · Sartor Limited',
    defaultPath: '/finance',
    nav: [
      {
        title: 'Finance',
        items: [
          { label: 'Dashboard', path: '/finance', icon: 'chart' },
          { label: 'Invoices', path: '/finance?finTab=invoices', icon: 'doc', finTab: 'invoices' },
          { label: 'CRM Subscriptions', path: '/finance?finTab=crm', icon: 'credit', finTab: 'crm' },
          { label: 'SC Credit Sales', path: '/finance?finTab=credits', icon: 'credit', finTab: 'credits' },
        ],
      },
      { title: 'Analytics', items: [{ label: 'Reports & Analytics', path: '/reports', icon: 'line' }] },
      { title: 'Clients', items: [{ label: 'All Clients', path: '/clients', icon: 'users' }] },
    ],
  },
  aiml: {
    label: 'AI/ML Lead',
    pill: 'AI/ML',
    pillClass: 'pill-aiml',
    user: 'Samuel Okon',
    initials: 'SO',
    avatarBg: '#6B3FD4',
    roleTitle: 'AI/ML Lead · Sartor Limited',
    defaultPath: '/aiml',
    nav: [
      {
        title: 'DORA AI',
        items: [
          { label: 'Dashboard', path: '/aiml', icon: 'brain' },
          { label: 'Training Queue', path: '/aiml/queue', icon: 'layers', badge: 7 },
        ],
      },
      { title: 'Clients', items: [{ label: 'All Clients', path: '/clients', icon: 'users' }] },
    ],
  },
  support: {
    label: 'Platform Support',
    pill: 'SUPPORT',
    pillClass: 'pill-support',
    user: 'Chidi Ogu',
    initials: 'CO',
    avatarBg: '#925B00',
    roleTitle: 'Platform Support · Sartor Limited',
    defaultPath: '/support',
    nav: [
      {
        title: 'Support',
        items: [
          { label: 'Dashboard', path: '/support', icon: 'help', badge: 5 },
          { label: 'Client Lookup', path: '/clients', icon: 'users' },
        ],
      },
      {
        title: 'Security',
        items: [{ label: 'Investigations', path: '/investigations', icon: 'alert', badge: 23 }],
      },
    ],
  },
};
