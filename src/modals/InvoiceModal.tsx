import { useCallback, useMemo, useState } from 'react';
import { FormRow2 } from '../components/patterns/FormGrid';
import { SectionTitle } from '../components/patterns/SectionTitle';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { CLIENTS } from '../data/clients';
import { INVOICE_CATALOG } from '../data/invoiceCatalog';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/format';

type LineItem = {
  id: string;
  qty: number;
  price: number;
};

let lineId = 1;
function newLine(): LineItem {
  return { id: `line-${++lineId}`, qty: 1, price: 0 };
}

export function InvoiceModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [vat, setVat] = useState(false);

  const reset = useCallback(() => {
    lineId = 1;
    setLines([newLine()]);
    setVat(false);
  }, []);

  const totals = useMemo(() => {
    const sub = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const vatAmt = vat ? sub * 0.075 : 0;
    return { sub, vat: vatAmt, total: sub + vatAmt };
  }, [lines, vat]);

  const updateLine = (id: string, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const handleClose = () => {
    closeModal('invoice');
    reset();
  };

  return (
    <Modal open={isOpen('invoice')} onClose={handleClose} title="Create Invoice" width={620}>
      <FormRow2>
        <FormGroup label="Client *">
          <select className="inp">
            <option>Select client...</option>
            {CLIENTS.map((c) => (
              <option key={c.code}>{c.name}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Invoice Reference">
          <input className="inp" readOnly defaultValue="INV-2026-050" />
        </FormGroup>
      </FormRow2>
      <FormRow2>
        <FormGroup label="Invoice Date">
          <input type="date" className="inp" defaultValue="2026-05-12" />
        </FormGroup>
        <FormGroup label="Due Date">
          <input type="date" className="inp" defaultValue="2026-05-26" />
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
              onChange={(e) => updateLine(line.id, { price: parseFloat(e.target.value) || 0 })}
            >
              <option value="">Select item type...</option>
              {INVOICE_CATALOG.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((o) => (
                    <option key={o.label} value={o.value}>
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
              onChange={(e) => updateLine(line.id, { qty: parseFloat(e.target.value) || 0 })}
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
            <Button variant="secondary" size="sm" style={{ color: 'var(--rt)' }} onClick={() => removeLine(line.id)}>
              ✕
            </Button>
          </div>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addLine} style={{ marginBottom: 14 }}>
        + Add Line Item
      </Button>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 13 }}>
        <div className="srow">
          <span>Subtotal</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{formatNaira(totals.sub)}</span>
        </div>
        <div className="srow">
          <span>VAT (7.5%)</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} /> Apply VAT
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{formatNaira(totals.vat)}</span>
          </label>
        </div>
        <div className="srow" style={{ fontWeight: 700, fontSize: 15 }}>
          <span>Total</span>
          <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--navy)' }}>{formatNaira(totals.total)}</span>
        </div>
      </div>

      <SectionTitle>Payment & Notes</SectionTitle>
      <FormRow2>
        <FormGroup label="Currency">
          <select className="inp">
            <option>NGN — Nigerian Naira (₦)</option>
            <option>USD — US Dollar ($)</option>
          </select>
        </FormGroup>
        <FormGroup label="Payment Reference">
          <input className="inp" placeholder="Transfer ref, PO number..." />
        </FormGroup>
      </FormRow2>
      <FormGroup label="Notes to Client">
        <textarea className="inp" rows={2} style={{ resize: 'vertical' }} placeholder="Optional message on invoice" />
      </FormGroup>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            handleClose();
            showToast('Invoice saved as draft.');
          }}
        >
          Save Draft
        </Button>
        <Button
          className="bacc"
          onClick={() => {
            handleClose();
            showToast('Invoice INV-2026-050 created and sent to client.', 'success');
          }}
        >
          Create & Send Invoice
        </Button>
      </ModalFooter>
    </Modal>
  );
}
