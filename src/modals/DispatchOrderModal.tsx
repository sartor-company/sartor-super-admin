import { FormEvent, useEffect, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormRow2 } from '../components/patterns/FormGrid';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';

const COURIERS = ['GIG Logistics', 'DHL Express', 'FedEx Nigeria', 'ABC Transport', 'Client collecting'];

export function DispatchOrderModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { dispatchTarget, clearDispatchTarget } = useApp();
  const { refreshStickerOrders } = usePlatform();

  const [courier, setCourier] = useState(COURIERS[0]);
  const [tracking, setTracking] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [estDelivery, setEstDelivery] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const open = isOpen('dispatch-order');
  const row = dispatchTarget;

  useEffect(() => {
    if (!open) {
      setCourier(COURIERS[0]);
      setTracking('');
      setDispatchDate('');
      setEstDelivery('');
      setAddress('');
      setContact('');
      setNotes('');
    }
  }, [open]);

  const close = () => {
    closeModal('dispatch-order');
    clearDispatchTarget();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!row) return;
    setSaving(true);
    try {
      await platformApi.patchStickerOrder(row._id, {
        action: 'dispatch',
        courier,
        trackingNumber: tracking.trim(),
        deliveryAddress: address.trim(),
        receivingContact: contact.trim(),
        dispatchNotes: [notes.trim(), dispatchDate ? `Dispatch: ${dispatchDate}` : '', estDelivery ? `ETA: ${estDelivery}` : '']
          .filter(Boolean)
          .join(' · '),
      });
      await refreshStickerOrders();
      showToast('Dispatch logged. Tracking saved. Client notified.', 'success');
      close();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not log dispatch.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!row) return null;

  return (
    <Modal
      open={open}
      onClose={close}
      title="✉ Book Courier & Dispatch"
      subtitle={`${row.orderId} · ${row.clientName} · ${row.qtyWithOverage.toLocaleString()} printed stickers`}
      width={480}
    >
      <form onSubmit={submit}>
        <FormRow2 style={{ marginBottom: 12 }}>
          <FormGroup label="Courier Service *">
            <select className="inp" value={courier} onChange={(e) => setCourier(e.target.value)}>
              {COURIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Waybill / Tracking No.">
            <input
              className="inp"
              placeholder="e.g. GL-2026-05-001"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
          </FormGroup>
        </FormRow2>
        <FormRow2 style={{ marginBottom: 12 }}>
          <FormGroup label="Dispatch Date *">
            <input type="date" className="inp" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} required />
          </FormGroup>
          <FormGroup label="Est. Delivery Date">
            <input type="date" className="inp" value={estDelivery} onChange={(e) => setEstDelivery(e.target.value)} />
          </FormGroup>
        </FormRow2>
        <FormGroup label="Delivery Address (confirm with client)" style={{ marginBottom: 12 }}>
          <textarea
            className="inp"
            rows={2}
            placeholder="Client warehouse or registered address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </FormGroup>
        <FormGroup label="Receiving Contact at Client" style={{ marginBottom: 12 }}>
          <input
            className="inp"
            placeholder="Name and phone number"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Notes">
          <input
            className="inp"
            placeholder="e.g. fragile — handle with care"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button className="bacc" type="submit" disabled={saving}>
            {saving ? 'Saving…' : '✓ Confirm Dispatch & Notify Client'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
