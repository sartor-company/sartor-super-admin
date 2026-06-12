import { useEffect, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormRow2 } from '../components/patterns/FormGrid';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;

export function TicketDetailModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { activeTicket } = useApp();
  const { staff, refresh } = usePlatform();

  const [status, setStatus] = useState('Open');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  const open = isOpen('ticket-detail');
  const close = () => closeModal('ticket-detail');
  const patchId = activeTicket?._id || activeTicket?.id;

  useEffect(() => {
    if (!open || !activeTicket) return;
    setStatus(activeTicket.status || 'Open');
    setAssignedTo(activeTicket.assignedTo || '');
  }, [open, activeTicket]);

  const save = async (nextStatus?: string) => {
    if (!patchId) {
      showToast('Ticket id missing.', 'error');
      return;
    }
    const assignee = staff.find((s) => s._id === assignedTo);
    setSaving(true);
    try {
      await platformApi.patchTicket(patchId, {
        status: nextStatus || status,
        assignedTo: assignee?._id || null,
        assignedName: assignee?.fullName || null,
      });
      await refresh();
      close();
      showToast(
        nextStatus === 'Resolved' || nextStatus === 'Closed'
          ? 'Ticket resolved.'
          : 'Ticket updated.',
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update ticket.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={activeTicket?.id ?? 'Support Ticket'}
      subtitle={activeTicket ? `${activeTicket.client} · ${activeTicket.priority || 'P2'}` : undefined}
      width={580}
    >
      <div className="fg">
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Description</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', padding: 10, background: 'var(--bg)', borderRadius: 7 }}>
          {activeTicket?.description}
        </div>
      </div>
      <FormRow2>
        <FormGroup label="Status">
          <select
            className="inp"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Assigned To">
          <select
            className="inp"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            disabled={saving}
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
      <ModalFooter>
        <Button variant="secondary" onClick={close} disabled={saving}>
          Close
        </Button>
        <Button variant="secondary" onClick={() => save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="success" onClick={() => save('Resolved')} disabled={saving}>
          Mark Resolved
        </Button>
      </ModalFooter>
    </Modal>
  );
}
