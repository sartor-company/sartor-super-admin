export type BadgeVariant = 'bg' | 'ba' | 'br' | 'bb' | 'bx' | 'bp' | 'bn';

export type AccountStatus = 'inactive' | 'active' | 'pilot';
export type CrmTierType = 'field' | 'depot' | '360';

export interface Client {
  smsCredits?: number;
  pinCredits?: number;
  batchCalCredits?: number;
  _id?: string;
  name: string;
  email?: string;
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
  status: 'Active' | 'Onboarding' | 'Attention' | 'Pilot';
  accountStatus?: AccountStatus;
  accountActivated?: boolean;
  products: string;
  productKeys?: string[];
  subscription?: string[];
  am?: string;
  crmSeats?: number;
  crmOpSeats?: number;
  crmTierType?: CrmTierType | null;
  crmBillingCycle?: 'monthly' | 'annual';
  verifyDomain?: string;
  domainTier?: string;
  campaignStacking?: boolean;
  scEnabled?: boolean;
  crmEnabled?: boolean;
  services?: { scdora: boolean; crm: boolean };
  engagement?: string;
  contactName?: string | null;
  leadCount?: number;
  nextRenewal?: string | null;
  nextRenewalAt?: number | null;
  pilotDaysRemaining?: number | null;
  pilotDaysTotal?: number | null;
}
