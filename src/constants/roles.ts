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
          { label: 'All Clients', path: '/clients', icon: 'users', badgeKey: 'attentionClients' },
          { label: 'Platform Settings', path: '/settings', icon: 'cog' },
        ],
      },
      {
        title: 'Operations',
        items: [
          { label: 'Onboarding Pipeline', path: '/onboarding', icon: 'flow', badgeKey: 'onboarding' },
          { label: 'Sticker Orders', path: '/sticker-orders', icon: 'tag', badgeKey: 'stickerOrders' },
          { label: 'DORA Training Queue', path: '/aiml/queue', icon: 'brain', badgeKey: 'doraQueue' },
        ],
      },
      {
        title: 'Finance',
        items: [{ label: 'Finance Dashboard', path: '/finance', icon: 'chart' }],
      },
      { title: 'Analytics', items: [{ label: 'Reports & Analytics', path: '/reports', icon: 'line' }] },
      { title: 'Support', items: [{ label: 'Support Queue', path: '/support', icon: 'help', badgeKey: 'support' }] },
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
          { label: 'Onboarding Pipeline', path: '/onboarding', icon: 'flow', badgeKey: 'onboarding' },
          { label: 'Sticker Orders', path: '/sticker-orders', icon: 'tag', badgeKey: 'stickerOrders' },
          { label: 'All Clients', path: '/clients', icon: 'users' },
        ],
      },
      { title: 'AI & Training', items: [{ label: 'DORA Training Queue', path: '/aiml/queue', icon: 'brain', badgeKey: 'doraQueue' }] },
      { title: 'Support', items: [{ label: 'Support Queue', path: '/support', icon: 'help', badgeKey: 'support' }] },
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
          { label: 'Sticker Orders (view)', path: '/sticker-orders', icon: 'tag' },
        ],
      },
      { title: 'Support', items: [{ label: 'Support Queue', path: '/support', icon: 'help', badgeKey: 'support' }] },
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
          { label: 'Finance Dashboard', path: '/finance', icon: 'chart' },
          { label: 'Reports & Analytics', path: '/reports', icon: 'line' },
        ],
      },
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
          { label: 'Training Queue', path: '/aiml/queue', icon: 'layers', badgeKey: 'doraQueue' },
          { label: 'Sticker / PIN Orders', path: '/sticker-orders', icon: 'tag', badgeKey: 'stickerOrders' },
          { label: 'Model Performance', path: '/aiml', icon: 'chart' },
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
          { label: 'Dashboard', path: '/support', icon: 'help', badgeKey: 'support' },
          { label: 'Client Lookup', path: '/clients', icon: 'users' },
        ],
      },
      {
        title: 'Escalation',
        items: [
          { label: 'P1/P2 Investigations', path: '/investigations', icon: 'alert', badgeKey: 'investigations' },
        ],
      },
    ],
  },
};
