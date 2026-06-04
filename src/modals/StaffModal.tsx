import { useEffect, useState } from 'react';
import { FormRow2 } from '../components/patterns/FormGrid';
import { InfoBanner } from '../components/patterns/Banner';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { STAFF_DATA } from '../data/staff';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

export function StaffModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { staffEditName } = useApp();
  const [fields, setFields] = useState({ fn: '', ln: '', em: '', role: 'Account Manager' });

  const open = isOpen('staff');

  useEffect(() => {
    if (!open) return;
    if (staffEditName && STAFF_DATA[staffEditName]) {
      const s = STAFF_DATA[staffEditName];
      setFields({ fn: s.fn, ln: s.ln, em: s.em, role: s.role });
    } else {
      setFields({ fn: '', ln: '', em: '', role: 'Account Manager' });
    }
  }, [open, staffEditName]);

  const close = () => closeModal('staff');

  return (
    <Modal open={open} onClose={close} title={staffEditName ? `Edit Staff — ${staffEditName}` : 'Add Staff Member'}>
      <FormRow2>
        <FormGroup label="First Name *">
          <input
            className="inp"
            placeholder="First name"
            value={fields.fn}
            onChange={(e) => setFields((f) => ({ ...f, fn: e.target.value }))}
          />
        </FormGroup>
        <FormGroup label="Last Name *">
          <input
            className="inp"
            placeholder="Last name"
            value={fields.ln}
            onChange={(e) => setFields((f) => ({ ...f, ln: e.target.value }))}
          />
        </FormGroup>
      </FormRow2>
      <FormGroup label="Email (login) *">
        <input
          className="inp"
          type="email"
          placeholder="name@sartor.ng"
          value={fields.em}
          onChange={(e) => setFields((f) => ({ ...f, em: e.target.value }))}
        />
      </FormGroup>
      <FormRow2>
        <FormGroup label="Role *">
          <select className="inp" value={fields.role} onChange={(e) => setFields((f) => ({ ...f, role: e.target.value }))}>
            <option>Account Manager</option>
            <option>Operations Manager</option>
            <option>Finance Admin</option>
            <option>AI/ML Lead</option>
            <option>Platform Support</option>
            <option>Super Admin</option>
          </select>
        </FormGroup>
        <FormGroup label="Phone">
          <input className="inp" placeholder="+234..." />
        </FormGroup>
      </FormRow2>
      <InfoBanner>ℹ A welcome email with temporary password will be sent on creation.</InfoBanner>
      <ModalFooter>
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          className="bacc"
          onClick={() => {
            close();
            showToast(
              staffEditName ? 'Staff account saved.' : 'Staff account created. Welcome email sent.',
              'success',
            );
          }}
        >
          {staffEditName ? 'Save Changes' : 'Create Account'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
