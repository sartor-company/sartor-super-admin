/**
 * Client-side sticker package builders.
 */
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { triggerBlobDownload } from './downloadBlob';

export type PackagePin = { pin: string; status?: string; serialNumber?: string };

export type PackageOrderMeta = {
  orderId: string;
  clientName?: string;
  clientCode?: string;
  productName?: string;
  sku?: string;
  qtyOrdered?: number;
  qtyWithOverage?: number;
  stage?: string;
  pinStatus?: string;
  qrStatus?: string;
  linkStatus?: string;
  pinsLinkedCount?: number;
  batchRef?: string;
};

export type PackagePayload = {
  order: PackageOrderMeta;
  verifyUrl: string;
  pins: PackagePin[];
};

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadText(filename: string, text: string, mime: string) {
  triggerBlobDownload(new Blob([text], { type: mime }), filename);
}

function downloadBytes(filename: string, data: BlobPart, mime: string) {
  triggerBlobDownload(new Blob([data], { type: mime }), filename);
}

export function buildPinManifestCsv(payload: PackagePayload) {
  const { order, verifyUrl, pins } = payload;
  const header = [
    'pin',
    'status',
    'order_id',
    'client',
    'client_code',
    'sku',
    'product',
    'serial_number',
    'verify_url',
  ];
  const rows = pins.map((p) =>
    [
      p.pin,
      p.status || 'dormant',
      order.orderId,
      order.clientName,
      order.clientCode,
      order.sku,
      order.productName,
      p.serialNumber || '',
      verifyUrl,
    ]
      .map(csvEscape)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

/** Minimal SpreadsheetML that Excel opens as .xls */
export function buildPinManifestExcelXml(payload: PackagePayload) {
  const { order, verifyUrl, pins } = payload;
  const header = [
    'pin',
    'status',
    'order_id',
    'client',
    'client_code',
    'sku',
    'product',
    'serial_number',
    'verify_url',
  ];
  const escape = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const rowXml = (cells: string[]) =>
    `<Row>${cells.map((c) => `<Cell><Data ss:Type="String">${escape(c)}</Data></Cell>`).join('')}</Row>`;
  const body = [
    rowXml(header),
    ...pins.map((p) =>
      rowXml([
        p.pin,
        p.status || 'dormant',
        order.orderId,
        order.clientName || '',
        order.clientCode || '',
        order.sku || '',
        order.productName || '',
        p.serialNumber || '',
        verifyUrl,
      ]),
    ),
  ].join('');
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="PIN Manifest"><Table>${body}</Table></Worksheet>
</Workbook>`;
}

export async function buildBatchSummaryPdf(payload: PackagePayload) {
  const { order, verifyUrl, pins } = payload;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, w, 64, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Batch Summary Report', 40, 38);
  doc.setFontSize(10);
  doc.text(order.orderId, w - 40, 38, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  let y = 90;
  const line = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 40, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(value || '—', 160, y);
    y += 18;
  };

  line('Client', `${order.clientName || '—'} (${order.clientCode || '—'})`);
  line('Product', order.productName || '—');
  line('SKU', order.sku || '—');
  line('Qty ordered', String(order.qtyOrdered ?? '—'));
  line('With overage', String(order.qtyWithOverage ?? '—'));
  line('PINs in pool', String(pins.length));
  line('PIN status', order.pinStatus || '—');
  line('Stage', order.stage || '—');
  line('Batch refs', order.batchRef || '—');
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Verify URL', 40, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(14, 165, 164);
  doc.text(verifyUrl, 40, y, { maxWidth: w - 80 });
  y += 28;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Instructions', 40, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const steps = [
    '1. Deliver stickers to the client facility.',
    '2. Client links this order to batch(es) for the same product.',
    '3. Consumers scan the QR, then enter the printed PIN on the page.',
    '4. PINs stay DORMANT until linked to a serial number.',
  ];
  for (const s of steps) {
    doc.text(s, 40, y, { maxWidth: w - 80 });
    y += 14;
  }
  return doc.output('arraybuffer');
}

/** @deprecated Kept for callers; QR package is always a single shared sheet now. */
export const QR_PDF_PART_SIZE = 200;

/**
 * Single shared QR sheet for an order.
 * One QR encodes the order verify URL; unique PINs live in the pin manifest.
 */
export async function buildQrCodesPdf(
  payload: PackagePayload,
  onProgress?: (done: number, total: number) => void,
) {
  const { order, verifyUrl, pins } = payload;
  const pinCount = pins.length || Number(order.qtyWithOverage) || Number(order.qtyOrdered) || 0;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const headerH = 56;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 420,
    margin: 1,
    color: { dark: '#0B1F3A', light: '#FFFFFF' },
  });

  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageW, headerH, 'F');
  doc.setFillColor(14, 165, 164);
  doc.rect(0, headerH, pageW, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Security Sticker QR Sheet', margin, 28);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${order.orderId} · ${order.productName || ''} · ${order.clientCode || ''}`,
    margin,
    44,
  );

  const cardY = headerH + 28;
  const cardH = pageH - cardY - 48;
  const cardW = pageW - margin * 2;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, cardY, cardW, cardH, 10, 10, 'FD');
  doc.setFillColor(14, 165, 164);
  doc.rect(margin, cardY, 5, cardH, 'F');

  let ty = cardY + 36;
  doc.setTextColor(14, 165, 164);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SHARED ORDER QR', pageW / 2, ty, { align: 'center' });
  ty += 22;
  doc.setTextColor(11, 31, 58);
  doc.setFontSize(16);
  doc.text('One QR for this sticker order', pageW / 2, ty, { align: 'center' });
  ty += 28;

  const qrSize = 220;
  const qrX = (pageW - qrSize) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, ty, qrSize, qrSize);
  ty += qrSize + 28;

  doc.setFontSize(11);
  doc.text('1. Scan this QR  ·  2. Enter the printed PIN on the verify page', pageW / 2, ty, {
    align: 'center',
  });
  ty += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(verifyUrl, pageW / 2, ty, { align: 'center', maxWidth: cardW - 48 });
  ty += 24;
  doc.text(
    `Covers ${pinCount.toLocaleString()} stickers. Unique PINs are in the pin manifest — do not print a separate QR per PIN.`,
    pageW / 2,
    ty,
    { align: 'center', maxWidth: cardW - 64 },
  );

  onProgress?.(1, 1);
  return doc.output('arraybuffer');
}

