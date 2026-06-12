import { FormEvent, useEffect, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormRow2 } from '../components/patterns/FormGrid';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

const ROLE_OPTIONS = [
  'Batch Admin',
  'Brand Manager',
  'CRM Admin',
  'User',
] as const;

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] || '', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export function TeamMemberModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { teamMemberClientId, teamMemberEdit, notifyTeamReload } = useApp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>(ROLE_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const open = isOpen('teammember');
  const isEdit = Boolean(teamMemberEdit?.id);
  const close = () => closeModal('teammember');

  useEffect(() => {
    if (!open) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setRole(ROLE_OPTIONS[0]);
      return;
    }
    if (teamMemberEdit) {
      const { first, last } = splitName(teamMemberEdit.name);
      setFirstName(first);
      setLastName(last);
      setEmail(teamMemberEdit.email);
      setRole(teamMemberEdit.role || ROLE_OPTIONS[0]);
    }
  }, [open, teamMemberEdit]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamMemberClientId) {
      showToast('Client context missing.', 'error');
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName || !email.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && teamMemberEdit) {
        await platformApi.patchClientUser(teamMemberClientId, teamMemberEdit.id, {
          fullName,
          userRole: role,
        });
        showToast('Team member updated.', 'success');
      } else {
        await platformApi.createClientUser(teamMemberClientId, {
          fullName,
          email: email.trim(),
          userRole: role,
        });
        showToast('Team member added. Welcome email sent.', 'success');
      }
      notifyTeamReload();
      close();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save team member.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const title = teamMemberEdit
    ? isEdit
      ? `Edit Member — ${teamMemberEdit.name}`
      : `Team Member — ${teamMemberEdit.name}`
    : 'Add Team Member';

  return (
    <Modal open={open} onClose={close} title={title}>
      <form onSubmit={onSubmit}>
        <FormRow2>
          <FormGroup label="First Name *">
            <input
              className="inp"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
              required
            />
          </FormGroup>
          <FormGroup label="Last Name *">
            <input
              className="inp"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
            />
          </FormGroup>
        </FormRow2>
        <FormGroup label="Email (login) *">
          <input
            className="inp"
            type="email"
            placeholder="name@clientdomain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving || isEdit}
            required
          />
        </FormGroup>
        <FormRow2>
          <FormGroup label="Role *">
            <select
              className="inp"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={saving}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Product Access">
            <select className="inp" defaultValue="SC + CRM" disabled>
              <option>SC + CRM</option>
            </select>
          </FormGroup>
        </FormRow2>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="bacc" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Member'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
