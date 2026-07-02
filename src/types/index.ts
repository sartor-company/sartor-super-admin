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
  | 'credit'
  | 'tag';

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
  | 'ticket-detail'
  | 'escalate'
  | 'domain-upgrade'
  | 'convert'
  | 'investigation'
  | 'new-investigation'
  | 'model-review'
  | 'upload-images'
  | 'assign'
  | 'edit-client'
  | 'activate-client'
  | 'sticker-design'
  | 'sticker-order'
  | 'trigger-pin'
  | 'dispatch-order'
  | 'download-package';

export interface StickerOrderTarget {
  _id: string;
  orderId: string;
  clientName: string;
  batchRef: string;
  qtyOrdered: number;
  qtyWithOverage: number;
  assignedPinName: string;
  sku?: string;
  adminId?: string;
}

export interface StickerDesignTarget {
  adminId: string;
  clientName: string;
  clientCode?: string;
}

export interface ActivateClientTarget {
  clientId: string;
  code?: string;
  name: string;
  email: string;
  products: string;
  invoiceId?: string;
  invoiceStatus?: string;
}

export type NavBadgeKey =
  | 'attentionClients'
  | 'onboarding'
  | 'stickerOrders'
  | 'doraQueue'
  | 'investigations'
  | 'support';

export interface NavItem {
  label: string;
  path: string;
  icon: NavIconKey;
  badgeKey?: NavBadgeKey;
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
  _id?: string;
  client: string;
  batch: string;
  severity: 'P1' | 'P2' | 'P3';
  desc: string;
  status?: string;
  assigned?: string;
  assignedTo?: string;
  assignedName?: string;
}

export interface TeamMemberEdit {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TicketDetail {
  id: string;
  _id?: string;
  client: string;
  subject?: string;
  description: string;
  priority?: string;
  status?: string;
  assigned?: string;
  assignedTo?: string;
  escalated?: boolean;
}

export interface PlatformNotification {
  id: string;
  color: string;
  title: string;
  body: string;
  time: string;
  titleColor?: string;
  href?: string;
}

export interface DoraLabelContext {
  _id: string;
  batch: string;
  client: string;
  adminId?: string;
}

export interface BankAccount {
  _id?: string;
  currency: string;
  bank: string;
  accountName: string;
  accountNumber: string;
  status: string;
}

export interface ExchangeRates {
  usd: number;
  gbp: number;
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
  aimlCanTriggerPin?: boolean;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  bankAccounts?: BankAccount[];
  exchangeRates?: ExchangeRates;
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
