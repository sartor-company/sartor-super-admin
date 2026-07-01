import { Modal, ModalFooter } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import type { BillLine } from '../utils/pricing';
import { formatNaira } from '../utils/format';
import { downloadInvoicePdf } from '../utils/invoiceDownload';

export function OnboardingInvoiceModal({
  open,
  onClose,
  companyName,
  invoiceId,
  lineItems,
  total,
  monthly,
  status = 'Pending Payment',
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  companyName: string;
  invoiceId?: string;
  lineItems: BillLine[];
  total: number;
  monthly?: number;
  status?: string;
  onSend?: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Onboarding Invoice"
      subtitle={invoiceId ? invoiceId : 'Preview — generated on onboard'}
      width={540}
    >
      <div
        style={{
          background: 'var(--navy)',
          borderRadius: 8,
          padding: '13px 16px',
          color: '#fff',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.7 }}>Bill to</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{companyName || 'New Client'}</div>
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>Status: {status}</div>
      </div>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 9, padding: '13px 15px' }}>
        {lineItems.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              padding: '6px 0',
              borderBottom: '1px solid var(--bg2)',
              fontSize: 12,
            }}
          >
            <span style={{ color: 'var(--text2)' }}>{line.desc}</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: line.type === 'included' ? 'var(--gt)' : undefined,
              }}
            >
              {line.type === 'included'
                ? 'Included'
                : `${formatNaira(line.amt)}${line.type === 'monthly' ? '/mo' : ''}`}
            </span>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 9,
            marginTop: 4,
            borderTop: '2px solid var(--border)',
            fontWeight: 700,
          }}
        >
          <span>{monthly && !total ? 'First month' : 'Due now'}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--navy)' }}>
            {formatNaira(total || monthly || 0)}
            {monthly && !total ? '/mo' : ''}
          </span>
        </div>
        {monthly && total > 0 ? (
          <div className="srow" style={{ marginTop: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--text2)' }}>Recurring monthly</span>
            <strong>{formatNaira(monthly)}/mo</strong>
          </div>
        ) : null}
      </div>
      <ModalFooter>
        {invoiceId ? (
          <Button
            variant="secondary"
            onClick={() =>
              downloadInvoicePdf({
                invoiceId,
                clientName: companyName,
                status,
                amount: total || monthly || 0,
                lineItems,
              })
            }
          >
            Download PDF
          </Button>
        ) : null}
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {onSend ? (
          <Button className="bacc" onClick={onSend}>
            Send to Client
          </Button>
        ) : null}
      </ModalFooter>
    </Modal>
  );
}
