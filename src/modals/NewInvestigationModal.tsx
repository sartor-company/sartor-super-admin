import { FormRow2 } from '../components/patterns/FormGrid';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { CLIENTS } from '../data/clients';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

export function NewInvestigationModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const close = () => closeModal('new-investigation');

  return (
    <Modal open={isOpen('new-investigation')} onClose={close} title="Log New Investigation">
      <FormRow2>
        <FormGroup label="Client *">
          <select className="inp">
            <option>Select client...</option>
            {CLIENTS.slice(0, 4).map((c) => (
              <option key={c.code}>{c.name}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Batch *">
          <input className="inp" placeholder="e.g. BATCH-NK-020" />
        </FormGroup>
      </FormRow2>
      <FormRow2>
        <FormGroup label="Severity *">
          <select className="inp">
            <option>P1 — Critical</option>
            <option>P2 — High</option>
            <option>P3 — Medium</option>
          </select>
        </FormGroup>
        <FormGroup label="Assign To">
          <select className="inp">
            <option>Chidi Ogu</option>
            <option>Emeka Nnaji</option>
            <option>Unassigned</option>
          </select>
        </FormGroup>
      </FormRow2>
      <FormGroup label="Description *">
        <textarea
          className="inp"
          rows={4}
          style={{ resize: 'vertical' }}
          placeholder="Describe the suspected counterfeiting or mismatch..."
        />
      </FormGroup>
      <ModalFooter>
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => { close(); showToast('Investigation INV-2026-113 logged.', 'warn'); }}>
          Log Investigation
        </Button>
      </ModalFooter>
    </Modal>
  );
}
