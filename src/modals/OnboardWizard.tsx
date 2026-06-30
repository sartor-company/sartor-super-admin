import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { platformApi } from '../api/platform';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { usePlatform } from '../context/PlatformContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import type { PlatformStaff } from '../types';
import { formatNaira } from '../utils/format';
import {
  BILL,
  computeBill,
  type CrmCycle,
  type CrmTierType,
  type DomainUpgrade,
  type EngagementType,
  type OnboardBillInput,
} from '../utils/pricing';
import { OnboardingInvoiceModal } from './OnboardingInvoiceModal';

const STEP_TITLES = [
  'Company Information',
  'Select Software Services',
  'Engagement, Billing & Credits',
  'Admin Account Setup',
  'Review & Onboard',
];

const INDUSTRIES = [
  'FMCG',
  'Pharmaceutical',
  'Health & Personal Care',
  'Consumer Goods',
  'Food & Beverage',
  'Cosmetics',
];

const ADD_CREDIT_OPTIONS: { key: string; label: string }[] = [
  { key: 'batchStarter', label: 'Batch Calibration — Starter (5) — ₦800,000' },
  { key: 'batchStandard', label: 'Batch Calibration — Standard (15) — ₦2,100,000' },
  { key: 'batchPro', label: 'Batch Calibration — Professional (30) — ₦3,600,000' },
  { key: 'pinEntry', label: 'PIN — Entry (10,000) — ₦200,000' },
  { key: 'pinGrowth', label: 'PIN — Growth (50,000) — ₦600,000' },
  { key: 'pinEnterprise', label: 'PIN — Enterprise (200,000) — ₦1,800,000' },
  { key: 'smsStarter', label: 'SMS — Starter (10,000) — ₦50,000' },
  { key: 'smsStandard', label: 'SMS — Standard (50,000) — ₦200,000' },
  { key: 'smsEnterprise', label: 'SMS — Enterprise (200,000) — ₦600,000' },
];

function freshObState() {
  return {
    services: { scdora: true, crm: false },
    engagement: 'pilot' as EngagementType,
    pilotConvert: false,
    crmTier: 'field' as CrmTierType,
    revSeats: 3,
    opSeats: 0,
    crmCycle: 'monthly' as CrmCycle,
    domainUpgrade: 'none' as DomainUpgrade,
    addCredits: [] as string[],
    clientCode: '',
    assignedAm: '',
  };
}

function ServiceCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button type="button" className={`ob-svc-card ${selected ? 'sel' : ''}`} onClick={onClick}>
      <span className="svc-check">{selected ? '✓' : ''}</span>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{description}</div>
    </button>
  );
}

