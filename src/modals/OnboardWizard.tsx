import { useMemo, useState } from 'react';
import { platformApi } from '../api/platform';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { usePlatform } from '../context/PlatformContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/format';

const STEPS = ['Company Information', 'Products & Engagement', 'Admin Account Setup', 'Review & Activate'];

function scBandFromSkus(n: number): 'Pilot' | 'Starter' | 'Growth' {
  if (n <= 5) return 'Starter';
  return 'Growth';
}

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
  const [skuN, setSkuN] = useState('');

  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const onboardingFee = eng === 'pilot' ? 3500000 : 4500000;
  const skuCount = parseInt(skuN, 10) || 0;
  const scBand = eng === 'pilot' ? 'Pilot' : skuCount > 0 ? scBandFromSkus(skuCount) : 'Pilot';

  const obCrmBilling = () => {
    const rate = crmRate;
    const seats = parseInt(crmSeats, 10) || 0;
    if (!rate || !seats) return null;
    const monthly = rate * seats;
    const annual = monthly * 12 * 0.8;
    const label =
      crmCycle === 'annual'
        ? `${formatNaira(annual)} annually (20% off · ${formatNaira(monthly)}/month equivalent)`
        : `${formatNaira(monthly)}/month`;
    return (
      <div style={{ padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)', marginTop: 8 }}>
        <strong>{crmName}</strong> · {seats} seat{seats > 1 ? 's' : ''} · {formatNaira(rate)}/seat/month
        <br />
        Total: <strong>{label}</strong>
      </div>
    );
  };

  const skuBand = () => {
    const n = skuCount;
    if (n >= 1 && n <= 5)
      return (
        <div style={{ marginTop: 7, padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)' }}>
          <strong>Starter (1–5 SKUs)</strong> — {formatNaira(350000)}/SKU/yr · Total:{' '}
          <span style={{ color: 'var(--gt)' }}>{formatNaira(n * 350000)}/yr</span>
        </div>
      );
    if (n >= 6 && n <= 20)
      return (
        <div style={{ marginTop: 7, padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)' }}>
          <strong>Growth (6–20 SKUs)</strong> — {formatNaira(250000)}/SKU/yr · Total:{' '}
          <span style={{ color: 'var(--gt)' }}>{formatNaira(n * 250000)}/yr</span>
        </div>
      );
    if (n >= 21 && n <= 50)
      return (
        <div style={{ marginTop: 7, padding: 9, background: 'var(--gb)', borderRadius: 7, fontSize: 12, color: 'var(--gt)' }}>
          <strong>Enterprise (21–50 SKUs)</strong> — {formatNaira(175000)}/SKU/yr · Total:{' '}
          <span style={{ color: 'var(--gt)' }}>{formatNaira(n * 175000)}/yr</span>
        </div>
      );
    if (n > 50)
      return (
        <div style={{ marginTop: 7, padding: 9, background: 'var(--pb)', borderRadius: 7, fontSize: 12, color: 'var(--pt)' }}>
          <strong>Enterprise+ (51+ SKUs)</strong> — Negotiated rate. Contact Sartor.
        </div>
      );
    return (
      <div style={{ marginTop: 7, padding: 9, background: 'var(--bg)', borderRadius: 7, fontSize: 12, color: 'var(--text2)' }}>
        Enter SKU count to see rate.
      </div>
    );
  };

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
      if (eng === 'full' && skuCount < 1) {
        showToast('Enter initial SKU count for full deployment.', 'error');
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

  const reviewLines = useMemo(
    () => [
      { label: 'Company', value: companyName || '—' },
      { label: 'RC Number', value: rcNumber || '—' },
      { label: 'Industry', value: industry || '—' },
      { label: 'Contact email', value: contactEmail || '—' },
      { label: 'Engagement', value: eng === 'pilot' ? 'Pilot Programme' : 'Full Deployment' },
      { label: 'SC Band', value: scBand },
      { label: 'CRM', value: crmOn ? `${crmName} · ${crmSeats || 0} seats` : 'Not included' },
      { label: 'Admin login', value: adminEmail || '—' },
      { label: 'Onboarding fee', value: formatNaira(onboardingFee) },
    ],
    [
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
      onboardingFee,
    ],
  );

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
        crmSeats: crmOn && crmSeats ? parseInt(crmSeats, 10) : undefined,
        skuCount: eng === 'full' && skuCount > 0 ? skuCount : undefined,
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 13 }}>
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
          {eng === 'full' && (
            <FormGroup label="Initial SKU Count *">
              <input type="number" className="inp" value={skuN} onChange={(e) => setSkuN(e.target.value)} min={1} />
              {skuBand()}
            </FormGroup>
          )}
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
          <div className="warn-b" style={{ marginTop: 12 }}>
            ⚠ Confirm fee receipt before activating. Invoice for {formatNaira(onboardingFee)} will be created.
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
