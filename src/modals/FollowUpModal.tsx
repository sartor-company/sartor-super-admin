import { FormGroup } from '../components/ui/FormGroup';
import { Button } from '../components/ui/Button';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

export function FollowUpModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { followUp } = useApp();

  const close = () => closeModal('followup');

  return (
    <Modal open={isOpen('followup')} onClose={close} title={`Follow Up — ${followUp?.client ?? 'Client'}`}>
      <FormGroup label="Contact Channel">
        <select className="inp" defaultValue="Account Owner — Primary Email">
          <option>Account Owner — Primary Email</option>
          <option>WhatsApp</option>
          <option>Email & WhatsApp</option>
        </select>
      </FormGroup>
      <FormGroup label="Subject">
        <input className="inp" key={followUp?.subject} defaultValue={followUp?.subject ?? ''} placeholder="Follow-up subject..." />
      </FormGroup>
      <FormGroup label="Message">
        <textarea
          className="inp"
          rows={4}
          key={followUp?.message}
          style={{ resize: 'vertical' }}
          defaultValue={followUp?.message ?? ''}
        />
      </FormGroup>
      <FormGroup label="Internal Note (optional)">
        <textarea className="inp" rows={2} style={{ resize: 'vertical' }} placeholder="Log what happened for internal record..." />
      </FormGroup>
      <ModalFooter>
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => { close(); showToast('Follow-up logged internally.'); }}>
          Log Only
        </Button>
        <Button className="bacc" onClick={() => { close(); showToast('Follow-up sent to client.', 'success'); }}>
          Send & Log
        </Button>
      </ModalFooter>
    </Modal>
  );
}
