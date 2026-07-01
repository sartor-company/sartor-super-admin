import { jsPDF } from 'jspdf';
import type { PlatformInvoiceRow } from './financeDisplay';
import { formatInvoiceAmount } from './financeDisplay';

type DownloadableInvoice = Pick<
  PlatformInvoiceRow,
  'invoiceId' | 'clientName' | 'clientCode' | 'status' | 'amount' | 'lineItems' | 'description'
>;

export function downloadInvoicePdf(invoice: DownloadableInvoice) {
  const lines =
    invoice.lineItems?.filter((l) => l.desc) ||
    [
      {
        desc: invoice.description || 'Line item',
        amt: invoice.amount,
        type: 'one-off',
      },
    ];

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (text: string, size = 11, bold = false, gap = 0) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const wrapped = doc.splitTextToSize(text, contentWidth) as string[];
    const lineHeight = size * 0.42;
    ensureSpace(wrapped.length * lineHeight + gap);
    wrapped.forEach((line) => {
      doc.text(line, margin, y);
      y += lineHeight;
    });
    y += gap;
  };

  write('Sartor Ltd', 18, true, 2);
  write(`Invoice ${invoice.invoiceId}`, 14, true, 4);
  write(`Client: ${invoice.clientName || invoice.clientCode || '—'}`);
  write(`Status: ${invoice.status || 'Pending'}`, 11, false, 6);

  write('Line items', 12, true, 2);
  for (const line of lines) {
    const amt =
      line.amt != null
        ? `${formatInvoiceAmount(line.amt)}${line.type === 'monthly' ? '/mo' : ''}`
        : 'Included';
    write(`• ${line.desc}`, 10, false, 0);
    write(`  ${amt}`, 10, true, 2);
  }

  y += 2;
  doc.setDrawColor(180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  write(`Total due: ${formatInvoiceAmount(invoice.amount)}`, 13, true, 4);
  write(`Generated: ${new Date().toLocaleString('en-GB')}`, 9, false, 0);

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
