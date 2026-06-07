export type RoleId = 'super' | 'ops' | 'am' | 'finance' | 'aiml' | 'support';

export type BadgeVariant = 'bg' | 'ba' | 'br' | 'bb' | 'bp' | 'bx' | 'bgold' | 'bn';

export type NavIconKey =
  | 'grid'
  | 'users'
  | 'cog'
  | 'flow'
  | 'brain'
  | 'chart'
  | 'line'
  | 'layers'
  | 'alert'
  | 'help'
  | 'doc'
  | 'credit';

export type ModalId =
  | 'onboard'
  | 'invoice'
  | 'staff'
  | 'teammember'
  | 'followup'
  | 'addnote'
  | 'seatadj'
  | 'crm-tier'
  | 'ticket'
  | 'escalate'
  | 'domain-upgrade'
  | 'convert'
  | 'investigation'
  | 'new-investigation'
  | 'model-review'
  | 'upload-images'
  | 'assign'
  | 'edit-client';

export interface NavItem {
  label: string;
  path: string;
  icon: NavIconKey;
  badge?: number;
  finTab?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface RoleConfig {
  label: string;
  pill: string;
  pillClass: string;
  user: string;
  initials: string;
  avatarBg: string;
  roleTitle: string;
  defaultPath: string;
  nav: NavSection[];
}

export interface PageMeta {
  title: string;
  subtitle: string;
}

export interface InvestigationDetail {
  id: string;
  client: string;
  batch: string;
  severity: 'P1' | 'P2' | 'P3';
  desc: string;
}

export interface PlatformSettings {
  defaultVerifyDomain: string;
  subdomainPattern: string;
  doraTrainingSlaDays: number;
  defaultPinDigits: number;
  smsCreditAlertPercent: number;
  pinCreditAlertPercent: number;
  p1p2AlertToSupport: boolean;
  nafdacMouSigned: boolean;
  nafdacPortalUrl: string;
  nafdacApiNamespace: string;
  apiVersion: string;
  rateLimitPerMinute: number;
  webhookRetryCount: number;
  updatedAt?: number;
}

export interface PlatformStaff {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  platformRole: RoleId;
  blocked?: boolean;
  online?: string;
  userId?: string;
}
