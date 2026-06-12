import { useEffect, useState } from 'react';
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
import { platformApi } from '../api/platform';
import type { Client } from '../data/clients';
import { useTabs } from '../hooks/useTabs';
import { crmPillLabel, crmPillVariant, exportReport, scPillVariant } from './shared';

import { usePlatform } from '../context/PlatformContext';

type ClientTab = 'overview' | 'config' | 'credits' | 'team' | 'skus';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleVariant: 'bp' | 'bb' | 'bn';
  access: string;
  login: string;
  status: string;
  isOwner?: boolean;
};

type SkuRow = {
  product: string;
  sku: string;
  barcode: string;
  batches: number;
  auth: string;
  dora: string;
};

type TxRow = {
  date: string;
  product: string;
  type: string;
  qty: string;
  amount: string;
  by: string;
  inv: string;
};

type ClientDetail = Client & {
  notes?: NoteItemData[];
  skus?: SkuRow[];
  transactions?: TxRow[];
  team?: TeamMember[];
  contactEmail?: string;
  contactPhone?: string;
  onboardedAt?: string;
  engagement?: string;
  openInvestigations?: number;
  scEnabled?: boolean;
  crmEnabled?: boolean;
  campaignStacking?: boolean;
  crmSeats?: number;
  verifyDomain?: string;
  domainTier?: string;
};

