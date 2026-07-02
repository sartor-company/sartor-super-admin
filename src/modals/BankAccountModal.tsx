import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import type { BankAccount } from '../types';

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR'];
const STATUSES = ['Primary', 'Active', 'Inactive'];

function emptyAccount(): BankAccount {
  return {
    currency: 'NGN',
    bank: '',
    accountName: 'Sartor Limited',
    accountNumber: '',
    status: 'Active',
  };
}

export function BankAccountModal({
  open,
  account,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  account: BankAccount | null;
  onClose: () => void;
  onSave: (account: BankAccount) => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<BankAccount>(emptyAccount());

  useEffect(() => {
    setForm(account ? { ...account } : emptyAccount());
  }, [account, open]);

  const canSave =
    form.bank.trim() && form.accountName.trim() && form.accountNumber.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account?._id ? 'Edit Bank Account' : 'Add Bank Account'}
      subtitle="Shown on client invoices for payment"
      width={480}
    >
      <div className="fr2">
        <FormGroup label="Currency">
          <select
            className="inp"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Status">
          <select
            className="inp"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FormGroup>
      </div>
      <FormGroup label="Bank">
        <input
          className="inp"
          placeholder="e.g. Guaranty Trust Bank"
          value={form.bank}
          onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
        />
      </FormGroup>
      <FormGroup label="Account Name">
        <input
          className="inp"
          value={form.accountName}
          onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
        />
      </FormGroup>
      <FormGroup label="Account Number">
        <input
          className="inp"
          placeholder="e.g. 0123456789"
          value={form.accountNumber}
          onChange={(e) =>
            setForm((f) => ({ ...f, accountNumber: e.target.value }))
          }
        />
      </FormGroup>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="bacc"
          disabled={!canSave || saving}
          onClick={() => onSave(form)}
        >
          {saving ? 'Saving…' : account?._id ? 'Save changes' : 'Add account'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
