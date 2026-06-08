import { FormEvent, useCallback, useMemo, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormRow2 } from '../components/patterns/FormGrid';
import { SectionTitle } from '../components/patterns/SectionTitle';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import type { Client } from '../data/clients';
import { INVOICE_CATALOG } from '../data/invoiceCatalog';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/format';

type LineItem = {
  id: string;
  label: string;
  qty: number;
  price: number;
};

let lineId = 1;
function newLine(): LineItem {
  return { id: `line-${++lineId}`, label: '', qty: 1, price: 0 };
}

export function InvoiceModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { clients, refresh } = usePlatform();
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [vat, setVat] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    lineId = 1;
    setLines([newLine()]);
    setClientId('');
    setDueDate('');
    setVat(false);
    setNotes('');
  }, []);

  const totals = useMemo(() => {
    const sub = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const vatAmt = vat ? sub * 0.075 : 0;
    return { sub, vat: vatAmt, total: sub + vatAmt };
  }, [lines, vat]);

  const updateLine = (id: string, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const onCatalogPick = (id: string, value: string, label: string) => {
    const price = parseFloat(value) || 0;
    updateLine(id, { label, price });
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const handleClose = () => {
    closeModal('invoice');
    reset();
  };

  const createInvoice = async (status: 'Pending' | 'Draft') => {
    const client = (clients as Client[]).find((c) => c._id === clientId);
    if (!client?._id) {
      showToast('Select a client.', 'error');
      return;
    }
    const validLines = lines.filter((l) => l.label && l.price > 0);
    if (validLines.length === 0) {
      showToast('Add at least one line item.', 'error');
      return;
    }

    const description = validLines
      .map((l) => `${l.label}${l.qty > 1 ? ` × ${l.qty}` : ''}`)
      .join('; ');
    const fullDescription = notes.trim() ? `${description} — ${notes.trim()}` : description;

    setSaving(true);
    try {
      const dueAt = dueDate ? new Date(dueDate).getTime() : Date.now() + 14 * 86400000;
      await platformApi.createInvoice({
        adminId: client._id,
        clientName: client.name,
        clientCode: client.code,
        description: fullDescription,
        amount: totals.total,
        dueAt,
        status: 'Pending',
      });
      await refresh();
      handleClose();
      showToast(
        status === 'Draft' ? 'Invoice saved.' : 'Invoice created and ready to send.',
        'success',
      );
    } catch {
      showToast('Could not create invoice.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    createInvoice('Pending');
  };

  const defaultDue = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  }, []);

  return (
    <Modal open={isOpen('invoice')} onClose={handleClose} title="Create Invoice" width={620}>
      <form onSubmit={onSubmit}>
        <FormRow2>
          <FormGroup label="Client *">
            <select
              className="inp"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Select client...</option>
              {(clients as Client[]).map((c) => (
                <option key={c._id || c.code} value={c._id || ''}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Due date">
            <input
              type="date"
              className="inp"
              value={dueDate || defaultDue}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormGroup>
        </FormRow2>

        <SectionTitle>Line Items</SectionTitle>
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr auto',
              gap: 8,
              alignItems: 'end',
              marginBottom: 8,
            }}
          >
            <FormGroup label="Description *">
              <select
                className="inp"
                value={line.label ? `${line.price}|${line.label}` : ''}
                onChange={(e) => {
                  const opt = e.target.selectedOptions[0];
                  onCatalogPick(line.id, opt.value.split('|')[0] || opt.value, opt.text);
                }}
              >
                <option value="">Select item type...</option>
                {INVOICE_CATALOG.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.options.map((o) => (
                      <option key={o.label} value={`${o.value}|${o.label}`}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </FormGroup>
            <FormGroup label="Qty">
              <input
                type="number"
                className="inp"
                value={line.qty}
                min={1}
                onChange={(e) => updateLine(line.id, { qty: parseFloat(e.target.value) || 1 })}
              />
            </FormGroup>
            <FormGroup label="Unit Price (₦)">
              <input
                type="number"
                className="inp"
                value={line.price || ''}
                onChange={(e) => updateLine(line.id, { price: parseFloat(e.target.value) || 0 })}
              />
            </FormGroup>
            <div style={{ paddingBottom: 13 }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                style={{ color: 'var(--rt)' }}
                onClick={() => removeLine(line.id)}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addLine} style={{ marginBottom: 14 }}>
          + Add Line Item
        </Button>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 13 }}>
          <div className="srow">
            <span>Subtotal</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
              {formatNaira(totals.sub)}
            </span>
          </div>
          <div className="srow">
            <span>VAT (7.5%)</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} /> Apply VAT
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                {formatNaira(totals.vat)}
              </span>
            </label>
          </div>
          <div className="srow" style={{ fontWeight: 700, fontSize: 15 }}>
            <span>Total</span>
            <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--navy)' }}>
              {formatNaira(totals.total)}
            </span>
          </div>
        </div>

        <SectionTitle>Notes</SectionTitle>
        <FormGroup label="Notes to Client">
          <textarea
            className="inp"
            rows={2}
            style={{ resize: 'vertical' }}
            placeholder="Optional message on invoice"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormGroup>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => createInvoice('Draft')}
          >
            Save Draft
          </Button>
          <Button type="submit" className="bacc" disabled={saving}>
            {saving ? 'Creating…' : 'Create Invoice'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
