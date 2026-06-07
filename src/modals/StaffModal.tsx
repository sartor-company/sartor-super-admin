import { FormEvent, useEffect, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormRow2 } from '../components/patterns/FormGrid';
import { InfoBanner } from '../components/patterns/Banner';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { PLATFORM_ROLE_OPTIONS, tempPassword } from '../constants/platformStaff';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import type { PlatformStaff, RoleId } from '../types';

const emptyFields = {
  fullName: '',
  email: '',
  phone: '',
  platformRole: 'support' as RoleId,
  password: '',
  blocked: false,
};

export function StaffModal() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { staffEditId } = useApp();
  const { staff, refresh } = usePlatform();
  const [fields, setFields] = useState(emptyFields);
  const [saving, setSaving] = useState(false);

  const open = isOpen('staff');
  const editing = staffEditId
    ? (staff.find((s) => s._id === staffEditId) as PlatformStaff | undefined)
    : undefined;

  useEffect(() => {
    if (!open) return;
    if (staffEditId && editing) {
      setFields({
        fullName: editing.fullName || '',
        email: editing.email || '',
        phone: editing.phone || '',
        platformRole: editing.platformRole || 'support',
        password: '',
        blocked: !!editing.blocked,
      });
    } else if (!staffEditId) {
      setFields(emptyFields);
    }
  }, [open, staffEditId, editing]);

  const close = () => closeModal('staff');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fields.fullName.trim() || !fields.email.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const body: Record<string, unknown> = {
          fullName: fields.fullName.trim(),
          platformRole: fields.platformRole,
          blocked: fields.blocked,
        };
        if (fields.password.trim()) body.password = fields.password.trim();
        await platformApi.patchStaff(editing._id, body);
        showToast('Staff account updated.', 'success');
      } else {
        const pwd = fields.password.trim() || tempPassword();
        await platformApi.createStaff({
          fullName: fields.fullName.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim() || undefined,
          platformRole: fields.platformRole,
          password: pwd,
        });
        showToast(
          fields.password.trim()
            ? 'Staff account created.'
            : `Staff account created. Temporary password: ${pwd}`,
          'success',
        );
      }
      await refresh();
      close();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      showToast(msg || 'Could not save staff account.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async () => {
    if (!editing) return;
    const pwd = tempPassword();
    setSaving(true);
    try {
      await platformApi.patchStaff(editing._id, { password: pwd });
      await refresh();
      showToast(`Password reset. New temporary password: ${pwd}`, 'success');
    } catch {
      showToast('Could not reset password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? `Edit Staff — ${editing.fullName}` : 'Add Staff Member'}
    >
      <form onSubmit={onSubmit}>
        <FormGroup label="Full name *">
          <input
            className="inp"
            placeholder="Full name"
            value={fields.fullName}
            onChange={(e) => setFields((f) => ({ ...f, fullName: e.target.value }))}
            required
          />
        </FormGroup>
        <FormGroup label="Email (login) *">
          <input
            className="inp"
            type="email"
            placeholder="name@sartor.ng"
            value={fields.email}
            onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
            readOnly={!!editing}
            required
          />
        </FormGroup>
        <FormRow2>
          <FormGroup label="Platform role *">
            <select
              className="inp"
              value={fields.platformRole}
              onChange={(e) =>
                setFields((f) => ({ ...f, platformRole: e.target.value as RoleId }))
              }
            >
              {PLATFORM_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Phone">
            <input
              className="inp"
              placeholder="+234..."
              value={fields.phone}
              onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
            />
          </FormGroup>
        </FormRow2>
        <FormGroup label={editing ? 'New password (optional)' : 'Password (optional)'}>
          <input
            className="inp"
            type="text"
            placeholder={editing ? 'Leave blank to keep current' : 'Leave blank to auto-generate'}
            value={fields.password}
            onChange={(e) => setFields((f) => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
          />
        </FormGroup>
        {editing && (
          <FormGroup label="Account status">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={fields.blocked}
                onChange={(e) => setFields((f) => ({ ...f, blocked: e.target.checked }))}
              />
              Blocked (cannot sign in)
            </label>
          </FormGroup>
        )}
        {!editing && (
          <InfoBanner>
            If no password is set, a temporary password is generated and shown after creation.
          </InfoBanner>
        )}
        <ModalFooter>
          {editing && (
            <Button type="button" variant="secondary" onClick={onResetPassword} disabled={saving}>
              Reset password
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="bacc" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
