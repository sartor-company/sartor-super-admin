import { useMemo, useState } from 'react';
import { platformApi } from '../api/platform';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { usePlatform } from '../context/PlatformContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/format';
import { calcCrmBilling, calcOnboardingTotal } from '../utils/pricing';

const STEPS = ['Company Information', 'Products & Engagement', 'Admin Account Setup', 'Review & Activate'];

export function OnboardWizard() {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const { refresh } = usePlatform();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [crmOn, setCrmOn] = useState(false);
  const [eng, setEng] = useState<'pilot' | 'full'>('pilot');
  const [crmRate, setCrmRate] = useState(0);
  const [crmName, setCrmName] = useState('');
  const [crmSeats, setCrmSeats] = useState('');
  const [crmCycle, setCrmCycle] = useState('monthly');

  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [feeReceived, setFeeReceived] = useState('');

  const scBand = eng === 'pilot' ? 'Pilot' : 'Starter';

  const obCrmBilling = () => {
    const seats = parseInt(crmSeats, 10) || 0;
    if (!crmRate || !seats) return null;
    const bill = calcCrmBilling(crmRate, seats, crmCycle === 'annual');
    return (
      <div style={{ padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginTop: 8 }}>
        <strong>{crmName}</strong> · {seats} seat{seats > 1 ? 's' : ''} · {formatNaira(crmRate)}/seat/month
        <br />
        {crmCycle === 'annual' ? (
          <>
            List price: {formatNaira(bill.yearlyList!)}/yr · <strong>20% off</strong> · Save{' '}
            {formatNaira(bill.savings!)}
            <br />
            Due: <strong>{formatNaira(bill.total)}</strong> ({formatNaira(bill.monthlyEffective!)}/mo effective)
          </>
        ) : (
          <>
            Due: <strong>{bill.label}</strong>
          </>
        )}
      </div>
    );
  };

  const billing = useMemo(
    () =>
      calcOnboardingTotal({
        engagement: eng,
        skuCount: 0,
        crmOn,
        crmRate,
        crmSeats: parseInt(crmSeats, 10) || 0,
        crmCycle,
      }),
    [eng, crmOn, crmRate, crmSeats, crmCycle],
  );

  const validateStep = (s: number): boolean => {
    if (s === 0) {
      if (!companyName.trim() || !rcNumber.trim() || !industry || !contactEmail.trim()) {
        showToast('Company name, RC number, industry, and contact email are required.', 'error');
        return false;
      }
      return true;
    }
    if (s === 1) {
      if (crmOn && (!crmRate || !crmSeats || parseInt(crmSeats, 10) < 1)) {
        showToast('Select a CRM tier and seat count.', 'error');
        return false;
      }
      return true;
    }
    if (s === 2) {
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
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const reviewLines = useMemo(() => {
    const lines = [
      { label: 'Company', value: companyName || '—' },
      { label: 'RC Number', value: rcNumber || '—' },
      { label: 'Industry', value: industry || '—' },
      { label: 'Contact email', value: contactEmail || '—' },
      { label: 'Engagement', value: eng === 'pilot' ? 'Pilot Programme' : 'Full Deployment' },
      { label: 'SC Band', value: scBand },
      { label: 'CRM', value: crmOn ? `${crmName} · ${crmSeats || 0} seats` : 'Not included' },
      { label: 'Admin login', value: adminEmail || '—' },
      { label: 'Onboarding fee', value: formatNaira(billing.onboardingFee) },
      {
        label: 'Fee received',
        value: feeReceived
          ? formatNaira(parseInt(feeReceived.replace(/\D/g, ''), 10) || 0)
          : 'None — payment pending',
      },
      { label: 'Payment status', value: 'Pending (confirm in Finance)' },
    ];
    if (billing.crm) {
      if (crmCycle === 'annual') {
        lines.push({
          label: 'CRM annual (list)',
          value: formatNaira(billing.crm.yearlyList ?? billing.crm.monthly * 12),
        });
        lines.push({
          label: 'CRM annual discount (20%)',
          value: `−${formatNaira(billing.crm.savings ?? 0)}`,
        });
        lines.push({
          label: 'CRM due',
          value: formatNaira(billing.crm.total),
        });
      } else {
        lines.push({
          label: 'CRM (monthly)',
          value: formatNaira(billing.crm.total),
        });
      }
    }
    lines.push({ label: 'Total due at activation', value: formatNaira(billing.grandTotal) });
    return lines;
  }, [
    companyName,
    rcNumber,
    industry,
    contactEmail,
    eng,
    scBand,
    crmOn,
    crmName,
    crmSeats,
    adminEmail,
    billing,
    crmCycle,
    feeReceived,
  ]);

  const finish = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;
    setSaving(true);
    try {
      await platformApi.onboard({
        fullName: companyName.trim(),
        email: adminEmail.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        industry,
        rcNumber: rcNumber.trim(),
        password: adminPassword.trim() || undefined,
        contactEmail: contactEmail.trim(),
        scBand,
        engagement: eng,
        crmEnabled: crmOn,
        crmTier: crmOn ? crmName : undefined,
        crmRate: crmOn ? crmRate : undefined,
        crmCycle: crmOn ? crmCycle : undefined,
        crmSeats: crmOn && crmSeats ? parseInt(crmSeats, 10) : undefined,
      });
      await refresh();
      closeModal('onboard');
      showToast(`${companyName} onboarded. Welcome email sent.`, 'success');
      setStep(0);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Onboarding failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mhd">
        <div>
          <div className="mtitle">{STEPS[step]}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
        <button type="button" className="mclose" onClick={() => closeModal('onboard')}>
          ✕
        </button>
      </div>
      <div className="steps">
        {STEPS.map((_, i) => (
          <div key={i} className={`step ${i < step ? 'done' : i === step ? 'cur' : ''}`} />
        ))}
      </div>

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
                <option>FMCG</option>
                <option>Pharmaceutical</option>
                <option>Health & Personal Care</option>
              </select>
            </FormGroup>
          </div>
          <FormGroup label="Business Address">
            <input className="inp" value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormGroup>
          <div className="fr2">
            <FormGroup label="Phone">
              <input className="inp" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </FormGroup>
            <FormGroup label="Primary Contact Email *">
              <input
                className="inp"
                type="email"
                placeholder="contact@domain.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </FormGroup>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="fg">
            <label className="fi" style={{ marginBottom: 8 }}>
              Products Subscribing To *
            </label>
            <div className="choice-grid">
              <label style={{ border: '2px solid var(--accent)', background: '#fff8f6', borderRadius: 8, padding: 12, cursor: 'pointer', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <input type="checkbox" defaultChecked readOnly />
                  <strong>SartorChain / DORA AI</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Authentication, QR codes, DORA AI</div>
              </label>
              <label
                style={{
                  border: crmOn ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: crmOn ? '#fff8f6' : undefined,
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  display: 'block',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <input type="checkbox" checked={crmOn} onChange={(e) => setCrmOn(e.target.checked)} />
                  <strong>Sartor CRM</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Sales & distribution management</div>
              </label>
            </div>
          </div>
          {crmOn && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 9, padding: 13, background: 'var(--bg)', marginBottom: 13 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Select CRM Tier</div>
              <div className="crm-tier-grid">
                {[
                  { rate: 5000, name: 'Sales Navigator', price: '₦5,000/seat/month' },
                  { rate: 12000, name: 'Sales Nav Plus', price: '₦12,000/seat/month' },
                  { rate: 25000, name: 'CRM 360', price: '₦25,000/seat/month' },
                ].map((t) => (
                  <button
                    key={t.rate}
                    type="button"
                    className={`crm-tier ${crmRate === t.rate ? 'sel' : ''}`}
                    onClick={() => {
                      setCrmRate(t.rate);
                      setCrmName(t.name);
                    }}
                  >
                    <div className="ct-name">{t.name}</div>
                    <div className="ct-price">{t.price}</div>
                  </button>
                ))}
              </div>
              <div className="fr2">
                <FormGroup label="Number of CRM Seats *">
                  <input type="number" className="inp" value={crmSeats} onChange={(e) => setCrmSeats(e.target.value)} min={1} />
                </FormGroup>
                <FormGroup label="Billing Cycle">
                  <select className="inp" value={crmCycle} onChange={(e) => setCrmCycle(e.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (20% off)</option>
                  </select>
                </FormGroup>
              </div>
              {obCrmBilling()}
            </div>
          )}
          <div className="sdiv">SartorChain Engagement Type</div>
          <div className="choice-grid" style={{ marginBottom: 13 }}>
            <button
              type="button"
              style={{
                border: eng === 'pilot' ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: eng === 'pilot' ? '#fff8f6' : undefined,
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
              onClick={() => setEng('pilot')}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>🎁 Pilot Programme</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>₦3,500,000 · credited on conversion</div>
            </button>
            <button
              type="button"
              style={{
                border: eng === 'full' ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: eng === 'full' ? '#fff8f6' : undefined,
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
              onClick={() => setEng('full')}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>📈 Full Deployment</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>₦4,500,000 (₦1M pilot convert)</div>
            </button>
          </div>
          <FormGroup label="Fee Received (₦) — optional">
            <input
              type="number"
              className="inp"
              placeholder="Leave blank if payment not yet received"
              value={feeReceived}
              onChange={(e) => setFeeReceived(e.target.value)}
              min={0}
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              Total due at activation: <strong>{formatNaira(billing.grandTotal)}</strong>
              {eng === 'pilot' ? ' · Pilot fee credited on full deployment within 90 days.' : ''}
              {' · '}
              Invoices are created as <strong>Pending</strong> — mark paid later in Finance.
            </div>
          </FormGroup>
        </>
      )}

      {step === 2 && (
        <>
          <div className="info-b">ℹ Creates the primary client admin account. Welcome email sent on activation.</div>
          <div className="fr2">
            <FormGroup label="First Name *">
              <input className="inp" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
            </FormGroup>
            <FormGroup label="Last Name *">
              <input className="inp" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
            </FormGroup>
          </div>
          <FormGroup label="Admin Email * (login email)">
            <input
              className="inp"
              type="email"
              placeholder="admin@clientdomain.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
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
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ padding: '9px 11px', background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginBottom: 14 }}>
            ✓ Review all details before activating.
          </div>
          {reviewLines.map((row) => (
            <div className="srow" key={row.label}>
              <span style={{ color: 'var(--text2)' }}>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              background: 'var(--bb)',
              borderRadius: 7,
              fontSize: 12,
              color: 'var(--bt)',
            }}
          >
            <strong>Invoices to be created (Pending)</strong>
            <div className="srow" style={{ marginTop: 6 }}>
              <span>Onboarding fee</span>
              <span>{formatNaira(billing.onboardingFee)}</span>
            </div>
            {billing.crm && (
              <div className="srow">
                <span>CRM {crmCycle === 'annual' ? '(annual, 20% off)' : '(monthly)'}</span>
                <span>{formatNaira(billing.crm.total)}</span>
              </div>
            )}
            <div className="srow" style={{ fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
              <span>Total</span>
              <span>{formatNaira(billing.grandTotal)}</span>
            </div>
          </div>
          <div className="info-b" style={{ marginTop: 12 }}>
            ℹ Payment confirmation is not required to activate. Invoices will be created as{' '}
            <strong>Pending</strong> — use Finance → Mark Paid when payment is received.
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <Button variant="secondary" style={{ visibility: step === 0 ? 'hidden' : 'visible' }} onClick={() => setStep((s) => s - 1)} disabled={saving}>
          ← Back
        </Button>
        <Button className="bacc" onClick={goNext} disabled={saving}>
          {step === STEPS.length - 1 ? (saving ? 'Activating…' : 'Activate Client Account ✓') : 'Continue →'}
        </Button>
      </div>
    </>
  );
}
