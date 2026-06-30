import { useEffect, useMemo, useState } from 'react';
import { platformApi } from '../api/platform';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { isSuperRole } from '../constants/platformStaff';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { useAuthStore } from '../store/authStore';
import type { RoleId } from '../types';

function invoiceIsPaid(status?: string): boolean {
  return /^paid$/i.test(status || '');
}

function invoiceStatusLabel(status?: string): string {
  if (invoiceIsPaid(status)) return 'Paid';
  if (!status) return 'Pending Payment';
  if (/pending/i.test(status)) return 'Pending Payment';
  return status;
}

export function ActivateClientModal() {
  const { isOpen, closeModal } = useModal();
  const { activateTarget, clearActivateClient, notifyClientReload } = useApp();
  const { refresh } = usePlatform();
  const { showToast } = useToast();
  const platformRole = useAuthStore((s) => s.user?.platformRole) as RoleId | undefined;
  const userName = useAuthStore((s) => s.user?.fullName) || 'MD/CEO';

  const open = isOpen('activate-client');
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [creditReason, setCreditReason] = useState('');
  const [saving, setSaving] = useState(false);

  const isCEO = isSuperRole(platformRole);
  const isPaid = invoiceIsPaid(invoiceStatus);

  useEffect(() => {
    if (!open || !activateTarget) return;
    setCreditReason('');
    if (activateTarget.invoiceId) setInvoiceId(activateTarget.invoiceId);
    if (activateTarget.invoiceStatus) setInvoiceStatus(activateTarget.invoiceStatus);

    if (activateTarget.invoiceStatus && activateTarget.invoiceId) return;

    const code = activateTarget.code;
    if (!code) return;

    setLoadingInvoice(true);
    platformApi
      .client(code)
      .then((data) => {
        const latest = (data as { latestInvoice?: { invoiceId: string; status: string } }).latestInvoice;
        if (latest?.invoiceId) setInvoiceId(latest.invoiceId);
        if (latest?.status) setInvoiceStatus(latest.status);
        else {
          const txs = (data as { transactions?: { inv: string }[] }).transactions;
          if (txs?.[0]?.inv) setInvoiceId(txs[0].inv);
          setInvoiceStatus('Pending');
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingInvoice(false));
  }, [open, activateTarget]);

  const handleClose = () => {
    closeModal('activate-client');
    clearActivateClient();
    setCreditReason('');
  };

  const activate = async (mode: 'paid' | 'credit') => {
    if (!activateTarget?.clientId) return;
    if (!isCEO) {
      showToast('Only the CEO can activate clients.', 'warn');
      return;
    }
    setSaving(true);
    try {
      await platformApi.activateClient(activateTarget.clientId, {
        mode,
        reason: mode === 'credit' ? creditReason.trim() || undefined : undefined,
      });
      await refresh();
      notifyClientReload();
      handleClose();
      if (mode === 'credit') {
        showToast(
          `${activateTarget.name} activated ON CREDIT. Invoice remains outstanding. Audit entry logged under MD/CEO.`,
          'warn',
        );
      } else {
        showToast(`${activateTarget.name} activated. Welcome email sent with login credentials.`, 'success');
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Activation failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const auditPreview = useMemo(() => {
    const ts = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    const reason = creditReason.trim();
    return reason
      ? `Activated on credit — authorised by ${userName} — ${ts} — Reason: ${reason}`
      : `Activated on credit — authorised by ${userName} — ${ts}`;
  }, [creditReason, userName]);

  if (!activateTarget) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Activate Client Account"
      subtitle="Review before granting platform access"
      width={500}
    >
      <div style={{ display: 'grid', gap: 6, fontSize: 13, marginBottom: 14 }}>
        {[
          ['Client', activateTarget.name],
          ['Admin Email', activateTarget.email],
          ['Products', activateTarget.products],
          ['Invoice', invoiceId || (loadingInvoice ? 'Loading…' : '—')],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '5px 0',
              borderBottom: label === 'Invoice' ? undefined : '1px solid var(--border)',
              gap: 12,
            }}
          >
            <span style={{ color: 'var(--text2)' }}>{label}</span>
            <strong
              style={{
                textAlign: 'right',
                fontFamily: label === 'Invoice' ? "'DM Mono', monospace" : undefined,
                fontSize: label === 'Invoice' ? 12 : undefined,
              }}
            >
              {value}
            </strong>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', alignItems: 'center' }}>
          <span style={{ color: 'var(--text2)' }}>Invoice Status</span>
          <Badge variant={isPaid ? 'bg' : 'bx'}>{invoiceStatusLabel(invoiceStatus)}</Badge>
        </div>
      </div>

      {isPaid && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--gb)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--gt)',
            marginBottom: 14,
          }}
        >
          ✓ Invoice is settled. Activating grants platform access immediately and sends the welcome email with login
          credentials.
        </div>
      )}

      {!isPaid && !isCEO && (
        <div className="credit-lock">
          <span style={{ fontSize: 16 }}>🔒</span>
          <div>
            <strong>Payment required before activation.</strong>
            <br />
            <span style={{ color: 'var(--text3)' }}>
              This invoice is still pending. Only the Managing Director / CEO can authorise activation on credit.
            </span>
          </div>
        </div>
      )}

      {!isPaid && isCEO && (
        <div className="credit-zone">
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--at)', marginBottom: 4 }}>
            ⚠ Activate on Credit — CEO Authorisation
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
            This invoice is unpaid. As MD/CEO you can activate regardless of payment status — the invoice remains
            outstanding and collectible. This action is logged in the audit trail under your name.
          </div>
          <label className="fi">
            Reason for activation{' '}
            <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(optional — recorded in audit log if provided)</span>
          </label>
          <textarea
            className="inp ta"
            rows={2}
            placeholder="e.g. Reference client; payment confirmed verbally; strategic pilot — collect within 14 days"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            Audit entry will read: &ldquo;{auditPreview}&rdquo;
          </div>
        </div>
      )}

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        {isPaid && isCEO && (
          <Button variant="success" onClick={() => activate('paid')} disabled={saving}>
            {saving ? 'Activating…' : '✓ Activate Now'}
          </Button>
        )}
        {!isPaid && !isCEO && (
          <Button variant="secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Payment required">
            🔒 Activate (locked)
          </Button>
        )}
        {!isPaid && isCEO && (
          <Button
            style={{ background: 'var(--amber)', color: '#fff' }}
            onClick={() => activate('credit')}
            disabled={saving}
          >
            {saving ? 'Activating…' : '⚠ Activate on Credit'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
