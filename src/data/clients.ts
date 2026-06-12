export type BadgeVariant = 'bg' | 'ba' | 'br' | 'bb' | 'bx' | 'bp' | 'bn';

export interface Client {
  smsCredits?: number;
  pinCredits?: number;
  _id?: string;
  name: string;
  code: string;
  rc: string;
  av: string;
  ini: string;
  crm: string | null;
  scband: 'Growth' | 'Pilot' | 'Starter';
  location: string;
  industry: string;
  skus: number;
  batches: number;
  authRate: string;
  creditHealth: { label: string; variant: BadgeVariant };
  status: 'Active' | 'Onboarding' | 'Attention';
  products: string;
  am?: string;
  crmSeats?: number;
  verifyDomain?: string;
  domainTier?: string;
  campaignStacking?: boolean;
  scEnabled?: boolean;
  crmEnabled?: boolean;
  engagement?: string;
}

export const CLIENTS: Client[] = [
  {
    name: 'Sartor Health Co. Ltd',
    code: 'SHC',
    rc: 'RC 1234567',
    av: '#1A2D7C',
    ini: 'SH',
    crm: 'CRM 360',
    scband: 'Growth',
    location: 'Abuja · FMCG',
    industry: 'FMCG / Personal Care',
    skus: 24,
    batches: 47,
    authRate: '97.4%',
    creditHealth: { label: 'Healthy', variant: 'bg' },
    status: 'Active',
    products: 'SC CRM 360',
    am: 'Amaka Eze',
  },
  {
    name: 'DankePharma Ltd',
    code: 'DPL',
    rc: 'RC 8821904',
    av: '#0D7A4E',
    ini: 'DP',
    crm: null,
    scband: 'Growth',
    location: 'Lagos · Pharmaceutical',
    industry: 'Pharmaceutical',
    skus: 18,
    batches: 31,
    authRate: '95.1%',
    creditHealth: { label: 'SMS: 12%', variant: 'ba' },
    status: 'Active',
    products: 'SC',
    am: 'Amaka Eze',
  },
  {
    name: 'FreshNow Consumer',
    code: 'FNC',
    rc: 'RC 3341290',
    av: '#6B3FD4',
    ini: 'FN',
    crm: null,
    scband: 'Pilot',
    location: 'Port Harcourt · FMCG',
    industry: 'FMCG',
    skus: 1,
    batches: 0,
    authRate: '—',
    creditHealth: { label: 'N/A', variant: 'bx' },
    status: 'Onboarding',
    products: 'SC Pilot',
    am: 'Amaka Eze',
  },
  {
    name: 'NaturalKing FMCG',
    code: 'NKF',
    rc: 'RC 5523871',
    av: '#8B2020',
    ini: 'NK',
    crm: null,
    scband: 'Growth',
    location: 'Kano · FMCG',
    industry: 'FMCG',
    skus: 8,
    batches: 14,
    authRate: '88.2%',
    creditHealth: { label: 'PIN: 8%', variant: 'br' },
    status: 'Attention',
    products: 'SC',
    am: 'Amaka Eze',
  },
  {
    name: 'Bright Home Products',
    code: 'BHP',
    rc: 'RC 7712834',
    av: '#925B00',
    ini: 'BH',
    crm: null,
    scband: 'Growth',
    location: 'Ibadan · Consumer Goods',
    industry: 'Consumer Goods',
    skus: 11,
    batches: 22,
    authRate: '96.3%',
    creditHealth: { label: 'Healthy', variant: 'bg' },
    status: 'Active',
    products: 'SC',
    am: 'Amaka Eze',
  },
  {
    name: 'TechBev Nigeria Ltd',
    code: 'TBN',
    rc: 'RC 9910234',
    av: '#2060D8',
    ini: 'TB',
    crm: 'Sales Navigator',
    scband: 'Starter',
    location: 'Lagos · Beverages',
    industry: 'Beverages',
    skus: 4,
    batches: 8,
    authRate: '94.8%',
    creditHealth: { label: 'Healthy', variant: 'bg' },
    status: 'Active',
    products: 'SC SN',
    am: 'Amaka Eze',
  },
  {
    name: 'AgriPack Ltd',
    code: 'APL',
    rc: 'RC 4478823',
    av: '#1240A0',
    ini: 'AP',
    crm: 'Sales Nav+',
    scband: 'Growth',
    location: 'Abuja · Agribusiness',
    industry: 'Agribusiness',
    skus: 9,
    batches: 17,
    authRate: '96.1%',
    creditHealth: { label: 'Healthy', variant: 'bg' },
    status: 'Active',
    products: 'SC SNP',
    am: 'Amaka Eze',
  },
];
