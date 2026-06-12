import { FormEvent, useEffect, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormRow2 } from '../components/patterns/FormGrid';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import type { Client } from '../data/clients';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';

export function NewInvestigationModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { clients, staff, refresh } = usePlatform();

  const [clientId, setClientId] = useState('');
  const [batch, setBatch] = useState('');
  const [severity, setSeverity] = useState<'P1' | 'P2' | 'P3'>('P2');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const open = isOpen('new-investigation');
  const close = () => closeModal('new-investigation');

  useEffect(() => {
    if (!open) {
      setClientId('');
      setBatch('');
      setSeverity('P2');
      setAssignedTo('');
      setDescription('');
    }
  }, [open]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const client = (clients as Client[]).find((c) => c._id === clientId);
    if (!client?._id) {
      showToast('Select a client.', 'error');
      return;
    }
    if (!batch.trim()) {
      showToast('Batch is required.', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Description is required.', 'error');
      return;
    }

    const assignee = staff.find((s) => s._id === assignedTo);

    setSaving(true);
    try {
      const res = (await platformApi.createInvestigation({
        adminId: client._id,
        clientName: client.name,
        clientCode: client.code,
        batch: batch.trim(),
        severity,
        description: description.trim(),
        assignedTo: assignee?._id,
        assignedName: assignee?.fullName,
      })) as { investigationId?: string };
      await refresh();
      close();
      showToast(
        `Investigation ${res.investigationId || ''} logged.`.trim(),
        'warn',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not log investigation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Log New Investigation">
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
          <FormGroup label="Batch *">
            <input
              className="inp"
              placeholder="e.g. BATCH-NK-020"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              required
            />
          </FormGroup>
        </FormRow2>
        <FormRow2>
          <FormGroup label="Severity *">
            <select
              className="inp"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as 'P1' | 'P2' | 'P3')}
            >
              <option value="P1">P1 — Critical</option>
              <option value="P2">P2 — High</option>
              <option value="P3">P3 — Medium</option>
            </select>
          </FormGroup>
          <FormGroup label="Assign To">
            <select
              className="inp"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.platformRole})
                </option>
              ))}
            </select>
          </FormGroup>
        </FormRow2>
        <FormGroup label="Description *">
          <textarea
            className="inp"
            rows={4}
            style={{ resize: 'vertical' }}
            placeholder="Describe the suspected counterfeiting or mismatch..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </FormGroup>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={saving}>
            {saving ? 'Logging…' : 'Log Investigation'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
