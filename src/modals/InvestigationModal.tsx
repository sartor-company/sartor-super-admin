import { FormRow2 } from '../components/patterns/FormGrid';
import { InvestigationBanner } from '../components/patterns/InvestigationBanner';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

export function InvestigationModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { investigation } = useApp();

  const close = () => closeModal('investigation');

  return (
    <Modal
      open={isOpen('investigation')}
      onClose={close}
      title={investigation?.id ?? 'Investigation'}
      subtitle={
        investigation ? `${investigation.client} · ${investigation.batch} · ${investigation.severity}` : undefined
      }
      width={620}
    >
      {investigation && <InvestigationBanner investigation={investigation} />}
      <div className="fg">
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Description</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', padding: 10, background: 'var(--bg)', borderRadius: 7 }}>
          {investigation?.desc}
        </div>
      </div>
      <FormRow2>
        <FormGroup label="Status">
          <select className="inp" defaultValue="In Progress">
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
        </FormGroup>
        <FormGroup label="Assigned To">
          <select className="inp">
            <option>Chidi Ogu (Support)</option>
            <option>Emeka Nnaji (Ops)</option>
            <option>Nwachukwu Confidence (CEO)</option>
            <option>Unassigned</option>
          </select>
        </FormGroup>
      </FormRow2>
      <FormGroup label="Investigation Notes">
        <textarea
          className="inp"
          rows={3}
          style={{ resize: 'vertical' }}
          placeholder="Add findings, actions taken, next steps..."
        />
      </FormGroup>
      <ModalFooter>
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
        <Button variant="secondary" onClick={() => { close(); showToast('Investigation updated.'); }}>
          Save & Keep Open
        </Button>
        <Button variant="success" onClick={() => { close(); showToast('Investigation marked as resolved.', 'success'); }}>
          Mark Resolved
        </Button>
      </ModalFooter>
    </Modal>
  );
}
