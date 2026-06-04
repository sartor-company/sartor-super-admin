import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { BackLink } from '../components/ui/BackLink';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ClientAvatar } from '../components/ui/ClientAvatar';
import { FormGroup } from '../components/ui/FormGroup';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import { TabBar } from '../components/ui/TabBar';
import { NoteList, SectionTitle, ToggleRow, type NoteItemData } from '../components/patterns';
import { useOpenTeamMember } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { CLIENTS } from '../data/clients';
import { useTabs } from '../hooks/useTabs';
import { crmPillLabel, crmPillVariant, exportReport, scPillVariant } from './shared';

type ClientTab = 'overview' | 'config' | 'credits' | 'team' | 'skus';

const INITIAL_NOTES: NoteItemData[] = [
  { author: 'Amaka Eze', date: 'Apr 10, 2026', text: 'Client requested second DORA training for BATCH-041 after label redesign.', warn: false },
  { author: 'Chidi Ogu', date: 'Mar 28, 2026', text: 'PIN download issue resolved. Batch Admin trained on new ZIP format.', warn: false },
  { author: 'System Alert', date: 'Apr 15, 2026', text: 'SMS credits below 20% threshold. Auto-alert sent to Account Owner.', warn: true },
];

const TEAM = [
  { name: 'Nnamdi Okafor', email: 'nnamdi@sartorhealth.com', role: 'Account Owner', roleVariant: 'bp' as const, access: 'SC + CRM', login: 'May 12, 2026' },
  { name: 'Sarah Adeyemi', email: 'sarah@sartorhealth.com', role: 'Batch Admin', roleVariant: 'bb' as const, access: 'SC', login: 'May 11, 2026' },
  { name: 'Funmi Hassan', email: 'funmi@sartorhealth.com', role: 'CRM Admin', roleVariant: 'bn' as const, access: 'CRM', login: 'May 12, 2026' },
];

const SKUS = [
  { product: 'Sartor Hand Sanitiser 500ml', sku: 'SC-HPC-SHC-00001', barcode: 'EAN-13', batches: 12, auth: '97.2%', dora: 'Active' },
  { product: 'Carabiner Holder Pack', sku: 'SC-HPC-SHC-00002', barcode: 'Sartor Code', batches: 8, auth: '98.1%', dora: 'Active' },
  { product: 'Silicone Holder / Hook Pack', sku: 'SC-HPC-SHC-00003', barcode: 'Sartor Code', batches: 6, auth: '96.8%', dora: 'Active' },
  { product: 'Sartor Hand Sanitiser 250ml', sku: 'SC-HPC-SHC-00004', barcode: 'EAN-13', batches: 5, auth: '91.2%', dora: 'Pending' },
];

const TRANSACTIONS = [
  { date: 'May 1, 2026', product: 'CRM 360', type: 'Monthly Seats (12)', qty: '12 seats', amount: '₦300,000', by: 'System', inv: 'INV-2026-047' },
  { date: 'Apr 1, 2026', product: 'SC', type: 'SMS Credits', qty: '+10,000', amount: '₦45,000', by: 'Amaka Eze', inv: 'INV-2026-031' },
  { date: 'Mar 15, 2026', product: 'SC', type: 'PIN Auth Credits', qty: '+10,000', amount: '₦150,000', by: 'Amaka Eze', inv: 'INV-2026-018' },
  { date: 'Jan 1, 2026', product: 'SC', type: 'SKU Annual Licences', qty: '3 SKUs', amount: '₦4,200,000', by: 'Chidi Ogu', inv: 'INV-2026-001' },
];

