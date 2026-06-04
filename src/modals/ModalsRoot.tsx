import { useEffect, useState } from 'react';
import { FormRow2 } from '../components/patterns/FormGrid';
import { InfoBanner, WarnBanner } from '../components/patterns/Banner';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { CLIENTS } from '../data/clients';
import { calcConversionPreview } from '../utils/pricing';
import { formatNaira } from '../utils/format';
import { FollowUpModal } from './FollowUpModal';
import { InvestigationModal } from './InvestigationModal';
import { InvoiceModal } from './InvoiceModal';
import { NewInvestigationModal } from './NewInvestigationModal';
import { OnboardWizard } from './OnboardWizard';
import { StaffModal } from './StaffModal';

export function ModalsRoot() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const { teamMemberEditName, selectedClient, submitClientNote } = useApp();

  const [crmTierSel, setCrmTierSel] = useState(1);
  const [uploadConsent, setUploadConsent] = useState(false);
  const [note, setNote] = useState('');
  const [convSkus, setConvSkus] = useState('');
  const [seats, setSeats] = useState(12);

  const uploadOpen = isOpen('upload-images');
  useEffect(() => {
    if (!uploadOpen) setUploadConsent(false);
  }, [uploadOpen]);

  const seatPreview = () => {
    const monthly = seats * 25000;
    const diff = seats - 12;
    const diffTxt =
      diff === 0 ? '(no change)' : diff > 0 ? `(+${diff} seats added)` : `(${Math.abs(diff)} seats removed)`;
    return `New monthly total: ${formatNaira(monthly)} — ₦25,000/seat/month ${diffTxt}`;
  };

  const convPrev = calcConversionPreview(parseInt(convSkus, 10) || 0);

  return (
    <>
      <Modal open={isOpen('onboard')} onClose={() => closeModal('onboard')} width={600}>
        <OnboardWizard />
      </Modal>

      <InvoiceModal />
      <StaffModal />
      <FollowUpModal />
      <InvestigationModal />
      <NewInvestigationModal />

      <Modal
        open={isOpen('teammember')}
        onClose={() => closeModal('teammember')}
        title={teamMemberEditName ? `Edit Member — ${teamMemberEditName}` : 'Add Team Member'}
      >
        <FormRow2>
          <FormGroup label="First Name *">
            <input className="inp" placeholder="First name" />
          </FormGroup>
          <FormGroup label="Last Name *">
            <input className="inp" placeholder="Last name" />
          </FormGroup>
        </FormRow2>
        <FormGroup label="Email (login) *">
          <input className="inp" type="email" placeholder="name@clientdomain.com" />
        </FormGroup>
        <FormRow2>
          <FormGroup label="Role *">
            <select className="inp" defaultValue="Account Owner">
              <option>Account Owner</option>
              <option>Batch Admin</option>
              <option>Brand Manager</option>
              <option>CRM Admin</option>
            </select>
          </FormGroup>
          <FormGroup label="Product Access *">
            <select className="inp" defaultValue="SC + CRM">
              <option>SartorChain (SC)</option>
              <option>Sartor CRM</option>
              <option>SC + CRM</option>
            </select>
          </FormGroup>
        </FormRow2>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('teammember')}>
            Cancel
          </Button>
          <Button
            className="bacc"
            onClick={() => {
              closeModal('teammember');
              showToast('Team member added. Welcome email sent.', 'success');
            }}
          >
            Add Member
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('addnote')} onClose={() => closeModal('addnote')} title="Add Internal Note">
        <FormGroup label="Note">
          <textarea
            className="inp"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ resize: 'vertical' }}
            placeholder="Enter internal note about this client..."
          />
        </FormGroup>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
          Visible to all Sartor staff. Not visible to client.
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('addnote')}>
            Cancel
          </Button>
          <Button
            className="bacc"
            onClick={() => {
              if (!note.trim()) {
                showToast('Please enter a note.', 'error');
                return;
              }
              submitClientNote(note.trim());
              closeModal('addnote');
              setNote('');
              showToast('Note added.', 'success');
            }}
          >
            Add Note
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('seatadj')} onClose={() => closeModal('seatadj')} title="Adjust CRM Seat Count">
        <div
          style={{
            padding: '9px 11px',
            background: 'var(--bb)',
            borderRadius: 7,
            fontSize: 12,
            color: 'var(--bt)',
            marginBottom: 14,
          }}
        >
          Current: <strong>12 active seats</strong> · ₦25,000/seat/month · All CRM tiers billed per seat per month.
        </div>
        <FormGroup label="New Seat Count *">
          <input type="number" className="inp" value={seats} min={1} onChange={(e) => setSeats(parseInt(e.target.value, 10) || 0)} />
        </FormGroup>
        <div style={{ padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginBottom: 14 }}>
          {seatPreview()}
        </div>
        <FormGroup label="Effective From">
          <select className="inp">
            <option>Next billing cycle (May 30, 2026)</option>
            <option>Immediately (pro-rated)</option>
          </select>
        </FormGroup>
        <FormGroup label="Reason (internal)">
          <input className="inp" placeholder="e.g. Client added 3 new sales reps" />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('seatadj')}>
            Cancel
          </Button>
          <Button
            className="bacc"
            onClick={() => {
              closeModal('seatadj');
              showToast('Seat count updated. Client notified.', 'success');
            }}
          >
            Confirm Adjustment
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('crm-tier')} onClose={() => closeModal('crm-tier')} title="Change CRM Tier" width={560}>
        <InfoBanner>ℹ Tier change takes effect next billing cycle unless specified.</InfoBanner>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { name: 'Sales Navigator', price: '₦5,000', desc: 'Basic sales management' },
            { name: 'Sales Navigator Plus', price: '₦12,000', desc: 'Advanced reporting & routing' },
            { name: 'CRM 360', price: '₦25,000', desc: 'Full SC + DORA integration' },
          ].map((tier, i) => (
            <div
              key={tier.name}
              className={`crm-tier ${crmTierSel === i ? 'sel' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setCrmTierSel(i)}
              onKeyDown={(e) => e.key === 'Enter' && setCrmTierSel(i)}
            >
              <div className="ct-name">{tier.name}</div>
              <div className="ct-price">{tier.price}/seat/month</div>
              <div className="ct-desc">{tier.desc}</div>
            </div>
          ))}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('crm-tier')}>
            Cancel
          </Button>
          <Button
            className="bacc"
            onClick={() => {
              closeModal('crm-tier');
              showToast('CRM tier updated. Invoice will be generated at next billing cycle.', 'success');
            }}
          >
            Confirm Tier Change
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('ticket')} onClose={() => closeModal('ticket')} title="Log Support Ticket">
        <FormGroup label="Client *">
          <select className="inp">
            {CLIENTS.map((c) => (
              <option key={c.code}>{c.name}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Description *">
          <textarea className="inp" rows={4} style={{ resize: 'vertical' }} />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('ticket')}>
            Cancel
          </Button>
          <Button className="bacc" onClick={() => { closeModal('ticket'); showToast('Ticket TKT-2026-097 created.', 'success'); }}>
            Create Ticket
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('escalate')} onClose={() => closeModal('escalate')} title="Escalate Ticket">
        <WarnBanner>⚠ Escalating notifies the CEO and Operations Manager immediately.</WarnBanner>
        <FormGroup label="Escalation Reason *">
          <textarea className="inp" rows={3} style={{ resize: 'vertical' }} />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('escalate')}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => { closeModal('escalate'); showToast('Ticket escalated. CEO & Ops Manager notified.', 'warn'); }}>
            Escalate Now
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('domain-upgrade')} onClose={() => closeModal('domain-upgrade')} title="Domain Upgrade">
        <WarnBanner>⚠ Requires engineering provisioning.</WarnBanner>
        <FormGroup label="Target Domain">
          <input className="inp" placeholder="e.g. verify-shc.sartor.ng" />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('domain-upgrade')}>
            Cancel
          </Button>
          <Button className="bacc" onClick={() => { closeModal('domain-upgrade'); showToast('Domain upgrade request submitted.', 'success'); }}>
            Submit Request
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('convert')} onClose={() => closeModal('convert')} title="Convert Pilot to Full Deployment">
        <div style={{ padding: '9px 11px', background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginBottom: 14 }}>
          ✓ Pilot credit ₦3,500,000 applied. Effective onboarding fee: <strong>₦1,000,000</strong>.
        </div>
        <FormGroup label="Number of SKUs for Annual Licence *">
          <input type="number" className="inp" value={convSkus} onChange={(e) => setConvSkus(e.target.value)} />
        </FormGroup>
        <div style={convPrev.style} dangerouslySetInnerHTML={{ __html: convPrev.html }} />
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('convert')}>
            Cancel
          </Button>
          <Button className="bacc" onClick={() => { closeModal('convert'); showToast('Pilot converted to Full Deployment.', 'success'); }}>
            Confirm Conversion
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('model-review')} onClose={() => closeModal('model-review')} title="Request Image Re-Submission">
        <WarnBanner>⚠ Model scored below 70-point threshold. Client will be notified to resubmit reference images.</WarnBanner>
        <FormGroup label="Reason (communicated to client)">
          <textarea className="inp" rows={3} style={{ resize: 'vertical' }} placeholder="Describe the image quality issue..." />
        </FormGroup>
        <FormGroup label="Guidance for Client">
          <textarea
            className="inp"
            rows={2}
            style={{ resize: 'vertical' }}
            placeholder="e.g. Ensure consistent lighting, cover all label angles..."
          />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('model-review')}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => { closeModal('model-review'); showToast('Resubmission request sent to client.', 'warn'); }}>
            Send Request
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('upload-images')} onClose={() => closeModal('upload-images')} title="Upload Reference Images for Client">
        <WarnBanner>
          ⚠ Only where client has provided physical samples and consented. Your identity will be logged against these uploads.
        </WarnBanner>
        <FormGroup label="Confirmation">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={uploadConsent} onChange={(e) => setUploadConsent(e.target.checked)} />
            Client has provided physical samples and authorised Sartor to upload on their behalf.
          </label>
        </FormGroup>
        <FormGroup label="Images">
          <input type="file" className="inp" multiple accept="image/*" style={{ padding: 6 }} />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('upload-images')}>
            Cancel
          </Button>
          <Button
            className="bacc"
            onClick={() => {
              if (!uploadConsent) {
                showToast('Confirm client authorisation first.', 'error');
                return;
              }
              closeModal('upload-images');
              showToast('Images uploaded. Training begins within 1 hour.', 'success');
            }}
          >
            Upload & Begin Training
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isOpen('assign')} onClose={() => closeModal('assign')} title="Assign to Staff Member">
        <FormGroup label="Assign To *">
          <select className="inp">
            <option>Amaka Eze (Account Manager)</option>
            <option>Emeka Nnaji (Ops Manager)</option>
            <option>Chidi Ogu (Platform Support)</option>
            <option>Samuel Okon (AI/ML Lead)</option>
          </select>
        </FormGroup>
        <FormGroup label="Priority">
          <select className="inp">
            <option>Normal</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('assign')}>
            Cancel
          </Button>
          <Button className="bacc" onClick={() => { closeModal('assign'); showToast('Task assigned. Staff member notified.', 'success'); }}>
            Assign
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={isOpen('edit-client')}
        onClose={() => closeModal('edit-client')}
        title={`Edit Client${selectedClient ? ` — ${selectedClient.name}` : ''}`}
      >
        <FormGroup label="Company Name">
          <input className="inp" defaultValue={selectedClient?.name ?? ''} />
        </FormGroup>
        <FormGroup label="RC Number">
          <input className="inp" readOnly defaultValue={selectedClient?.rc ?? ''} />
        </FormGroup>
        <ModalFooter>
          <Button variant="danger" style={{ marginRight: 'auto' }} onClick={() => { closeModal('edit-client'); showToast('Client suspended.', 'warn'); }}>
            Suspend Client
          </Button>
          <Button variant="secondary" onClick={() => closeModal('edit-client')}>
            Cancel
          </Button>
          <Button className="bacc" onClick={() => { closeModal('edit-client'); showToast('Client details updated.', 'success'); }}>
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
