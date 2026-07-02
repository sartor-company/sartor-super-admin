import { jsPDF } from 'jspdf';
import type { BankAccount, ExchangeRates } from '../types';
import type { PlatformInvoiceRow } from './financeDisplay';
import { formatInvoiceAmount } from './financeDisplay';

type DownloadableInvoice = Pick<
  PlatformInvoiceRow,
  'invoiceId' | 'clientName' | 'clientCode' | 'status' | 'amount' | 'lineItems' | 'description'
>;

export type InvoiceBranding = {
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  bankAccounts?: BankAccount[];
  exchangeRates?: ExchangeRates;
  logoUrl?: string;
};

const NAVY: [number, number, number] = [6, 13, 36];
const MUTED: [number, number, number] = [120, 128, 145];

async function loadImageDataUrl(url: string): Promise<{ dataUrl: string; ratio: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const ratio = await new Promise<number>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width && img.height ? img.width / img.height : 1);
      img.onerror = () => resolve(1);
      img.src = dataUrl;
    });
    return { dataUrl, ratio };
  } catch {
    return null;
  }
}

export async function downloadInvoicePdf(
  invoice: DownloadableInvoice,
  branding: InvoiceBranding = {},
) {
  const lines =
    invoice.lineItems?.filter((l) => l.desc) ||
    [{ desc: invoice.description || 'Line item', amt: invoice.amount, type: 'one-off' }];

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const companyName = branding.companyName || 'Sartor Limited';
  const logo = branding.logoUrl ? await loadImageDataUrl(branding.logoUrl) : null;

  // --- Header band ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 34, 'F');

  let headerTextX = margin;
  if (logo) {
    const logoH = 16;
    const logoW = Math.min(24, logoH * logo.ratio);
    try {
      doc.addImage(logo.dataUrl, 'JPEG', margin, 9, logoW, logoH);
      headerTextX = margin + logoW + 6;
    } catch {
      /* ignore bad image */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(companyName, headerTextX, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const contactBits = [
    branding.companyAddress,
    branding.companyEmail,
    branding.companyPhone,
  ].filter(Boolean);
  doc.text(contactBits.join('  •  ') || '', headerTextX, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('INVOICE', pageWidth - margin, 18, { align: 'right' });

  y = 44;

  // --- Invoice meta + bill to ---
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('BILL TO', margin, y);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });
  y += 5;

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(invoice.clientName || invoice.clientCode || 'Client', margin, y);
  doc.text(invoice.invoiceId || '—', pageWidth - margin, y, { align: 'right' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  if (invoice.clientCode) doc.text(`Client code: ${invoice.clientCode}`, margin, y);
  doc.text(
    `${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    pageWidth - margin,
    y,
    { align: 'right' },
  );
  y += 5;
  doc.text(`Status: ${invoice.status || 'Pending'}`, pageWidth - margin, y, {
    align: 'right',
  });
  y += 10;

  // --- Line items table ---
  doc.setFillColor(...NAVY);
  doc.rect(margin, y - 5, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIPTION', margin + 2, y);
  doc.text('AMOUNT', pageWidth - margin - 2, y, { align: 'right' });
  y += 8;

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const line of lines) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }
    const amt =
      line.amt != null
        ? `${formatInvoiceAmount(line.amt)}${line.type === 'monthly' ? '/mo' : ''}`
        : 'Included';
    const descLines = doc.splitTextToSize(String(line.desc), contentWidth - 45) as string[];
    descLines.forEach((dl, idx) => {
      doc.text(dl, margin + 2, y + idx * 5);
    });
    doc.text(amt, pageWidth - margin - 2, y, { align: 'right' });
    y += Math.max(descLines.length * 5, 6) + 2;
    doc.setDrawColor(230);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  }

  // --- Total ---
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Due', margin + 2, y);
  doc.text(formatInvoiceAmount(invoice.amount), pageWidth - margin - 2, y, {
    align: 'right',
  });
  y += 6;

  // Currency equivalents
  const rates = branding.exchangeRates;
  if (rates && (rates.usd || rates.gbp)) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const parts: string[] = [];
    if (rates.usd) parts.push(`≈ $${(invoice.amount / rates.usd).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD`);
    if (rates.gbp) parts.push(`≈ £${(invoice.amount / rates.gbp).toLocaleString('en-GB', { maximumFractionDigits: 2 })} GBP`);
    doc.text(parts.join('   '), pageWidth - margin - 2, y, { align: 'right' });
    y += 6;
  }

  // --- Bank details ---
  const banks = branding.bankAccounts || [];
  if (banks.length) {
    y += 6;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Payment — Bank Transfer', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const b of banks.filter((x) => x.status !== 'Inactive')) {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = margin;
      }
      doc.setTextColor(...NAVY);
      doc.text(
        `${b.currency}  •  ${b.bank}  •  ${b.accountName}  •  ${b.accountNumber}`,
        margin,
        y,
      );
      y += 5;
    }
  }

  // --- Footer ---
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Generated ${new Date().toLocaleString('en-GB')} · ${companyName}`,
    margin,
    pageHeight - 12,
  );

  doc.save(`${invoice.invoiceId || 'invoice'}.pdf`);
}

export function transactionToInvoiceRow(
  tx: {
    inv?: string;
    invoiceId?: string;
    status?: string;
    amount?: string;
    amountNum?: number;
    type?: string;
    lineItems?: { desc?: string; amt?: number; type?: string }[];
    _id?: string;
  },
  clientName?: string,
  clientCode?: string,
): PlatformInvoiceRow {
  const amount =
    tx.amountNum ??
    (parseFloat(String(tx.amount || '').replace(/[^0-9.-]/g, '')) || 0);
  return {
    _id: tx._id || tx.invoiceId || tx.inv || '',
    invoiceId: tx.invoiceId || tx.inv || '—',
    clientName,
    clientCode,
    description: tx.type,
    amount,
    status: tx.status || 'Pending',
    lineItems: tx.lineItems,
  };
}