export function ClientDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { setSelectedClientCode, registerNoteHandler } = useApp();
  const { openModal } = useModal();
  const openTeamMember = useOpenTeamMember();
  const { showToast } = useToast();
  const { active, setActive, isActive } = useTabs<ClientTab>('overview');
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [creditQty, setCreditQty] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState('Batch Calibration');
  const [creditInv, setCreditInv] = useState('');

  useEffect(() => {
    registerNoteHandler((text) => {
      const now = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setNotes((prev) => [
        { author: 'Nwachukwu Confidence', date: now, text, warn: false },
        ...prev,
      ]);
    });
    return () => registerNoteHandler(null);
  }, [registerNoteHandler]);

  const client = useMemo(() => CLIENTS.find((x) => x.code === code), [code]);

  useEffect(() => {
    if (code) setSelectedClientCode(code);
  }, [code, setSelectedClientCode]);

  if (!client) {
    return (
      <Card>
        <p>Client not found.</p>
        <BackLink onClick={() => navigate('/clients')}>← Back to All Clients</BackLink>
      </Card>
    );
  }

  const pilot = client.scband === 'Pilot';
  const crmVar = crmPillVariant(client.crm);
  const crmLbl = crmPillLabel(client.crm);
  const skuCount = pilot ? '1' : client.code === 'SHC' ? '24' : client.code === 'DPL' ? '18' : client.code === 'NKF' ? '8' : '11';

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'config' as const, label: 'Platform Config' },
    { id: 'credits' as const, label: 'Credits & Billing' },
    { id: 'team' as const, label: 'Team' },
    { id: 'skus' as const, label: 'SKUs & Batches' },
  ];

  return (
    <>
      <BackLink onClick={() => navigate('/clients')}>← Back to All Clients</BackLink>

      <div className="pghead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ClientAvatar initials={client.ini} color={client.av} size={44} />
          <div>
            <div className="pgtitle">{client.name}</div>
            <div className="pgsub">
              {client.rc} ·{' '}
              <ProductPill variant={scPillVariant(client.scband)}>SC·{client.scband}</ProductPill>
              {crmVar && crmLbl && <ProductPill variant={crmVar}>{crmLbl}</ProductPill>} · Code: {client.code}
              {client.am ? ` · AM: ${client.am}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={() => openModal('edit-client')}>
            Edit Client
          </Button>
          <Button className="bacc" size="sm" onClick={() => setActive('credits')}>
            + Top Up Credits
          </Button>
        </div>
      </div>

      <TabBar tabs={tabs} active={active} onChange={setActive} />

      {isActive('overview') && (
        <>
          {pilot && (
            <div
              style={{
                padding: '13px 16px',
                background: '#fff8f6',
                border: '2px solid var(--accent)',
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                    🎁 Pilot Programme — Active
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                    90-day pilot · Started Apr 19, 2026 · Expires Jul 18, 2026 · 1 SKU
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ color: 'var(--text3)' }}>Fee paid:</span> <strong>₦3,500,000</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text3)' }}>Days left:</span>{' '}
                      <strong style={{ color: 'var(--at)' }}>67 days</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text3)' }}>Conversion credit:</span>{' '}
                      <strong style={{ color: 'var(--gt)' }}>₦3,500,000</strong>
                    </div>
                  </div>
                </div>
                <Button className="bacc" size="sm" onClick={() => openModal('convert')}>
                  Convert to Full Deployment
                </Button>
              </div>
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 11px',
                  background: 'var(--gb)',
                  borderRadius: 7,
                  fontSize: 11,
                  color: 'var(--gt)',
                }}
              >
                ✓ All pilot data (DORA models, consumer accounts, scan history) carries forward on conversion.
              </div>
            </div>
          )}
          <KCardGrid columns={4}>
            <KCard label="Total SKUs" value={skuCount} />
            <KCard label="Active Batches" value={pilot ? '0' : '12'} />
            <KCard label="Auth Rate (30d)" value={client.authRate === '—' ? '—' : client.authRate} trend="↑ 1.2%" trendType="up" />
            <div style={{ cursor: 'pointer' }} onClick={() => navigate('/investigations')} role="presentation">
              <KCard label="Open Investigations" value="4" trend="Click to view" trendType="dn" />
            </div>
          </KCardGrid>
          <div className="r2">
            <Card style={{ marginBottom: 0 }}>
              <div className="ch">
                <div className="ct">Client information</div>
                <Button variant="secondary" size="sm" onClick={() => openModal('edit-client')}>
                  Edit
                </Button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Company</div>
                  <div style={{ fontWeight: 500 }}>{client.name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>RC Number</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{client.rc}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Industry</div>
                  <div style={{ fontWeight: 500 }}>{client.industry}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Location</div>
                  <div style={{ fontWeight: 500 }}>{client.location.split(' · ')[0]}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Contact</div>
                  <div style={{ fontWeight: 500 }}>Nnamdi Okafor</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Email</div>
                  <div style={{ fontWeight: 500 }}>nnamdi@sartorhealth.com</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>SC Band</div>
                  <ProductPill variant={scPillVariant(client.scband)}>SC·{client.scband}</ProductPill>
                </div>
                {client.crm && (
                  <div>
                    <div style={{ color: 'var(--text3)', marginBottom: 2 }}>CRM Tier</div>
                    <div>
                      {crmLbl && crmVar && <ProductPill variant={crmVar}>{crmLbl}</ProductPill>} · 12 seats · ₦25,000/seat/month
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Client Code</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{client.code}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Onboarded</div>
                  <div style={{ fontWeight: 500 }}>Jan 1, 2026</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Account Manager</div>
                  <div style={{ fontWeight: 500 }}>{client.am ?? '—'}</div>
                </div>
              </div>
            </Card>
            <Card style={{ marginBottom: 0 }}>
              <div className="ch">
                <div className="ct">Internal notes</div>
                <Button variant="secondary" size="sm" onClick={() => openModal('addnote')}>
                  + Add Note
                </Button>
              </div>
              <NoteList notes={notes} />
            </Card>
          </div>
        </>
      )}

      {isActive('config') && (
        <>
          <Card>
            <div className="ct" style={{ marginBottom: 13 }}>
              SartorChain / DORA Configuration
            </div>
            <div className="fr2">
              <FormGroup label="Client Code">
                <input className="inp" value={client.code} readOnly />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                  Generates: SC-HPC-{client.code}-00001. Contact engineering to change.
                </div>
              </FormGroup>
              <FormGroup label="Verification Domain">
                <input className="inp" value="verify.sartor.com (Starter)" readOnly />
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="Default PIN Format">
                <select className="inp" defaultValue="6">
                  <option>6-digit numeric</option>
                  <option>8-digit numeric</option>
                </select>
              </FormGroup>
              <FormGroup label="DORA Model Status">
                <input className="inp" value={`${skuCount} active models`} readOnly />
              </FormGroup>
            </div>
            <Button variant="primary" size="sm" onClick={() => showToast('Configuration saved.', 'success')}>
              Save
            </Button>
          </Card>
          <Card>
            <div className="ct" style={{ marginBottom: 13 }}>
              Verification Domain Upgrade
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ border: '2px solid var(--green)', borderRadius: 9, padding: 13, background: 'var(--gb)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ color: 'var(--gt)' }}>Starter</strong>
                  <Badge variant="bg">Active</Badge>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--gt)', marginBottom: 4 }}>
                  verify.sartor.com
                </div>
                <div style={{ fontSize: 11, color: 'var(--gt)' }}>Included · ₦0</div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 9, padding: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>Growth Subdomain</strong>
                  <Badge variant="bx">Inactive</Badge>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                  verify-{client.code.toLowerCase()}.sartor.ng
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>₦100,000 one-time</div>
                <Button className="bacc" size="sm" onClick={() => openModal('domain-upgrade')}>
                  Upgrade
                </Button>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 9, padding: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>Enterprise CNAME</strong>
                  <Badge variant="bx">Inactive</Badge>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                  verify.sartorhealth.com
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>
                  ₦150K setup + ₦200K/yr
                </div>
                <Button variant="primary" size="sm" onClick={() => openModal('domain-upgrade')}>
                  Upgrade
                </Button>
              </div>
            </div>
          </Card>
          <Card>
            <div className="ct" style={{ marginBottom: 4 }}>
              Gift Engine Stacking
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 13 }}>
              Super Admin only. Cannot be self-served by client.
            </div>
            <ToggleRow
              label="Campaign stacking (default OFF)"
              description="Allow consumers to win from multiple simultaneous campaigns per scan. FIRST_AUTH pools always exempt."
              defaultOn={false}
              messageOn="Campaign stacking enabled."
              messageOff="Campaign stacking disabled."
            />
          </Card>
          {client.crm && (
            <Card>
              <div className="ct" style={{ marginBottom: 13 }}>
                Sartor CRM Configuration
              </div>
              <div className="fr2">
                <FormGroup label="CRM Tier">
                  <input className="inp" value={client.crm} readOnly />
                </FormGroup>
                <FormGroup label="Active Seats">
                  <input className="inp" value="12 of 20 provisioned" readOnly />
                </FormGroup>
              </div>
              <div className="fr2">
                <FormGroup label="Monthly Billing">
                  <input className="inp" value="12 × ₦25,000 = ₦300,000/month" readOnly />
                </FormGroup>
                <FormGroup label="Next Billing">
                  <input className="inp" value="May 30, 2026" readOnly />
                </FormGroup>
              </div>
              <ToggleRow
                label="SartorChain + DORA integration"
                description="Authentication events available in CRM 360 supply chain reports. Bidirectional sync."
                defaultOn
                messageOn="Integration setting updated."
                messageOff="Integration setting updated."
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => openModal('seatadj')}>
                  Adjust Seat Count
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openModal('crm-tier')}>
                  Change CRM Tier
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {isActive('credits') && (
        <>
          <SectionTitle style={{ marginTop: 0 }}>SartorChain Credits</SectionTitle>
          <div className="kgrid3">
            <KCard
              label="Batch Calibration"
              value="18"
              trend="of 30 purchased"
              trendType="neu"
              progressPercent={60}
              progressColor="var(--amber)"
            />
            <KCard label="PIN Authentication" value="8,200" trend="of 10,000" trendType="up" progressPercent={82} />
            <KCard
              label="SMS Notifications"
              value="5,876"
              trend="41% used"
              trendType="dn"
              progressPercent={59}
              progressColor="var(--amber)"
            />
          </div>
          <Card>
            <div className="ch">
              <div className="ct">Add SartorChain Credits</div>
            </div>
            <div className="fr3">
              <FormGroup label="Credit Type">
                <select className="inp" value={creditType} onChange={(e) => setCreditType(e.target.value)}>
                  <option>Batch Calibration</option>
                  <option>PIN Authentication</option>
                  <option>SMS Notifications</option>
                </select>
              </FormGroup>
              <FormGroup label="Quantity">
                <input
                  type="number"
                  className="inp"
                  placeholder="e.g. 10,000"
                  value={creditQty}
                  onChange={(e) => setCreditQty(e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Amount Charged (₦)">
                <input
                  className="inp"
                  placeholder="₦ invoiced"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </FormGroup>
            </div>
            <FormGroup label="Invoice Reference">
              <input
                className="inp"
                placeholder="INV-2026-XXX"
                value={creditInv}
                onChange={(e) => setCreditInv(e.target.value)}
              />
            </FormGroup>
            <Button
              className="bacc"
              size="sm"
              onClick={() => {
                if (!creditQty.trim() || !creditAmount.trim()) {
                  showToast('Please fill in quantity and amount.', 'error');
                  return;
                }
                const qty = parseInt(creditQty, 10);
                showToast(
                  `${qty.toLocaleString()} ${creditType} added. Transaction logged.`,
                  'success',
                );
                setCreditQty('');
                setCreditAmount('');
                setCreditInv('');
              }}
            >
              Add Credits & Log Transaction
            </Button>
          </Card>
          {client.crm && (
            <Card>
              <div className="ct" style={{ marginBottom: 4 }}>
                Sartor CRM Monthly Billing
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 13 }}>
                All CRM tiers are billed <strong>per seat per month</strong>. CRM 360: ₦25,000/seat/month.
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 10, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: 'var(--text3)' }}>Active seats:</span> <strong>12</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text3)' }}>Rate:</span> <strong>₦25,000/seat/month</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text3)' }}>Monthly total:</span> <strong>₦300,000</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text3)' }}>Annual (20% off):</span> <strong>₦2,880,000</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text3)' }}>Next billing:</span> <strong>May 30, 2026</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="secondary" size="sm" onClick={() => openModal('seatadj')}>
                  Adjust Seat Count
                </Button>
                <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
                  Create Invoice
                </Button>
              </div>
            </Card>
          )}
          <Card>
            <div className="ch">
              <div className="ct">Transaction History</div>
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Transaction History')}>
                ↓ Export CSV
              </Button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Logged By</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((t) => (
                  <tr key={t.inv}>
                    <td>{t.date}</td>
                    <td>
                      <ProductPill variant={t.product.includes('360') ? '360' : 'growth'}>{t.product}</ProductPill>
                    </td>
                    <td>{t.type}</td>
                    <td>{t.qty}</td>
                    <td>{t.amount}</td>
                    <td>{t.by}</td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{t.inv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {isActive('team') && (
        <Card>
          <div className="ch">
            <div className="ct">Client Team Members</div>
            <Button className="bacc" size="sm" onClick={() => openTeamMember(null)}>
              + Add Member
            </Button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Product Access</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {TEAM.map((m) => (
                <tr key={m.email}>
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td>{m.email}</td>
                  <td>
                    <Badge variant={m.roleVariant}>{m.role}</Badge>
                  </td>
                  <td>{m.access}</td>
                  <td>{m.login}</td>
                  <td>
                    <Badge variant="bg">Active</Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Button variant="secondary" size="sm" onClick={() => openTeamMember(m.name)}>
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => showToast('Password reset sent.', 'success')}
                      >
                        Reset PW
                      </Button>
                      {m.name === 'Funmi Hassan' && (
                        <Button variant="danger" size="sm" onClick={() => showToast('User deactivated.', 'warn')}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {isActive('skus') && (
        <Card>
          <div className="ch">
            <div className="ct">Registered SKUs</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'SKU List')}>
                ↓ Export
              </Button>
              <Button className="bacc" size="sm" onClick={() => showToast('SKU registration request sent.', 'success')}>
                + Register SKU
              </Button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Sartor SKU</th>
                <th>Barcode</th>
                <th>Batches</th>
                <th>Auth Rate</th>
                <th>DORA</th>
              </tr>
            </thead>
            <tbody>
              {SKUS.map((s) => (
                <tr key={s.sku}>
                  <td>
                    <strong>{s.product}</strong>
                  </td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{s.sku}</td>
                  <td>{s.barcode}</td>
                  <td>{s.batches}</td>
                  <td style={{ color: s.dora === 'Pending' ? 'var(--at)' : 'var(--gt)', fontWeight: 600 }}>{s.auth}</td>
                  <td>
                    <Badge variant={s.dora === 'Active' ? 'bg' : 'ba'}>{s.dora}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
