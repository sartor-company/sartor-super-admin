import { useState } from 'react';
import { platformApi } from '../api/platform';
import { InfoBanner, WarnBanner } from '../components/patterns/Banner';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';

export function TriggerPinModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { triggerPinTarget, clearTriggerPinTarget } = useApp();
  const { refreshStickerOrders } = usePlatform();
  const [saving, setSaving] = useState(false);

  const open = isOpen('trigger-pin');
  const row = triggerPinTarget;

  const close = () => {
    closeModal('trigger-pin');
    clearTriggerPinTarget();
  };

  const submit = async () => {
    if (!row) return;
    setSaving(true);
    try {
      await platformApi.patchStickerOrder(row._id, { action: 'triggerPin' });
      await refreshStickerOrders();
      showToast(
        `PIN generation triggered for ${row.orderId}. ${row.assignedPinName || 'AI/ML'} notified.`,
        'success',
      );
      close();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not trigger PIN generation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!row) return null;

  return (
    <Modal
      open={open}
      onClose={close}
      title="🔑 Trigger PIN Generation"
      subtitle={`${row.orderId} · ${row.clientName} · ${row.qtyWithOverage.toLocaleString()} PINs (incl. 10% overage)`}
      width={480}
    >
      <InfoBanner style={{ marginBottom: 14 }}>
        ℹ PINs are generated as <strong>DORMANT</strong>. They activate only when the client completes a batch
        activation from their admin console. Format: 10-digit alphanumeric.
      </InfoBanner>
      <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
        {[
          ['Order', row.orderId],
          ['Batch', row.batchRef || '—'],
          [
            'PINs to generate',
            `${row.qtyWithOverage.toLocaleString()} (${row.qtyOrdered.toLocaleString()} + 10% overage)`,
          ],
          ['Assigned to', row.assignedPinName || 'Unassigned'],
          ['Format', '10-digit alphanumeric (DORMANT)'],
        ].map(([label, val]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '5px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ color: 'var(--text2)' }}>{label}</span>
            <strong style={{ fontFamily: 'var(--mono)' }}>{val}</strong>
          </div>
        ))}
      </div>
      <WarnBanner>
        ⚠ This action triggers the AI/ML endpoint. PIN generation typically completes within 2–5 minutes for
        orders under 50,000 units.
      </WarnBanner>
      <ModalFooter>
        <Button variant="secondary" onClick={close} disabled={saving}>
          Cancel
        </Button>
        <Button className="bacc" onClick={submit} disabled={saving}>
          {saving ? 'Triggering…' : '⚙ Trigger PIN Generation'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