export function ClientDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const {
    setSelectedClientCode,
    setSelectedClientDetail,
    registerNoteHandler,
    registerTeamReload,
    registerClientReload,
  } = useApp();
  const { refresh } = usePlatform();
  const { openModal } = useModal();
  const openTeamMember = useOpenTeamMember();
  const { showToast } = useToast();
  const { active, setActive, isActive } = useTabs<ClientTab>('overview');
  const [client, setClient] = useState<Client | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<NoteItemData[]>([]);
  const [creditQty, setCreditQty] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState('PIN Authentication');
  const [creditInv, setCreditInv] = useState('');
  const [creditSaving, setCreditSaving] = useState(false);
  const [scEnabled, setScEnabled] = useState(true);
  const [crmEnabledCfg, setCrmEnabledCfg] = useState(false);
  const [campaignStacking, setCampaignStacking] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const reloadClient = async (clientCode: string) => {
    const data = (await platformApi.client(clientCode)) as ClientDetail;
    setClient(data);
    setDetail(data as unknown as Record<string, unknown>);
    setSelectedClientDetail(data);
    if (data.notes?.length) setNotes(data.notes);
    return data;
  };

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    reloadClient(code)
      .catch(() => {
        setClient(null);
        setSelectedClientDetail(null);
      })
      .finally(() => setLoading(false));
  }, [code, setSelectedClientDetail]);

  useEffect(() => {
    const reload = () => {
      if (code) reloadClient(code).catch(() => undefined);
    };
    registerTeamReload(reload);
    registerClientReload(reload);
    return () => {
      registerTeamReload(null);
      registerClientReload(null);
    };
  }, [code, registerTeamReload, registerClientReload]);

  useEffect(() => {
    const cfg = detail as unknown as ClientDetail | null;
    if (!cfg) return;
    setScEnabled(cfg.scEnabled !== false);
    setCrmEnabledCfg(!!cfg.crmEnabled);
    setCampaignStacking(!!cfg.campaignStacking);
  }, [detail]);

  useEffect(() => {
    registerNoteHandler(async (text) => {
      const id = client?._id || (detail?._id as string | undefined);
      if (!id) return;
      try {
        const updated = await platformApi.addNote(id, text);
        setNotes(updated as NoteItemData[]);
        showToast('Note saved.', 'success');
      } catch {
        showToast('Failed to save note.', 'error');
      }
    });
    return () => registerNoteHandler(null);
  }, [registerNoteHandler, client?._id, detail?._id, showToast]);

  useEffect(() => {
    if (code) setSelectedClientCode(code);
  }, [code, setSelectedClientCode]);

  if (loading) {
    return (
      <Card>
        <p>Loading client…</p>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card>
        <p>Client not found.</p>
        <BackLink onClick={() => navigate('/clients')}>← Back to All Clients</BackLink>
      </Card>
    );
  }

  const d = detail as unknown as ClientDetail | null;
  const pilot = client.scband === 'Pilot' || d?.engagement === 'pilot';
  const crmVar = crmPillVariant(client.crm);
  const crmLbl = crmPillLabel(client.crm);
  const skuCount = String(client.skus ?? 0);
  const apiSkus = d?.skus ?? [];
  const apiTeam = d?.team ?? [];
  const apiTransactions = d?.transactions ?? [];
  const pinCredits = client.pinCredits ?? 0;
  const smsCredits = client.smsCredits ?? 0;
  const openInvCount = d?.openInvestigations ?? 0;
  const crmSeatCount = d?.crmSeats ?? client.crmSeats ?? 0;
  const verifyDomain = d?.verifyDomain || client.verifyDomain || 'verify.sartor.com';

  const saveConfig = async () => {
    const id = client._id;
    if (!id) return;
    setConfigSaving(true);
    try {
      await platformApi.patchClient(id, {
        scEnabled,
        crmEnabled: crmEnabledCfg,
        campaignStacking,
      });
      await reloadClient(code!);
      await refresh();
      showToast('Configuration saved.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save configuration.', 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  const addCredits = async () => {
    const id = client._id;
    if (!id || !creditQty.trim() || !creditAmount.trim()) {
      showToast('Please fill in quantity and amount.', 'error');
      return;
    }
    const qty = parseInt(creditQty, 10);
    if (!qty || qty < 1) {
      showToast('Enter a valid quantity.', 'error');
      return;
    }
    const amount = parseFloat(creditAmount.replace(/,/g, ''));
    setCreditSaving(true);
    try {
      const patch: Record<string, number> = {};
      if (creditType === 'PIN Authentication') patch.pinCredits = pinCredits + qty;
      else if (creditType === 'SMS Notifications') patch.smsCredits = smsCredits + qty;
      else {
        showToast('Batch calibration credits are logged via invoice only.', 'success');
      }
      if (Object.keys(patch).length) await platformApi.patchClient(id, patch);
      await platformApi.createInvoice({
        adminId: id,
        clientName: client.name,
        clientCode: client.code,
        description: `${creditType} — ${qty.toLocaleString()} units`,
        amount,
      });
      if (code) await reloadClient(code);
      await refresh();
      showToast(`${qty.toLocaleString()} ${creditType} added. Invoice created.`, 'success');
      setCreditQty('');
      setCreditAmount('');
      setCreditInv('');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not add credits.', 'error');
    } finally {
      setCreditSaving(false);
    }
  };

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
            <KCard label="Active Batches" value={String(client.batches ?? 0)} />
            <KCard label="Auth Rate (30d)" value={client.authRate === '—' ? '—' : client.authRate} trendType="up" />
            <div style={{ cursor: 'pointer' }} onClick={() => navigate('/investigations')} role="presentation">
              <KCard label="Open Investigations" value={String(openInvCount)} trend="Click to view" trendType="dn" />
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
                  <div style={{ fontWeight: 500 }}>{d?.contactEmail || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Phone</div>
                  <div style={{ fontWeight: 500 }}>{d?.contactPhone || '—'}</div>
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
                  <div style={{ fontWeight: 500 }}>{d?.onboardedAt || '—'}</div>
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
                <input className="inp" value={verifyDomain} readOnly />
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
            <Button variant="primary" size="sm" onClick={saveConfig} disabled={configSaving}>
              {configSaving ? 'Saving…' : 'Save'}
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
              key={`stack-${String(campaignStacking)}`}
              label="Campaign stacking (default OFF)"
              description="Allow consumers to win from multiple simultaneous campaigns per scan. FIRST_AUTH pools always exempt."
              defaultOn={campaignStacking}
              onToggle={setCampaignStacking}
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
                  <input className="inp" value={`${crmSeatCount} provisioned`} readOnly />
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
                key={`crm-int-${scEnabled}-${crmEnabledCfg}`}
                label="SartorChain + DORA integration"
                description="Authentication events available in CRM 360 supply chain reports. Bidirectional sync."
                defaultOn={scEnabled && crmEnabledCfg}
                onToggle={(on) => {
                  setScEnabled(on);
                  setCrmEnabledCfg(on);
                }}
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
            <KCard label="PIN Authentication" value={String(pinCredits)} trend="Live balance" trendType="up" />
            <KCard label="SMS Notifications" value={String(smsCredits)} trend="Live balance" trendType="neu" />
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
            <Button className="bacc" size="sm" onClick={addCredits} disabled={creditSaving}>
              {creditSaving ? 'Saving…' : 'Add Credits & Create Invoice'}
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
                {apiTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)' }}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  apiTransactions.map((t) => (
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
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {isActive('team') && (
        <Card>
          <div className="ch">
            <div className="ct">Client Team Members</div>
            <Button
              className="bacc"
              size="sm"
              onClick={() => client._id && openTeamMember(client._id, null)}
            >
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
              {apiTeam.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)' }}>
                    No team members yet.
                  </td>
                </tr>
              ) : (
                apiTeam.map((m) => (
                  <tr key={m.id || m.email}>
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
                      <Badge variant={m.status === 'Active' ? 'bg' : 'bx'}>{m.status}</Badge>
                    </td>
                    <td>
                      {!m.isOwner && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            client._id &&
                            openTeamMember(client._id, {
                              id: m.id,
                              name: m.name,
                              email: m.email,
                              role: m.role,
                            })
                          }
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
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
              <Button
                className="bacc"
                size="sm"
                onClick={async () => {
                  const id = client._id;
                  if (!id) return;
                  try {
                    await platformApi.addNote(id, 'SKU registration requested by platform team.');
                    showToast('SKU registration request logged.', 'success');
                  } catch {
                    showToast('Could not log request.', 'error');
                  }
                }}
              >
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
              {apiSkus.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)' }}>
                    No SKUs registered yet.
                  </td>
                </tr>
              ) : (
                apiSkus.map((s) => (
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
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
