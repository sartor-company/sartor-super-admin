import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
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
  if (!invoice) return null;

  const lines =
    invoice.lineItems?.filter((l) => l.desc) ||
    [{ desc: invoice.description || 'Line item', amt: invoice.amount, type: 'one-off' }];

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
      <ModalFooter>
        <Button
          variant="secondary"
          onClick={() =>
            downloadInvoicePdf({
              invoiceId: invoice.invoiceId,
              clientName: invoice.clientName,
              clientCode: invoice.clientCode,
              status: invoice.status,
              amount: invoice.amount,
              lineItems: lines,
              description: invoice.description,
            })
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
