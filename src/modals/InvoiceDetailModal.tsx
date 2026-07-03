import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useInvoiceBranding } from '../hooks/useInvoiceBranding';
import {
  formatInvoiceAmount,
  formatUsd,
  invoiceStatusVariant,
  revenueBadgeVariant,
  type PlatformInvoiceRow,
} from '../utils/financeDisplay';
import { downloadInvoicePdf } from '../utils/invoiceDownload';

export function InvoiceDetailModal({
  invoice,
  open,
  onClose,
}: {
  invoice: PlatformInvoiceRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const branding = useInvoiceBranding();

  if (!invoice) return null;

  const lines =
    invoice.lineItems?.filter((l) => l.desc) ||
    [{ desc: invoice.description || 'Line item', amt: invoice.amount, type: 'one-off' }];

  const rates = branding.exchangeRates;
  const banks = (branding.bankAccounts || []).filter((b) => b.status !== 'Inactive');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Invoice ${invoice.invoiceId}`}
      subtitle={`${invoice.clientName || invoice.clientCode || 'Client'} · ${invoice.status}`}
      width={520}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <Badge variant={revenueBadgeVariant(invoice.revenueVariant)}>{invoice.revenueLabel || 'Invoice'}</Badge>
        <Badge variant={invoiceStatusVariant(invoice.status)}>{invoice.status}</Badge>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {formatInvoiceAmount(invoice.amount)} · {formatUsd(invoice.amount, invoice.usdEquivalent)} USD
        </span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {lines.map((line, i) => (
          <div
            key={`${line.desc}-${i}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 7,
              fontSize: 12,
            }}
          >
            <div>
              <div>{line.desc}</div>
              {line.type && line.type !== 'one-off' && (
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{line.type}</div>
              )}
            </div>
            <strong style={{ fontFamily: 'var(--mono)' }}>
              {line.amt ? formatInvoiceAmount(line.amt) : 'Included'}
            </strong>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 12,
          paddingTop: 10,
          borderTop: '2px solid var(--border)',
        }}
      >
        <strong>Total Due</strong>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ fontFamily: 'var(--mono)', fontSize: 15 }}>
            {formatInvoiceAmount(invoice.amount)}
          </strong>
          {rates && (rates.usd || rates.gbp) ? (
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
              {rates.usd ? `≈ $${(invoice.amount / rates.usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : ''}
              {rates.usd && rates.gbp ? '  ·  ' : ''}
              {rates.gbp ? `≈ £${(invoice.amount / rates.gbp).toLocaleString('en-GB', { maximumFractionDigits: 2 })}` : ''}
            </div>
          ) : null}
        </div>
      </div>

      {banks.length ? (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            Payment — Bank Transfer
          </div>
          {banks.map((b, i) => (
            <div
              key={b._id ?? i}
              style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}
            >
              <Badge variant="bn">{b.currency}</Badge>{' '}
              {b.bank} · {b.accountName} ·{' '}
              <span style={{ fontFamily: 'var(--mono)' }}>{b.accountNumber}</span>
            </div>
          ))}
        </div>
      ) : null}

      <ModalFooter>
        <Button
          variant="secondary"
          onClick={() =>
            downloadInvoicePdf(
              {
                invoiceId: invoice.invoiceId,
                clientName: invoice.clientName,
                clientCode: invoice.clientCode,
                status: invoice.status,
                amount: invoice.amount,
                lineItems: lines,
                description: invoice.description,
              },
              branding,
            )
          }
        >
          Download PDF
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
