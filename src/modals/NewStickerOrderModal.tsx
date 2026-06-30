import { FormEvent, useEffect, useMemo, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormRow2 } from '../components/patterns/FormGrid';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { calcStickerOverage } from '../data/stickerOrders';

export function NewStickerOrderModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { clients, staff, refreshStickerOrders } = usePlatform();
  const open = isOpen('sticker-order');

  const [adminId, setAdminId] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productName, setProductName] = useState('');
  const [qty, setQty] = useState('');
  const [batchRef, setBatchRef] = useState('');
  const [assignedPinTo, setAssignedPinTo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<{ sku: string; name: string; id: string }[]>([]);

  const aimlStaff = useMemo(
    () => staff.filter((s) => s.platformRole === 'aiml'),
    [staff],
  );

  const activeClients = useMemo(
    () => clients.filter((c) => c.accountStatus === 'active' || c.status === 'Active'),
    [clients],
  );

  useEffect(() => {
    if (!open) {
      setAdminId('');
      setProductSku('');
      setProductName('');
      setQty('');
      setBatchRef('');
      setAssignedPinTo('');
      setNotes('');
      setProducts([]);
      return;
    }
    if (aimlStaff.length === 1) setAssignedPinTo(aimlStaff[0]._id);
  }, [open, aimlStaff]);

  useEffect(() => {
    if (!adminId) {
      setProducts([]);
      return;
    }
    const client = activeClients.find((c) => c._id === adminId);
    if (!client?.code) return;
    platformApi
      .client(client.code)
      .then((res) => {
        const raw = res as {
          products?: { _id: string; productId?: string; productName?: string }[];
        };
        setProducts(
          (raw.products || []).map((p) => ({
            id: p._id,
            sku: p.productId || p._id,
            name: p.productName || '',
          })),
        );
      })
      .catch(() => setProducts([]));
  }, [adminId, activeClients]);

  const overage = calcStickerOverage(parseInt(qty, 10) || 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const qtyN = parseInt(qty, 10);
    if (!adminId || !qtyN || qtyN < 1) {
      showToast('Client and quantity are required.', 'error');
      return;
    }
    if (!productSku.trim() && !productName.trim()) {
      showToast('SKU / product is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const selected = products.find((p) => p.sku === productSku);
      await platformApi.createStickerOrder({
        adminId,
        productId: selected?.id,
        sku: productSku.trim(),
        productName: productName.trim() || selected?.name,
        qtyOrdered: qtyN,
        batchRef: batchRef.trim(),
        assignedPinTo: assignedPinTo || undefined,
        notes: notes.trim(),
      });
      await refreshStickerOrders();
      closeModal('sticker-order');
      showToast('Sticker order created. PIN generation queued.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={() => closeModal('sticker-order')} title="+ New Sticker Order" width={520}>
      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: -8, marginBottom: 14 }}>
        Log a sticker order request from a client
      </p>
      <form onSubmit={submit}>
        <FormRow2 style={{ marginBottom: 10 }}>
          <FormGroup label="Client *">
            <select className="inp" value={adminId} onChange={(e) => setAdminId(e.target.value)} required>
              <option value="">Select client...</option>
              {activeClients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="SKU / Product *">
            {products.length ? (
              <select
                className="inp"
                value={productSku}
                onChange={(e) => {
                  const sku = e.target.value;
                  setProductSku(sku);
                  const p = products.find((x) => x.sku === sku);
                  if (p) setProductName(p.name);
                }}
              >
                <option value="">Select SKU...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.sku}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="inp"
                placeholder="SKU code"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
              />
            )}
          </FormGroup>
        </FormRow2>
        <FormRow2 style={{ marginBottom: 10 }}>
          <FormGroup label="Quantity Requested *">
            <input
              type="number"
              className="inp"
              min={1}
              placeholder="e.g. 10,000"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Quantity + 10% Overage (auto)">
            <input className="inp" readOnly style={{ background: 'var(--bg2)' }} value={overage ? overage.toLocaleString() : ''} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              Sartor applies 10% overage automatically
            </div>
          </FormGroup>
        </FormRow2>
        <FormRow2 style={{ marginBottom: 10 }}>
          <FormGroup label="Batch Reference">
            <input
              className="inp"
              placeholder="e.g. BTH-2026-05A"
              value={batchRef}
              onChange={(e) => setBatchRef(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Assign to (PIN generation)">
            <select className="inp" value={assignedPinTo} onChange={(e) => setAssignedPinTo(e.target.value)}>
              <option value="">Assign later</option>
              {aimlStaff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} (AI/ML)
                </option>
              ))}
            </select>
          </FormGroup>
        </FormRow2>
        <FormGroup label="Notes">
          <input
            className="inp"
            placeholder="e.g. urgent — client needs by May 15"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={() => closeModal('sticker-order')} disabled={saving}>
            Cancel
          </Button>
          <Button className="bacc" type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create Order & Queue PINs'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
