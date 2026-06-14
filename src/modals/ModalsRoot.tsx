import { useEffect, useState } from 'react';
import { platformApi } from '../api/platform';
import { FormRow2 } from '../components/patterns/FormGrid';
import { InfoBanner, WarnBanner } from '../components/patterns/Banner';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { calcConversionPreview } from '../utils/pricing';
import { formatNaira } from '../utils/format';
import { FollowUpModal } from './FollowUpModal';
import { InvestigationModal } from './InvestigationModal';
import { InvoiceModal } from './InvoiceModal';
import { NewInvestigationModal } from './NewInvestigationModal';
import { OnboardWizard } from './OnboardWizard';
import { StaffModal } from './StaffModal';
import { TeamMemberModal } from './TeamMemberModal';
import { TicketDetailModal } from './TicketDetailModal';
import { TicketModal } from './TicketModal';

const CRM_TIERS = [
  'Sales Navigator',
  'Sales Navigator Plus',
  'CRM 360',
] as const;

export function ModalsRoot() {
  const { isOpen, closeModal } = useModal();
  const { showToast } = useToast();
  const {
    selectedClient,
    submitClientNote,
    onboardingAssignId,
    investigationAssignId,
    ticketAssignId,
    ticketEscalateId,
    doraLabel,
    openOnboardingAssign,
    openInvestigationAssign,
    openTicketAssign,
    openTicketEscalate,
    openDoraLabel,
    notifyClientReload,
  } = useApp();
  const { staff, refresh } = usePlatform();

  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [crmTierSel, setCrmTierSel] = useState(1);
  const [uploadConsent, setUploadConsent] = useState(false);
  const [note, setNote] = useState('');
  const [convSkus, setConvSkus] = useState('10');
  const [seats, setSeats] = useState(12);
  const [seatReason, setSeatReason] = useState('');
  const [domainTarget, setDomainTarget] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [resubmitReason, setResubmitReason] = useState('');
  const [resubmitGuidance, setResubmitGuidance] = useState('');
  const [lifecycleSaving, setLifecycleSaving] = useState(false);
  const [uploadFront, setUploadFront] = useState<File | null>(null);
  const [uploadBack, setUploadBack] = useState<File | null>(null);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  const assignOpen = isOpen('assign');
  const editOpen = isOpen('edit-client');
  const seatOpen = isOpen('seatadj');
  const tierOpen = isOpen('crm-tier');
  const convertOpen = isOpen('convert');
  const domainOpen = isOpen('domain-upgrade');
  const escalateOpen = isOpen('escalate');
  const reviewOpen = isOpen('model-review');

  useEffect(() => {
    if (editOpen && selectedClient) setEditName(selectedClient.name);
  }, [editOpen, selectedClient]);
  useEffect(() => {
    if (seatOpen && selectedClient) setSeats(selectedClient.crmSeats || 12);
  }, [seatOpen, selectedClient]);
  useEffect(() => {
    if (convertOpen) setConvSkus('10');
  }, [convertOpen]);
  useEffect(() => {
    if (domainOpen && selectedClient) {
      setDomainTarget(`verify-${selectedClient.code.toLowerCase()}.sartor.ng`);
    }
  }, [domainOpen, selectedClient]);
  useEffect(() => {
    if (!assignOpen) {
      setAssignStaffId('');
      openOnboardingAssign(null);
      openInvestigationAssign(null);
      openTicketAssign(null);
    }
  }, [assignOpen, openOnboardingAssign, openInvestigationAssign, openTicketAssign]);
  useEffect(() => {
    if (!escalateOpen) {
      setEscalateReason('');
      openTicketEscalate(null);
    }
  }, [escalateOpen, openTicketEscalate]);
  useEffect(() => {
    if (!reviewOpen) {
      setResubmitReason('');
      setResubmitGuidance('');
    }
  }, [reviewOpen]);

  const uploadOpen = isOpen('upload-images');
  useEffect(() => {
    if (!uploadOpen) {
      setUploadConsent(false);
      setUploadFront(null);
      setUploadBack(null);
    }
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
      <TeamMemberModal />

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
          Current: <strong>{selectedClient?.crmSeats || 12} active seats</strong> · ₦25,000/seat/month · All CRM tiers billed per seat per month.
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
          <input
            className="inp"
            placeholder="e.g. Client added 3 new sales reps"
            value={seatReason}
            onChange={(e) => setSeatReason(e.target.value)}
          />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('seatadj')} disabled={lifecycleSaving}>
            Cancel
          </Button>
          <Button
            className="bacc"
            disabled={lifecycleSaving || !selectedClient?._id}
            onClick={async () => {
              if (!selectedClient?._id) return;
              setLifecycleSaving(true);
              try {
                await platformApi.patchClient(selectedClient._id, { crmSeats: seats });
                if (seatReason.trim()) {
                  await platformApi.addNote(
                    selectedClient._id,
                    `CRM seats adjusted to ${seats}. ${seatReason.trim()}`,
                  );
                }
                await refresh();
                notifyClientReload();
                closeModal('seatadj');
                showToast('Seat count updated.', 'success');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not update seats.', 'error');
              } finally {
                setLifecycleSaving(false);
              }
            }}
          >
            {lifecycleSaving ? 'Saving…' : 'Confirm Adjustment'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={tierOpen} onClose={() => closeModal('crm-tier')} title="Change CRM Tier" width={560}>
        <InfoBanner>ℹ Tier change takes effect next billing cycle unless specified.</InfoBanner>
        <div className="crm-tier-grid" style={{ marginBottom: 14 }}>
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
            disabled={lifecycleSaving || !selectedClient?._id}
            onClick={async () => {
              if (!selectedClient?._id) return;
              setLifecycleSaving(true);
              try {
                await platformApi.patchClient(selectedClient._id, {
                  crmTier: CRM_TIERS[crmTierSel],
                  crmEnabled: true,
                });
                await platformApi.addNote(
                  selectedClient._id,
                  `CRM tier changed to ${CRM_TIERS[crmTierSel]}.`,
                );
                await refresh();
                notifyClientReload();
                closeModal('crm-tier');
                showToast('CRM tier updated.', 'success');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not update tier.', 'error');
              } finally {
                setLifecycleSaving(false);
              }
            }}
          >
            {lifecycleSaving ? 'Saving…' : 'Confirm Tier Change'}
          </Button>
        </ModalFooter>
      </Modal>

      <TicketModal />
      <TicketDetailModal />

      <Modal open={escalateOpen} onClose={() => closeModal('escalate')} title="Escalate Ticket">
        <WarnBanner>⚠ Escalating notifies the CEO and Operations Manager immediately.</WarnBanner>
        <FormGroup label="Escalation Reason *">
          <textarea
            className="inp"
            rows={3}
            style={{ resize: 'vertical' }}
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
          />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('escalate')} disabled={lifecycleSaving}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={lifecycleSaving || !ticketEscalateId || !escalateReason.trim()}
            onClick={async () => {
              if (!ticketEscalateId) return;
              setLifecycleSaving(true);
              try {
                await platformApi.patchTicket(ticketEscalateId, {
                  escalated: true,
                  escalationReason: escalateReason.trim(),
                  status: 'In Progress',
                });
                await refresh();
                closeModal('escalate');
                showToast('Ticket escalated. Leadership notified.', 'warn');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not escalate.', 'error');
              } finally {
                setLifecycleSaving(false);
              }
            }}
          >
            {lifecycleSaving ? 'Escalating…' : 'Escalate Now'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={domainOpen} onClose={() => closeModal('domain-upgrade')} title="Domain Upgrade">
        <WarnBanner>⚠ Requires engineering provisioning.</WarnBanner>
        <FormGroup label="Target Domain">
          <input
            className="inp"
            placeholder="e.g. verify-shc.sartor.ng"
            value={domainTarget}
            onChange={(e) => setDomainTarget(e.target.value)}
          />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('domain-upgrade')} disabled={lifecycleSaving}>
            Cancel
          </Button>
          <Button
            className="bacc"
            disabled={lifecycleSaving || !selectedClient?._id || !domainTarget.trim()}
            onClick={async () => {
              if (!selectedClient?._id) return;
              setLifecycleSaving(true);
              try {
                await platformApi.patchClient(selectedClient._id, {
                  verifyDomain: domainTarget.trim(),
                  domainTier: 'growth',
                });
                await platformApi.addNote(
                  selectedClient._id,
                  `Domain upgrade requested: ${domainTarget.trim()}`,
                );
                await refresh();
                notifyClientReload();
                closeModal('domain-upgrade');
                showToast('Domain upgrade request submitted.', 'success');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not submit request.', 'error');
              } finally {
                setLifecycleSaving(false);
              }
            }}
          >
            {lifecycleSaving ? 'Submitting…' : 'Submit Request'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={convertOpen} onClose={() => closeModal('convert')} title="Convert Pilot to Full Deployment">
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
          <Button
            className="bacc"
            disabled={lifecycleSaving || !selectedClient?._id}
            onClick={async () => {
              if (!selectedClient?._id) return;
              setLifecycleSaving(true);
              try {
                await platformApi.convertPilot(selectedClient._id, {
                  skuCount: parseInt(convSkus, 10) || 1,
                });
                await refresh();
                notifyClientReload();
                closeModal('convert');
                showToast('Pilot converted to Full Deployment.', 'success');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not convert pilot.', 'error');
              } finally {
                setLifecycleSaving(false);
              }
            }}
          >
            {lifecycleSaving ? 'Converting…' : 'Confirm Conversion'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={reviewOpen} onClose={() => closeModal('model-review')} title="Request Image Re-Submission">
        <WarnBanner>⚠ Model scored below 70-point threshold. Client will be notified to resubmit reference images.</WarnBanner>
        <FormGroup label="Reason (communicated to client)">
          <textarea
            className="inp"
            rows={3}
            style={{ resize: 'vertical' }}
            placeholder="Describe the image quality issue..."
            value={resubmitReason}
            onChange={(e) => setResubmitReason(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Guidance for Client">
          <textarea
            className="inp"
            rows={2}
            style={{ resize: 'vertical' }}
            placeholder="e.g. Ensure consistent lighting, cover all label angles..."
            value={resubmitGuidance}
            onChange={(e) => setResubmitGuidance(e.target.value)}
          />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('model-review')} disabled={lifecycleSaving}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={lifecycleSaving || !doraLabel?._id || !resubmitReason.trim()}
            onClick={async () => {
              if (!doraLabel?._id) return;
              setLifecycleSaving(true);
              try {
                await platformApi.doraResubmit(doraLabel._id, {
                  reason: resubmitReason.trim(),
                  guidance: resubmitGuidance.trim(),
                });
                await refresh();
                closeModal('model-review');
                openDoraLabel(null);
                showToast('Resubmission request sent to client.', 'warn');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not send request.', 'error');
              } finally {
                setLifecycleSaving(false);
              }
            }}
          >
            {lifecycleSaving ? 'Sending…' : 'Send Request'}
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
        <FormRow2>
          <FormGroup label="Front image">
            <input
              type="file"
              className="inp"
              accept="image/jpeg,image/png,image/jpg"
              style={{ padding: 6 }}
              onChange={(e) => setUploadFront(e.target.files?.[0] || null)}
            />
          </FormGroup>
          <FormGroup label="Back image (if 2-sided)">
            <input
              type="file"
              className="inp"
              accept="image/jpeg,image/png,image/jpg"
              style={{ padding: 6 }}
              onChange={(e) => setUploadBack(e.target.files?.[0] || null)}
            />
          </FormGroup>
        </FormRow2>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('upload-images')}>
            Cancel
          </Button>
          <Button
            className="bacc"
            disabled={lifecycleSaving}
            onClick={async () => {
              if (!uploadConsent) {
                showToast('Confirm client authorisation first.', 'error');
                return;
              }
              if (!doraLabel?._id) {
                showToast('No DORA label selected.', 'error');
                return;
              }
              if (!uploadFront && !uploadBack) {
                showToast('Select at least one reference image.', 'error');
                return;
              }
              setLifecycleSaving(true);
              try {
                const form = new FormData();
                if (uploadFront) form.append('front', uploadFront);
                if (uploadBack) form.append('back', uploadBack);
                await platformApi.uploadDoraLabel(doraLabel._id, form);
                await refresh();
                closeModal('upload-images');
                openDoraLabel(null);
                showToast('Images uploaded. Training begins within 1 hour.', 'success');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not upload.', 'error');
              } finally {
                setLifecycleSaving(false);
              }
            }}
          >
            {lifecycleSaving ? 'Uploading…' : 'Upload & Begin Training'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={assignOpen} onClose={() => closeModal('assign')} title="Assign to Staff Member">
        <FormGroup label="Assign To *">
          <select
            className="inp"
            value={assignStaffId}
            onChange={(e) => setAssignStaffId(e.target.value)}
          >
            <option value="">Select staff member...</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName} ({s.platformRole})
              </option>
            ))}
          </select>
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => closeModal('assign')} disabled={assignSaving}>
            Cancel
          </Button>
          <Button
            className="bacc"
            disabled={assignSaving || !assignStaffId}
            onClick={async () => {
              if (!onboardingAssignId && !investigationAssignId && !ticketAssignId) {
                showToast('No record selected to assign.', 'error');
                return;
              }
              const assignee = staff.find((s) => s._id === assignStaffId);
              setAssignSaving(true);
              try {
                if (ticketAssignId) {
                  await platformApi.patchTicket(ticketAssignId, {
                    assignedTo: assignStaffId,
                    assignedName: assignee?.fullName,
                    status: 'In Progress',
                  });
                  showToast('Ticket assigned.', 'success');
                } else if (investigationAssignId) {
                  await platformApi.patchInvestigation(investigationAssignId, {
                    assignedTo: assignStaffId,
                    assignedName: assignee?.fullName,
                    status: 'In Progress',
                  });
                  showToast('Investigation assigned.', 'success');
                } else if (onboardingAssignId) {
                  await platformApi.patchOnboarding(onboardingAssignId, {
                    assignedAm: assignStaffId,
                  });
                  showToast('Onboarding assigned.', 'success');
                }
                await refresh();
                closeModal('assign');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not assign.', 'error');
              } finally {
                setAssignSaving(false);
              }
            }}
          >
            {assignSaving ? 'Assigning…' : 'Assign'}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => closeModal('edit-client')}
        title={`Edit Client${selectedClient ? ` — ${selectedClient.name}` : ''}`}
      >
        <FormGroup label="Company Name">
          <input
            className="inp"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="RC Number">
          <input className="inp" readOnly value={selectedClient?.rc ?? ''} />
        </FormGroup>
        <ModalFooter>
          <Button
            variant="danger"
            style={{ marginRight: 'auto' }}
            disabled={editSaving || !selectedClient?._id}
            onClick={async () => {
              if (!selectedClient?._id) return;
              setEditSaving(true);
              try {
                await platformApi.toggleClient(selectedClient._id);
                await refresh();
                closeModal('edit-client');
                showToast('Client status updated.', 'warn');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not update client.', 'error');
              } finally {
                setEditSaving(false);
              }
            }}
          >
            Suspend Client
          </Button>
          <Button variant="secondary" onClick={() => closeModal('edit-client')} disabled={editSaving}>
            Cancel
          </Button>
          <Button
            className="bacc"
            disabled={editSaving || !selectedClient?._id}
            onClick={async () => {
              if (!selectedClient?._id || !editName.trim()) return;
              setEditSaving(true);
              try {
                await platformApi.patchClient(selectedClient._id, { fullName: editName.trim() });
                await refresh();
                closeModal('edit-client');
                showToast('Client details updated.', 'success');
              } catch (e) {
                showToast(e instanceof Error ? e.message : 'Could not save.', 'error');
              } finally {
                setEditSaving(false);
              }
            }}
          >
            {editSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
