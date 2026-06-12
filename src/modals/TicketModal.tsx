import { FormEvent, useEffect, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormGroup } from '../components/ui/FormGroup';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import type { Client } from '../data/clients';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';

export function TicketModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { clients, refresh } = usePlatform();
  const [clientId, setClientId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('P2');
  const [saving, setSaving] = useState(false);

  const open = isOpen('ticket');

  useEffect(() => {
    if (!open) {
      setClientId('');
      setSubject('');
      setDescription('');
      setPriority('P2');
    }
  }, [open]);

  const close = () => closeModal('ticket');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const client = (clients as Client[]).find((c) => c._id === clientId);
    if (!client?._id) {
      showToast('Select a client.', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Description is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await platformApi.createTicket({
        adminId: client._id,
        clientName: client.name,
        clientCode: client.code,
        subject: subject.trim() || undefined,
        description: description.trim(),
        priority,
      }) as { ticketId?: string };
      await refresh();
      close();
      showToast(`Ticket ${res.ticketId || ''} created.`.trim(), 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create ticket.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Log Support Ticket">
      <form onSubmit={onSubmit}>
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
        <FormGroup label="Subject">
          <input
            className="inp"
            placeholder="Brief summary"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Description *">
          <textarea
            className="inp"
            rows={4}
            style={{ resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </FormGroup>
        <FormGroup label="Priority">
          <select className="inp" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="P1">P1 — Critical</option>
            <option value="P2">P2 — Normal</option>
            <option value="P3">P3 — Low</option>
          </select>
        </FormGroup>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="bacc" disabled={saving}>
            {saving ? 'Creating…' : 'Create Ticket'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
