export type StickerStage = 'pin_gen' | 'ready_dispatch' | 'in_transit' | 'delivered';

export type StickerOrderRow = {
  _id: string;
  orderId: string;
  adminId?: string;
  clientName: string;
  clientCode?: string;
  productId?: string;
  sku: string;
  productName: string;
  batchRef: string;
  qtyOrdered: number;
  qtyWithOverage: number;
  stage: StickerStage;
  stageLabel: string;
  stageBadge: string;
  pinStatus: string;
  qrStatus: string;
  pinStatusLabel: string;
  qrStatusLabel: string;
  assignedPinTo?: string;
  assignedPinName: string;
  packageDownloaded: boolean;
  deliveryStatus: string;
  deliveryLabel: string;
  courier: string;
  trackingNumber: string;
  dispatchedAt?: number;
  deliveredAt?: number;
  activatedAt?: number;
  activatedBatchRef?: string;
  notes: string;
  canDownload: boolean;
  canDispatch: boolean;
  canTriggerPin: boolean;
  creationDateTime?: number;
};

export type StickerOrderSummary = {
  pendingPin: number;
  pendingQr: number;
  readyDispatch: number;
  inTransit: number;
  total: number;
};

export const STICKER_STAGE_OPTIONS = [
  'All Stages',
  'PIN Gen',
  'Ready to Dispatch',
  'In Transit',
  'Delivered',
] as const;

export const STICKER_PROCESS_STEPS = [
  {
    icon: '📄',
    title: '1. Client Orders',
    detail: 'Client places sticker order via their admin. Sartor auto-applies 10% overage.',
  },
  {
    icon: '🔑',
    title: '2. PIN Generation',
    detail: 'AI/ML generates DORMANT 10-digit alphanumeric PINs. Activated at batch activation.',
  },
  {
    icon: '📷',
    title: '3. QR Code Gen',
    detail: 'QR codes generated and linked to batch. Each QR encodes the verify URL + batch token.',
  },
  {
    icon: '⬇',
    title: '4. Download Package',
    detail: 'Ops downloads: PIN manifest CSV and QR PNG/SVG files. Delivered to print vendor.',
  },
  {
    icon: '🚚',
    title: '5. Print & Dispatch',
    detail: 'Printed stickers dispatched by courier (GIG/DHL) to client. Tracking number logged here.',
  },
] as const;

export function calcStickerOverage(qty: number): number {
  const n = Math.max(0, Math.floor(qty) || 0);
  if (!n) return 0;
  return Math.ceil(n * 1.1);
}
