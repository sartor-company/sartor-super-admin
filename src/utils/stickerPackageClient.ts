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

export const QR_PDF_PART_SIZE = 200;

export async function buildQrCodesPdf(
  payload: PackagePayload,
  onProgress?: (done: number, total: number) => void,
  opts?: { partIndex?: number; partCount?: number },
) {
  const { order, verifyUrl, pins } = payload;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const perPage = 2;
  const margin = 28;
  const headerH = 56;
  const gap = 14;
  const cardH = (pageH - margin - headerH - 24 - gap) / perPage;
  const partIndex = opts?.partIndex;
  const partCount = opts?.partCount;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 280,
    margin: 1,
    color: { dark: '#0B1F3A', light: '#FFFFFF' },
  });

  const drawChrome = (pageIndex: number, pageCount: number) => {
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
    const partLabel =
      partIndex && partCount && partCount > 1 ? ` · Part ${partIndex}/${partCount}` : '';
    doc.text(
      `${order.orderId} · ${order.productName || ''} · ${order.clientCode || ''}${partLabel}`,
      margin,
      44,
    );
    doc.text(`Page ${pageIndex}/${pageCount}`, pageW - margin, 34, { align: 'right' });
  };

  const list = pins.length ? pins : [{ pin: 'PENDING', status: 'pending' }];
  const pageCount = Math.max(1, Math.ceil(list.length / perPage));

  for (let index = 0; index < list.length; index++) {
    const slot = index % perPage;
    const pageIndex = Math.floor(index / perPage) + 1;
    if (index > 0 && slot === 0) doc.addPage();
    if (slot === 0) drawChrome(pageIndex, pageCount);

    const y0 = margin + headerH + 10 + slot * (cardH + gap);
    const pin = list[index].pin || '—';
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y0, pageW - margin * 2, cardH, 8, 8, 'FD');
    doc.setFillColor(14, 165, 164);
    doc.rect(margin, y0, 5, cardH, 'F');

    const qrSize = Math.min(140, cardH - 40);
    doc.addImage(qrDataUrl, 'PNG', margin + 24, y0 + (cardH - qrSize) / 2, qrSize, qrSize);

    const tx = margin + 24 + qrSize + 20;
    doc.setTextColor(14, 165, 164);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('AUTHENTICITY CHECK', tx, y0 + 28);
    doc.setTextColor(11, 31, 58);
    doc.setFontSize(13);
    doc.text('Verify this product', tx, y0 + 46);
    doc.setFontSize(9);
    doc.text('1. Scan the QR code', tx, y0 + 68);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(verifyUrl, tx, y0 + 82, { maxWidth: pageW - tx - 40 });
    doc.setTextColor(11, 31, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2. Enter this PIN on the page', tx, y0 + 104);
    doc.setFillColor(11, 31, 58);
    doc.roundedRect(tx, y0 + 112, 180, 32, 6, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(pin, tx + 90, y0 + 133, { align: 'center' });
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Type the PIN exactly as shown after scanning.', tx, y0 + 160, {
      maxWidth: pageW - tx - 40,
    });

    if (onProgress && (index % 10 === 0 || index === list.length - 1)) {
      onProgress(index + 1, list.length);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return doc.output('arraybuffer');
}

export async function buildQrCodesPdfParts(
  payload: PackagePayload,
  onProgress?: (done: number, total: number, partIndex: number, partCount: number) => void,
  partSize = QR_PDF_PART_SIZE,
) {
  const list = payload.pins.length ? payload.pins : [{ pin: 'PENDING', status: 'pending' }];
  const partCount = Math.max(1, Math.ceil(list.length / partSize));
  const parts: ArrayBuffer[] = [];

  for (let p = 0; p < partCount; p++) {
    const start = p * partSize;
    const slice = list.slice(start, start + partSize);
    const partIndex = p + 1;
    const buf = await buildQrCodesPdf(
      { ...payload, pins: slice },
      (done) => onProgress?.(start + done, list.length, partIndex, partCount),
      { partIndex, partCount },
    );
    parts.push(buf);
      await new Promise((r) => setTimeout(r, 0));
    }

    return parts;
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
    onProgress?.('Building QR PDF(s)…');
    const parts = await buildQrCodesPdfParts(payload, (done, total, partIndex, partCount) =>
      onProgress?.(
        partCount > 1
          ? `QR part ${partIndex}/${partCount} — ${done.toLocaleString()} / ${total.toLocaleString()} stickers`
          : `QR stickers ${done.toLocaleString()} / ${total.toLocaleString()}`,
      ),
    );
    if (parts.length === 1) {
      downloadBytes(`${id}-qr-codes.pdf`, parts[0], 'application/pdf');
      return;
    }
    const zip = new JSZip();
    parts.forEach((buf, i) => {
      zip.file(`${id}-qr-codes-part-${i + 1}-of-${parts.length}.pdf`, buf);
    });
    onProgress?.('Packaging QR PDF parts…');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    triggerBlobDownload(blob, `${id}-qr-codes.zip`);
    return;
  }

  onProgress?.('Building complete ZIP…');
  const zip = new JSZip();
  zip.file(`${id}-pin-manifest.csv`, buildPinManifestCsv(payload));
  zip.file(`${id}-pin-manifest.xls`, buildPinManifestExcelXml(payload));
  const summary = await buildBatchSummaryPdf(payload);
  zip.file(`${id}-batch-summary.pdf`, summary);
  const parts = await buildQrCodesPdfParts(payload, (done, total, partIndex, partCount) =>
    onProgress?.(
      partCount > 1
        ? `QR part ${partIndex}/${partCount} — ${done.toLocaleString()} / ${total.toLocaleString()} stickers`
        : `QR stickers ${done.toLocaleString()} / ${total.toLocaleString()}`,
    ),
  );
  if (parts.length === 1) {
    zip.file(`${id}-qr-codes.pdf`, parts[0]);
  } else {
    parts.forEach((buf, i) => {
      zip.file(`${id}-qr-codes-part-${i + 1}-of-${parts.length}.pdf`, buf);
    });
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  triggerBlobDownload(blob, `${id}.zip`);
}
