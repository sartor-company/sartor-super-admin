import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { BankAccount, ExchangeRates } from '../types';
import type { PlatformInvoiceRow } from './financeDisplay';

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

const NAIRA = '\u20A6';

function naira(n: number): string {
  return `${NAIRA}${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadLogoDataUrl(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function buildInvoiceHtml(
  invoice: DownloadableInvoice,
  branding: InvoiceBranding,
  logoDataUrl: string | null,
): string {
  const companyName = esc(branding.companyName || 'Sartor Limited');
  const contact = [branding.companyAddress, branding.companyEmail, branding.companyPhone]
    .filter(Boolean)
    .map(esc)
    .join(' &nbsp;•&nbsp; ');

  const lines =
    invoice.lineItems?.filter((l) => l.desc) ||
    [{ desc: invoice.description || 'Line item', amt: invoice.amount, type: 'one-off' }];

  const rows = lines
    .map((l) => {
      const amt =
        l.amt != null
          ? `${naira(l.amt)}${l.type === 'monthly' ? '/mo' : ''}`
          : 'Included';
      return `<tr>
        <td style="padding:9px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#1a2035;">${esc(l.desc)}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #eef0f4;font-size:13px;text-align:right;font-family:monospace;color:#1a2035;white-space:nowrap;">${amt}</td>
      </tr>`;
    })
    .join('');

  const rates = branding.exchangeRates;
  const equivParts: string[] = [];
  if (rates?.usd) equivParts.push(`≈ $${(invoice.amount / rates.usd).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD`);
  if (rates?.gbp) equivParts.push(`≈ £${(invoice.amount / rates.gbp).toLocaleString('en-GB', { maximumFractionDigits: 2 })} GBP`);
  const equivLine = equivParts.length
    ? `<div style="font-size:11px;color:#7a8091;margin-top:3px;">${equivParts.join(' &nbsp; ')}</div>`
    : '';

  const banks = (branding.bankAccounts || []).filter((b) => b.status !== 'Inactive');
  const bankRows = banks
    .map(
      (b) => `<div style="font-size:12px;color:#3a4054;margin-bottom:4px;">
        <strong style="display:inline-block;min-width:38px;">${esc(b.currency)}</strong>
        ${esc(b.bank)} &nbsp;•&nbsp; ${esc(b.accountName)} &nbsp;•&nbsp;
        <span style="font-family:monospace;">${esc(b.accountNumber)}</span>
      </div>`,
    )
    .join('');
  const paystackNote = `<div style="font-size:11px;color:#3a4054;margin-top:${banks.length ? '10' : '0'}px;">
        <strong>Pay by card:</strong> open this invoice in your Sartor portal and choose
        <em>Pay with Paystack</em> to pay securely online.
      </div>`;
  const bankBlock = `<div style="margin-top:22px;padding:14px 16px;background:#f7f8fa;border:1px solid #eef0f4;border-radius:9px;">
        <div style="font-size:12px;font-weight:700;color:#1a2035;margin-bottom:8px;">Payment options</div>
        ${bankRows}
        ${paystackNote}
      </div>`;

  const logo = logoDataUrl
    ? `<img src="${logoDataUrl}" style="width:46px;height:46px;border-radius:9px;object-fit:cover;" />`
    : '';

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `
  <div style="width:100%;box-sizing:border-box;padding:34px 36px;font-family:Arial,Helvetica,sans-serif;color:#1a2035;background:#ffffff;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:3px solid #060D24;">
      <div style="display:flex;gap:12px;align-items:center;">
        ${logo}
        <div>
          <div style="font-size:19px;font-weight:800;color:#060D24;">${companyName}</div>
          <div style="font-size:11px;color:#7a8091;margin-top:3px;">${contact}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:24px;font-weight:800;letter-spacing:1px;color:#060D24;">INVOICE</div>
        <div style="font-size:13px;font-family:monospace;color:#3a4054;margin-top:3px;">${esc(invoice.invoiceId)}</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:20px;">
      <div>
        <div style="font-size:10px;letter-spacing:.5px;color:#7a8091;text-transform:uppercase;">Bill To</div>
        <div style="font-size:15px;font-weight:700;margin-top:4px;color:#1a2035;">${esc(invoice.clientName || invoice.clientCode || 'Client')}</div>
        ${invoice.clientCode ? `<div style="font-size:11px;color:#7a8091;margin-top:2px;">Client code: ${esc(invoice.clientCode)}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;color:#3a4054;">Date: ${dateStr}</div>
        <div style="font-size:12px;color:#3a4054;margin-top:3px;">Status:
          <strong style="color:${invoice.status === 'Paid' ? '#1a7f4b' : '#b26a00'};">${esc(invoice.status || 'Pending')}</strong>
        </div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:20px;">
      <thead>
        <tr style="background:#060D24;">
          <th style="padding:9px 12px;text-align:left;font-size:11px;letter-spacing:.5px;color:#fff;">DESCRIPTION</th>
          <th style="padding:9px 12px;text-align:right;font-size:11px;letter-spacing:.5px;color:#fff;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-top:14px;">
      <div style="text-align:right;">
        <div style="font-size:11px;color:#7a8091;text-transform:uppercase;letter-spacing:.5px;">Total Due</div>
        <div style="font-size:22px;font-weight:800;font-family:monospace;color:#060D24;margin-top:2px;">${naira(invoice.amount)}</div>
        ${equivLine}
      </div>
    </div>

    ${bankBlock}

    <div style="margin-top:26px;padding-top:12px;border-top:1px solid #eef0f4;font-size:10px;color:#9aa0ad;">
      Generated ${esc(new Date().toLocaleString('en-GB'))} · ${companyName}. Thank you for your business.
    </div>
  </div>`;
}

export async function downloadInvoicePdf(
  invoice: DownloadableInvoice,
  branding: InvoiceBranding = {},
) {
  const logoDataUrl = await loadLogoDataUrl(branding.logoUrl);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '760px';
  container.style.background = '#ffffff';
  container.innerHTML = buildInvoiceHtml(invoice, branding, logoDataUrl);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/png');

    if (imgHeight <= pageHeight - margin * 2) {
      doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    } else {
      // Multi-page: slice the canvas vertically.
      const pageContentH = pageHeight - margin * 2;
      const pxPerMm = canvas.width / imgWidth;
      const sliceHpx = pageContentH * pxPerMm;
      let renderedH = 0;
      let page = 0;
      while (renderedH < canvas.height) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceHpx, canvas.height - renderedH);
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            renderedH,
            canvas.width,
            sliceCanvas.height,
            0,
            0,
            canvas.width,
            sliceCanvas.height,
          );
        }
        const sliceData = sliceCanvas.toDataURL('image/png');
        const sliceHmm = sliceCanvas.height / pxPerMm;
        if (page > 0) doc.addPage();
        doc.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceHmm);
        renderedH += sliceCanvas.height;
        page += 1;
      }
    }

    doc.save(`${invoice.invoiceId || 'invoice'}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
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
