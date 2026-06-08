import { FormEvent, useEffect, useMemo, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormGroup } from '../components/ui/FormGroup';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import type { Client } from '../data/clients';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';

export function FollowUpModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { followUp } = useApp();
  const { clients } = usePlatform();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const open = isOpen('followup');

  const clientRecord = useMemo(() => {
    if (!followUp) return null;
    const list = clients as Client[];
    if (followUp.clientId) {
      return list.find((c) => c._id === followUp.clientId) ?? null;
    }
    return (
      list.find(
        (c) =>
          c.name === followUp.client ||
          c.name.startsWith(followUp.client) ||
          followUp.client.startsWith(c.name.split(' ')[0]),
      ) ?? null
    );
  }, [followUp, clients]);

  useEffect(() => {
    if (!open || !followUp) return;
    setSubject(followUp.subject);
    setMessage(followUp.message);
  }, [open, followUp]);

  const close = () => closeModal('followup');

  const send = async (emailClient: boolean) => {
    const adminId = clientRecord?._id;
    if (emailClient && !adminId) {
      showToast('Could not resolve client for email follow-up.', 'error');
      return;
    }
    if (!message.trim()) {
      showToast('Message is required.', 'error');
      return;
    }

    setSending(true);
    try {
      if (emailClient && adminId) {
        await platformApi.followUp(adminId, message.trim(), subject.trim() || undefined);
        showToast('Follow-up sent to client.', 'success');
      } else {
        showToast('Follow-up logged internally.', 'success');
      }
      close();
    } catch {
      showToast('Could not send follow-up.', 'error');
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(true);
  };

  return (
    <Modal open={open} onClose={close} title={`Follow Up — ${followUp?.client ?? 'Client'}`}>
      <form onSubmit={onSubmit}>
        {!clientRecord?._id && (
          <p style={{ fontSize: 12, color: 'var(--at)', marginBottom: 12 }}>
            Client record not matched — only internal log will work until the client exists in the platform.
          </p>
        )}
        <FormGroup label="Subject">
          <input
            className="inp"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Follow-up subject..."
          />
        </FormGroup>
        <FormGroup label="Message">
          <textarea
            className="inp"
            rows={4}
            style={{ resize: 'vertical' }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </FormGroup>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={sending}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={() => send(false)} disabled={sending}>
            Log Only
          </Button>
          <Button type="submit" className="bacc" disabled={sending || !clientRecord?._id}>
            {sending ? 'Sending…' : 'Send & Log'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