function Step3Engagement({
  ob,
  setOb,
  bill,
  amStaff,
}: {
  ob: ReturnType<typeof freshObState>;
  setOb: Dispatch<SetStateAction<ReturnType<typeof freshObState>>>;
  bill: ReturnType<typeof computeBill>;
  amStaff: PlatformStaff[];
}) {
  const is360 = ob.services.crm && ob.crmTier === '360';
  const isFieldDepot = ob.services.crm && (ob.crmTier === 'field' || ob.crmTier === 'depot');

  const setCrmTier = (tier: CrmTierType) => {
    setOb((s) => ({
      ...s,
      crmTier: tier,
      services: { ...s.services, scdora: tier === '360' ? true : s.services.scdora },
    }));
  };

  const minRev = ob.crmTier === 'depot' ? 5 : 3;
  const revRate = ob.crmTier === 'field' ? BILL.crmField : BILL.crmDepotRev;

  const addCredit = (key: string) => {
    if (!key || ob.addCredits.includes(key)) return;
    setOb((s) => ({ ...s, addCredits: [...s.addCredits, key] }));
  };

  const removeCredit = (idx: number) => {
    setOb((s) => ({ ...s, addCredits: s.addCredits.filter((_, i) => i !== idx) }));
  };

  return (
    <>
      {ob.services.crm && (
        <FormGroup label="Sartor CRM Tier *">
          <select
            className="inp"
            value={ob.crmTier}
            onChange={(e) => setCrmTier(e.target.value as CrmTierType)}
          >
            <option value="field">Field (T1) — from {formatNaira(BILL.crmField)}/seat/mo</option>
            <option value="depot">Depot (T2) — rev + operational seats</option>
            <option value="360">CRM 360 (T3) — full bundle + SC+DORA, unlimited seats</option>
          </select>
        </FormGroup>
      )}

      {isFieldDepot && (
        <>
          <div className="info-b">
            <strong>Sartor CRM {ob.crmTier === 'field' ? 'Field' : 'Depot'}</strong> — standalone CRM.
            Min {minRev} revenue seats.
          </div>
          <FormGroup label={`Revenue Seats (${formatNaira(revRate)}/seat/mo)`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() =>
                  setOb((s) => ({ ...s, revSeats: Math.max(minRev, s.revSeats - 1) }))
                }
              >
                −
              </Button>
              <input
                type="number"
                className="inp"
                style={{ width: 72, textAlign: 'center' }}
                min={minRev}
                value={ob.revSeats}
                onChange={(e) =>
                  setOb((s) => ({
                    ...s,
                    revSeats: Math.max(minRev, parseInt(e.target.value, 10) || minRev),
                  }))
                }
              />
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setOb((s) => ({ ...s, revSeats: s.revSeats + 1 }))}
              >
                +
              </Button>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                = <strong>{formatNaira(ob.revSeats * revRate)}</strong>/mo
              </span>
            </div>
          </FormGroup>
          {ob.crmTier === 'depot' && (
            <FormGroup label={`Operational Seats (${formatNaira(BILL.crmDepotOp)}/seat/mo)`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setOb((s) => ({ ...s, opSeats: Math.max(0, s.opSeats - 1) }))}
                >
                  −
                </Button>
                <input
                  type="number"
                  className="inp"
                  style={{ width: 72, textAlign: 'center' }}
                  min={0}
                  value={ob.opSeats}
                  onChange={(e) =>
                    setOb((s) => ({ ...s, opSeats: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                  }
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setOb((s) => ({ ...s, opSeats: s.opSeats + 1 }))}
                >
                  +
                </Button>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  = <strong>{formatNaira(ob.opSeats * BILL.crmDepotOp)}</strong>/mo
                </span>
              </div>
            </FormGroup>
          )}
        </>
      )}

      {is360 && (
        <>
          <div className="info-b" style={{ background: 'var(--gb)', color: 'var(--gt)', borderColor: 'rgba(29,184,122,.2)' }}>
            ✓ <strong>CRM 360 — Full Bundle.</strong> SC+DORA full deployment + unlimited CRM seats on one subscription.
          </div>
          <div
            style={{
              padding: '11px 13px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Converting from an existing Pilot?</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                  SC+DORA portion becomes {formatNaira(BILL.pilotConvertFee)} instead of{' '}
                  {formatNaira(BILL.fullFee)}.
                </div>
              </div>
              <div
                className={`toggle ${ob.pilotConvert ? 'on' : ''}`}
                role="switch"
                aria-checked={ob.pilotConvert}
                onClick={() => setOb((s) => ({ ...s, pilotConvert: !s.pilotConvert }))}
              />
            </label>
          </div>
        </>
      )}

      {ob.services.scdora && !isFieldDepot && (
        <>
          <div className="sdiv" style={{ marginTop: 0 }}>
            Sartor-Chain & DORA AI — Engagement
          </div>
          <div className="ob-eng-grid">
            <ServiceCard
              selected={ob.engagement === 'pilot'}
              onClick={() => setOb((s) => ({ ...s, engagement: 'pilot' }))}
              title="🎁 Pilot Programme"
              description={`90-day standalone · ${formatNaira(BILL.pilotFee)} flat · 1 SKU · default credits`}
            />
            <ServiceCard
              selected={ob.engagement === 'full'}
              onClick={() => setOb((s) => ({ ...s, engagement: 'full' }))}
              title="📈 Full Deployment"
              description={`Unlimited SKUs (Year 1) · ${formatNaira(BILL.fullFee)} · SKU licences from Year 2`}
            />
          </div>
          {ob.engagement === 'full' && !is360 && (
            <>
              <div style={{ marginTop: 12, padding: '11px 13px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Converting from an existing Pilot?</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      Fee becomes {formatNaira(BILL.pilotConvertFee)} instead of {formatNaira(BILL.fullFee)}.
                    </div>
                  </div>
                  <div
                    className={`toggle ${ob.pilotConvert ? 'on' : ''}`}
                    role="switch"
                    onClick={() => setOb((s) => ({ ...s, pilotConvert: !s.pilotConvert }))}
                  />
                </label>
              </div>
              <FormGroup label="Verification Domain">
                <select
                  className="inp"
                  value={ob.domainUpgrade}
                  onChange={(e) =>
                    setOb((s) => ({ ...s, domainUpgrade: e.target.value as DomainUpgrade }))
                  }
                >
                  <option value="none">Starter (default) — verify.dorascan.ai/{'{client_code}'} — included</option>
                  <option value="growth">
                    Growth — verify-{'{name}'}.dorascan.ai — {formatNaira(BILL.domainGrowthSetup)} setup
                  </option>
                  <option value="enterprise">
                    Enterprise CNAME — {formatNaira(BILL.domainEntSetup)} + {formatNaira(BILL.domainEntYr)}/yr
                  </option>
                </select>
              </FormGroup>
            </>
          )}
          {ob.engagement === 'pilot' && !is360 && (
            <div className="info-b" style={{ marginTop: 10, background: 'var(--gb)', color: 'var(--gt)', borderColor: 'rgba(29,184,122,.2)' }}>
              ✓ Pilot auto-configured: 1 SKU · default domain · default credits. Flat {formatNaira(BILL.pilotFee)}.
            </div>
          )}
        </>
      )}

      {(is360 || (ob.services.scdora && !isFieldDepot)) && (
        <div className="sdiv">Default Credit Bundle (included in engagement fee)</div>
      )}
      {(is360 || (ob.services.scdora && !isFieldDepot)) &&
        BILL.defaultCredits.map((c) => (
          <div key={c.type} className="srow" style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--text2)' }}>
              {c.type} — {c.bundle} ({c.qty})
            </span>
            <span style={{ color: 'var(--gt)', fontWeight: 600, fontSize: 11 }}>Included</span>
          </div>
        ))}

      {!isFieldDepot && (
        <FormGroup label="Add More Credits (optional)">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {ob.addCredits.map((key, i) => {
              const opt = ADD_CREDIT_OPTIONS.find((o) => o.key === key);
              return (
                <span key={key} className="credit-chip">
                  {opt?.label.split(' — ')[0] ?? key}
                  <button
                    type="button"
                    onClick={() => removeCredit(i)}
                    style={{ border: 0, background: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
          <select
            className="inp"
            value=""
            onChange={(e) => {
              addCredit(e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">+ Select a credit bundle to add...</option>
            {ADD_CREDIT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </FormGroup>
      )}

      {(is360 || isFieldDepot) && (
        <FormGroup label="Billing Cycle *">
          <div className="ob-eng-grid">
            <ServiceCard
              selected={ob.crmCycle === 'monthly'}
              onClick={() => setOb((s) => ({ ...s, crmCycle: 'monthly' }))}
              title="Monthly"
              description="Paid monthly in full. No discount. 12-month commitment."
            />
            <ServiceCard
              selected={ob.crmCycle === 'annual'}
              onClick={() => setOb((s) => ({ ...s, crmCycle: 'annual' }))}
              title="Annual (20% off)"
              description="Paid upfront. 20% discount on eligible fees."
            />
          </div>
        </FormGroup>
      )}

      <div className="fr2" style={{ marginTop: 14 }}>
        <FormGroup label="Client Code *">
          <input
            className="inp"
            placeholder="2–4 uppercase e.g. SHC"
            value={ob.clientCode}
            onChange={(e) => setOb((s) => ({ ...s, clientCode: e.target.value.toUpperCase() }))}
            maxLength={4}
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
            Auto-generates SKU prefix if left blank
          </div>
        </FormGroup>
        <FormGroup label="Account Manager">
          <select
            className="inp"
            value={ob.assignedAm}
            onChange={(e) => setOb((s) => ({ ...s, assignedAm: e.target.value }))}
          >
            <option value="">Assign later</option>
            {amStaff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </FormGroup>
      </div>

      <div
        style={{
          border: '1px solid var(--navy)',
          background: 'var(--bg)',
          borderRadius: 8,
          padding: '12px 14px',
          marginTop: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Estimated initial invoice</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
            {formatNaira(bill.billableTotal)}
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>
              {bill.monthly > 0 && bill.oneOff === 0 ? ' /mo' : bill.annual ? ' annual' : ' one-off'}
            </span>
          </span>
        </div>
        {bill.monthly > 0 && bill.oneOff > 0 ? (
          <div className="srow" style={{ fontSize: 12, marginTop: 4 }}>
            <span style={{ color: 'var(--text2)' }}>Recurring monthly</span>
            <strong>{formatNaira(bill.monthly)}/mo</strong>
          </div>
        ) : null}
      </div>
    </>
  );
}

export function OnboardWizard() {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const { refreshClients, refreshOnboarding, staff } = usePlatform();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [ob, setOb] = useState(freshObState);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [submittedInvoice, setSubmittedInvoice] = useState<{
    invoiceId: string;
    lineItems: ReturnType<typeof computeBill>['lines'];
    amount: number;
  } | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [cityState, setCityState] = useState('');

  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const billInput = useMemo<OnboardBillInput>(
    () => ({
      company: companyName,
      services: ob.services,
      engagement: ob.engagement,
      pilotConvert: ob.pilotConvert,
      crmTier: ob.crmTier,
      revSeats: ob.revSeats,
      opSeats: ob.opSeats,
      crmCycle: ob.crmCycle,
      domainUpgrade: ob.domainUpgrade,
      addCredits: ob.addCredits,
    }),
    [companyName, ob],
  );

  const bill = useMemo(() => computeBill(billInput), [billInput]);

  const amStaff = useMemo(
    () => staff.filter((s) => ['am', 'super', 'ops'].includes(s.platformRole)),
    [staff],
  );

  const configSummary = useMemo(() => {
    const parts: string[] = [];
    if (ob.services.crm && ob.crmTier === '360') {
      parts.push(
        `Sartor CRM 360 — Full Bundle${ob.pilotConvert ? ' (Pilot Convert)' : ''} (${ob.crmCycle})`,
      );
    } else if (ob.services.crm) {
      parts.push(
        `Sartor CRM ${ob.crmTier === 'field' ? 'Field' : 'Depot'} (${ob.revSeats} rev${ob.crmTier === 'depot' ? ` + ${ob.opSeats} op` : ''} seats, ${ob.crmCycle})`,
      );
    } else if (ob.services.scdora) {
      parts.push(
        `Sartor-Chain & DORA AI (${ob.engagement === 'pilot' ? 'Pilot' : `Full Deployment${ob.pilotConvert ? ', Pilot Convert' : ''}`})`,
      );
    }
    return parts.join(' · ') || 'None';
  }, [ob]);

  const validateStep = (s: number): boolean => {
    if (s === 0) {
      if (
        !companyName.trim() ||
        !rcNumber.trim() ||
        !industry ||
        !contactName.trim() ||
        !contactEmail.trim() ||
        !contactPhone.trim()
      ) {
        showToast(
          'Company name, RC, industry, contact name, contact email, and contact phone are required.',
          'error',
        );
        return false;
      }
      return true;
    }
    if (s === 1) {
      if (!ob.services.scdora && !ob.services.crm) {
        showToast('Select at least one software service.', 'error');
        return false;
      }
      return true;
    }
    if (s === 2) {
      const minRev = ob.crmTier === 'depot' ? 5 : 3;
      if (ob.services.crm && ob.crmTier !== '360' && ob.revSeats < minRev) {
        showToast(`CRM ${ob.crmTier} requires at least ${minRev} revenue seats.`, 'error');
        return false;
      }
      if (ob.clientCode && !/^[A-Z]{2,4}$/.test(ob.clientCode)) {
        showToast('Client code must be 2–4 uppercase letters.', 'error');
        return false;
      }
      return true;
    }
    if (s === 3) {
      if (!adminFirstName.trim() || !adminLastName.trim() || !adminEmail.trim()) {
        showToast('Admin first name, last name, and login email are required.', 'error');
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < STEP_TITLES.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const finish = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    setSaving(true);
    try {
      const result = await platformApi.onboard({
        fullName: companyName.trim(),
        email: adminEmail.trim(),
        phone: contactPhone.trim() || adminPhone.trim() || undefined,
        address: cityState.trim() || undefined,
        industry,
        rcNumber: rcNumber.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        password: adminPassword.trim() || undefined,
        clientCode: ob.clientCode.trim() || undefined,
        assignedAm: ob.assignedAm || undefined,
        services: ob.services,
        engagement: ob.engagement,
        pilotConvert: ob.pilotConvert,
        crmTierType: ob.crmTier,
        crmTier: ob.crmTier,
        revSeats: ob.revSeats,
        opSeats: ob.opSeats,
        crmCycle: ob.crmCycle,
        domainUpgrade: ob.domainUpgrade,
        addCredits: ob.addCredits,
        adminFirstName: adminFirstName.trim(),
        adminLastName: adminLastName.trim(),
      });
      const inv = (result as { invoice?: { invoiceId: string; lineItems: typeof bill.lines; amount: number } })
        .invoice;
      if (inv) setSubmittedInvoice(inv);
      await Promise.all([refreshClients(), refreshOnboarding()]);
      showToast(`${companyName} onboarded (inactive). Invoice pending — activate when ready.`, 'success');
      closeModal('onboard');
      setStep(0);
      setOb(freshObState());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Onboarding failed';
      const isAuth =
        e &&
        typeof e === 'object' &&
        'response' in e &&
        (e as { response?: { status?: number } }).response?.status === 401;
      showToast(
        isAuth
          ? 'Session expired — sign in again and retry.'
          : msg,
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const invoiceLines = submittedInvoice?.lineItems ?? bill.lines;
  const invoiceTotal = submittedInvoice?.amount ?? bill.billableTotal;

  return (
    <>
      <div className="mhd">
        <div>
          <div className="mtitle">{STEP_TITLES[step]}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            Step {step + 1} of {STEP_TITLES.length}
          </div>
        </div>
        <button type="button" className="mclose" onClick={() => closeModal('onboard')}>
          ✕
        </button>
      </div>
      <div className="steps">
        {STEP_TITLES.map((_, i) => (
          <div key={i} className={`step ${i < step ? 'done' : i === step ? 'cur' : ''}`} />
        ))}
      </div>

      <div style={{ maxHeight: 'min(52vh, 420px)', overflowY: 'auto', paddingRight: 2 }}>
        {step === 0 && (
          <>
            <FormGroup label="Company Name *">
              <input
                className="inp"
                placeholder="Registered company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </FormGroup>
            <div className="fr2">
              <FormGroup label="RC Number *">
                <input
                  className="inp"
                  placeholder="e.g. RC 1234567"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Industry *">
                <select className="inp" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">Select...</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="Contact Name *">
                <input
                  className="inp"
                  placeholder="Primary contact at client"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Contact Email *">
                <input
                  className="inp"
                  type="email"
                  placeholder="primary@clientdomain.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="Contact Phone *">
                <input
                  className="inp"
                  placeholder="+234..."
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </FormGroup>
              <FormGroup label="City / State">
                <input
                  className="inp"
                  placeholder="e.g. Lagos, Lagos State"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                />
              </FormGroup>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="info-b">
              Choose which Sartor products this client is subscribing to. The next step adapts to your
              selection. A client can take authentication only, CRM only, or both.
            </div>
            <label className="fi">Software Services *</label>
            <div style={{ display: 'grid', gap: 9, marginTop: 6 }}>
              <ServiceCard
                selected={ob.services.scdora}
                onClick={() =>
                  setOb((s) => ({
                    ...s,
                    services: { ...s.services, scdora: !s.services.scdora },
                  }))
                }
                title="🔒 Sartor-Chain & DORA AI"
                description="Blockchain track-and-trace + AI visual authentication + cryptographic PIN verification."
              />
              <ServiceCard
                selected={ob.services.crm}
                onClick={() =>
                  setOb((s) => ({
                    ...s,
                    services: { ...s.services, crm: !s.services.crm },
                    crmTier: s.services.crm ? s.crmTier : s.crmTier || 'field',
                  }))
                }
                title="📊 Sartor CRM"
                description="B2B sales & distribution — Field, Depot, or CRM 360 bundle tiers."
              />
            </div>
          </>
        )}

        {step === 2 && (
          <Step3Engagement
            ob={ob}
            setOb={setOb}
            bill={bill}
            amStaff={amStaff}
          />
        )}

        {step === 3 && (
          <>
            <div className="info-b">
              This creates the client&apos;s Account Owner login. They can invite their team after
              activation. Welcome email is sent only after activation — not at onboarding.
            </div>
            <div className="fr2">
              <FormGroup label="Admin First Name *">
                <input className="inp" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
              </FormGroup>
              <FormGroup label="Admin Last Name *">
                <input className="inp" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
              </FormGroup>
            </div>
            <FormGroup label="Admin Email * (becomes login email)">
              <input
                className="inp"
                type="email"
                placeholder="Must be client's corporate email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </FormGroup>
            <FormGroup label="Admin Phone">
              <input className="inp" placeholder="+234..." value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
            </FormGroup>
            <FormGroup label="Temporary Password (optional)">
              <input
                className="inp"
                type="password"
                placeholder="Auto-generated if blank"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </FormGroup>
            <div className="warn-b">
              A welcome email with login instructions is sent only after the client is{' '}
              <strong>activated</strong> — not at onboarding.
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="info-b">
              <strong>Onboard Client</strong> creates the account <strong>INACTIVE</strong> with an
              invoice marked <strong>Pending Payment</strong>. Activation is separate and independent
              of payment.
            </div>
            {[
              ['Company', companyName],
              ['Configuration', configSummary],
              ['Billing cycle', ob.services.crm ? (ob.crmCycle === 'annual' ? 'Annual (20% off)' : 'Monthly') : 'One-off'],
              ['Account status', 'Inactive (on creation)'],
              ['Invoice status', 'Pending Payment'],
              ['Admin login', adminEmail],
            ].map(([label, value]) => (
              <div className="srow" key={label}>
                <span style={{ color: 'var(--text2)' }}>{label}</span>
                <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{value}</strong>
              </div>
            ))}
            <div className="sdiv">Invoice preview</div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 9, padding: '13px 15px' }}>
              {bill.lines.map((line, i) => (
                <div key={i} className="srow" style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--text2)' }}>{line.desc}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                    {line.type === 'included' ? 'Included' : `${formatNaira(line.amt)}${line.type === 'monthly' ? '/mo' : ''}`}
                  </span>
                </div>
              ))}
              <div className="srow" style={{ fontWeight: 700, borderTop: '2px solid var(--border)', marginTop: 4, paddingTop: 8 }}>
                <span>{bill.oneOff > 0 ? 'Due now' : 'First month'}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--navy)' }}>
                  {formatNaira(bill.billableTotal)}
                </span>
              </div>
            </div>
            <div className="info-b" style={{ marginTop: 12, background: 'var(--gb)', color: 'var(--gt)', borderColor: 'rgba(29,184,122,.2)' }}>
              ✓ Default credits included where applicable. After onboarding: view/send the invoice, then activate when ready.
            </div>
          </>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 16,
          flexWrap: 'wrap',
          gap: 8,
          borderTop: '1px solid var(--border)',
          paddingTop: 14,
        }}
      >
        <Button
          variant="secondary"
          style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          onClick={() => setStep((s) => s - 1)}
          disabled={saving}
        >
          ← Back
        </Button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {step === STEP_TITLES.length - 1 && (
            <>
              <Button variant="secondary" type="button" onClick={() => setInvoiceOpen(true)}>
                View Invoice
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => showToast('Invoice will be emailed after onboarding.', 'success')}
              >
                Send Invoice
              </Button>
            </>
          )}
          <Button className="bacc" onClick={goNext} disabled={saving}>
            {step === STEP_TITLES.length - 1
              ? saving
                ? 'Onboarding…'
                : 'Onboard Client (Inactive)'
              : 'Continue →'}
          </Button>
        </div>
      </div>

      <OnboardingInvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        companyName={companyName}
        invoiceId={submittedInvoice?.invoiceId}
        lineItems={invoiceLines}
        total={invoiceTotal}
        monthly={bill.monthly > 0 && bill.oneOff === 0 ? bill.monthly : bill.monthly}
        onSend={
          submittedInvoice
            ? () => {
                showToast('Invoice emailed to client with payment link.', 'success');
                setInvoiceOpen(false);
              }
            : undefined
        }
      />
    </>
  );
}