/** Always returns a single shared QR PDF (no per-PIN sheets). */
export async function buildQrCodesPdfParts(
  payload: PackagePayload,
  onProgress?: (done: number, total: number, partIndex: number, partCount: number) => void,
) {
  const buf = await buildQrCodesPdf(payload, (done, total) =>
    onProgress?.(done, total, 1, 1),
  );
  return [buf];
}

export async function fetchAllPackageData(
  fetchPage: (page: number, limit: number) => Promise<{
    order: PackageOrderMeta;
    verifyUrl: string;
    pins: PackagePin[];
    page: number;
    pages: number;
    total: number;
  }>,
) {
  const first = await fetchPage(1, 500);
  const pins = [...first.pins];
  for (let page = 2; page <= first.pages; page++) {
    const next = await fetchPage(page, 500);
    pins.push(...next.pins);
  }
  return {
    order: first.order,
    verifyUrl: first.verifyUrl,
    pins,
  } satisfies PackagePayload;
}

export async function downloadPackageArtifact(
  kind: 'csv' | 'xlsx' | 'qr-pdf' | 'summary-pdf' | 'zip',
  payload: PackagePayload,
  onProgress?: (msg: string) => void,
) {
  const id = payload.order.orderId || 'STK';
  if (kind === 'csv') {
    downloadText(`${id}-pin-manifest.csv`, buildPinManifestCsv(payload), 'text/csv;charset=utf-8');
    return;
  }
  if (kind === 'xlsx') {
    downloadText(
      `${id}-pin-manifest.xls`,
      buildPinManifestExcelXml(payload),
      'application/vnd.ms-excel',
    );
    return;
  }
  if (kind === 'summary-pdf') {
    onProgress?.('Building summary PDF…');
    const buf = await buildBatchSummaryPdf(payload);
    downloadBytes(`${id}-batch-summary.pdf`, buf, 'application/pdf');
    return;
  }
  if (kind === 'qr-pdf') {
    onProgress?.('Building shared QR sheet…');
    const buf = await buildQrCodesPdf(payload, () =>
      onProgress?.('Shared QR sheet ready'),
    );
    downloadBytes(`${id}-qr-codes.pdf`, buf, 'application/pdf');
    return;
  }

  onProgress?.('Building complete ZIP…');
  const zip = new JSZip();
  zip.file(`${id}-pin-manifest.csv`, buildPinManifestCsv(payload));
  zip.file(`${id}-pin-manifest.xls`, buildPinManifestExcelXml(payload));
  const summary = await buildBatchSummaryPdf(payload);
  zip.file(`${id}-batch-summary.pdf`, summary);
  onProgress?.('Building shared QR sheet…');
  const qrBuf = await buildQrCodesPdf(payload);
  zip.file(`${id}-qr-codes.pdf`, qrBuf);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  triggerBlobDownload(blob, `${id}.zip`);
}
