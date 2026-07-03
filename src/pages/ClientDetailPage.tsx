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
import { Loader } from '../components/ui/Loader';
import { NoteList, SectionTitle, ToggleRow, type NoteItemData } from '../components/patterns';
import { useOpenTeamMember } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useToast } from '../context/ToastContext';
import { platformApi } from '../api/platform';
import type { Client } from '../data/clients';
import { useTabs } from '../hooks/useTabs';
import { crmPillLabel, crmPillVariant, tierPillClass } from './shared';
import { InvoiceDetailModal } from '../modals/InvoiceDetailModal';
import {
  formatInvoiceAmount,
  formatUsd,
  invoiceStatusVariant,
  type PlatformInvoiceRow,
} from '../utils/financeDisplay';
import { transactionToInvoiceRow } from '../utils/invoiceDownload';
import { deriveClientTierProfile, crmBillingDetail } from '../utils/clientTier';
import { useActivateClient, clientProductsLabel } from '../hooks/useActivateClient';
import { useRoleGates } from '../hooks/useRoleGates';

type ClientTab = 'overview' | 'config' | 'credits' | 'team' | 'skus' | 'billing';

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
  amountNum?: number;
  by: string;
  inv: string;
  invoiceId?: string;
  status?: string;
  _id?: string;
  lineItems?: { desc?: string; amt?: number; type?: string }[];
};

type ClientDetail = Client & {
  notes?: NoteItemData[];
  skuRows?: SkuRow[];
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
  latestInvoice?: { invoiceId: string; status: string; amount: number } | null;
  lpos?: unknown[];
  leads?: unknown[];
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
  const openActivate = useActivateClient();
  const { can } = useRoleGates();
  const canActivate = can('activate');
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
  const [skuSearch, setSkuSearch] = useState('');
  const [skuDoraFilter, setSkuDoraFilter] = useState('all');
  const [creditSaving, setCreditSaving] = useState(false);
  const [scEnabled, setScEnabled] = useState(true);
  const [crmEnabledCfg, setCrmEnabledCfg] = useState(false);
  const [campaignStacking, setCampaignStacking] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<PlatformInvoiceRow | null>(null);

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

  const d = detail as unknown as ClientDetail | null;
  const apiTeam = d?.team ?? [];
  const lpoCount = d?.lpos?.length ?? 0;
  const leadCount = d?.leads?.length ?? 0;
  const crmSeatCount = client?.crmSeats ?? d?.crmSeats ?? 0;

  const tierProfile = useMemo(() => {
    if (!client) {
      return deriveClientTierProfile({
        name: '',
        code: '',
        rc: '',
        av: '#1A2D7C',
        ini: '—',
        crm: null,
        scband: 'Pilot',
        location: '',
        industry: '',
        skus: 0,
        batches: 0,
        authRate: '—',
        creditHealth: { label: '—', variant: 'bx' },
        status: 'Active',
        products: '—',
      });
    }
    return deriveClientTierProfile(client, {
      lpoCount,
      leadCount,
      teamCount: apiTeam.length,
    });
  }, [client, lpoCount, leadCount, apiTeam.length]);

  const crmBill = useMemo(
    () => crmBillingDetail(tierProfile, crmSeatCount),
    [tierProfile, crmSeatCount],
  );

  const allTabs = useMemo(
    () =>
      [
        { id: 'overview' as const, label: 'Overview' },
        { id: 'config' as const, label: 'Platform Config' },
        { id: 'credits' as const, label: 'Credits & Billing' },
        { id: 'team' as const, label: 'Team' },
        { id: 'skus' as const, label: 'SKUs & Batches' },
        { id: 'billing' as const, label: 'Billing & Invoices' },
      ],
    [],
  );

  const visibleTabs = useMemo(
    () =>
      allTabs.filter((t) => {
        if (t.id === 'skus' || t.id === 'config') return tierProfile.showSkuTab;
        if (t.id === 'credits') return tierProfile.showScCredits;
        return true;
      }),
    [allTabs, tierProfile],
  );

  useEffect(() => {
    if (!client) return;
    if (!visibleTabs.some((t) => t.id === active)) setActive('overview');
  }, [visibleTabs, active, setActive, client]);

  const apiSkus = useMemo(() => {
    const rows = d?.skuRows;
    if (Array.isArray(rows)) return rows;
    // Legacy API: skus was an array on detail payloads
    const legacy = d?.skus;
    return Array.isArray(legacy) ? (legacy as SkuRow[]) : [];
  }, [d]);

  const skuTotal = useMemo(() => {
    if (typeof client?.skus === 'number') return client.skus;
    const raw = (detail as Record<string, unknown> | null)?.skus;
    if (Array.isArray(raw)) return raw.length;
    return apiSkus.length;
  }, [client?.skus, detail, apiSkus.length]);

  const batchTotal = useMemo(() => {
    if (typeof client?.batches === 'number') return client.batches;
    const raw = (detail as Record<string, unknown> | null)?.batches;
    if (Array.isArray(raw)) return raw.length;
    return apiSkus.reduce((sum, s) => sum + (s.batches ?? 0), 0);
  }, [client?.batches, detail, apiSkus]);
  const apiTransactions = d?.transactions ?? [];
  const totalSkuBatches = useMemo(
    () => apiSkus.reduce((sum, s) => sum + (s.batches ?? 0), 0),
    [apiSkus],
  );
  const filteredSkus = useMemo(() => {
    const q = skuSearch.toLowerCase().trim();
    return apiSkus.filter((s) => {
      const matchQ =
        !q ||
        s.product.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q);
      const matchDora = skuDoraFilter === 'all' || s.dora === skuDoraFilter;
      return matchQ && matchDora;
    });
  }, [apiSkus, skuSearch, skuDoraFilter]);

  if (loading) {
    return <Loader label="Loading client…" />;
  }

  if (!client) {
    return (
      <Card>
        <p>Client not found.</p>
        <BackLink onClick={() => navigate('/clients')}>← Back to All Clients</BackLink>
      </Card>
    );
  }

  const inactive = client.accountActivated === false || client.accountStatus === 'inactive';
  const latestInvoice = d?.latestInvoice;
  const pilot = !inactive && (client.scband === 'Pilot' || d?.engagement === 'pilot');
  const crmVar = crmPillVariant(client.crm);
  const crmLbl = crmPillLabel(client.crm);
  const skuCount = String(skuTotal);
  const pinCredits = client.pinCredits ?? 0;
  const smsCredits = client.smsCredits ?? 0;
  const openInvCount = d?.openInvestigations ?? 0;
  const verifyDomain = d?.verifyDomain || client.verifyDomain || 'verify.sartor.com';
  const tabs = visibleTabs;

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

  return (
    <>
      <BackLink onClick={() => navigate('/clients')}>← Back to All Clients</BackLink>

      <div className="pghead cd-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <ClientAvatar initials={client.ini} color={client.av} size={44} />
          <div style={{ minWidth: 0 }}>
            <div className="pgtitle" style={{ whiteSpace: 'normal' }}>
              {client.name}
            </div>
            <div className="pgsub" style={{ whiteSpace: 'normal' }}>
              {client.rc} ·{' '}
              <span className={`tier-pill ${tierPillClass(client)}`}>{tierProfile.tierLabel}</span> · Code:{' '}
              {client.code}
              {client.am ? ` · AM: ${client.am}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={() => openModal('edit-client')}>
            Edit Client
          </Button>
          {tierProfile.showScCredits && can('topup') && (
            <Button className="bacc" size="sm" onClick={() => setActive('credits')}>
              + Top Up Credits
            </Button>
          )}
        </div>
      </div>

      <TabBar tabs={tabs} active={active} onChange={setActive} />

      {isActive('overview') && (
        <>
          {inactive && (
            <div
              style={{
                padding: '13px 16px',
                background: '#fffaf2',
                border: '2px solid var(--amber)',
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>
                    ⚠ Account Inactive — Awaiting Activation
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {latestInvoice?.invoiceId
                      ? `Onboarding invoice ${latestInvoice.invoiceId} · ${/^paid$/i.test(latestInvoice.status) ? 'Paid' : 'Pending Payment'}.`
                      : 'Onboarding invoice pending.'}{' '}
                    The MD/CEO can activate now regardless of payment status.
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>
                    Onboarding/deployment fee is arranged by Sartor Admin. Activation is independent of payment — the
                    MD/CEO may activate on credit (audit-logged).
                  </div>
                </div>
                {canActivate && client._id && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() =>
                      openActivate({
                        clientId: client._id!,
                        code: client.code,
                        name: client.name,
                        email: d?.contactEmail || client.email || '',
                        products: clientProductsLabel(client),
                        invoiceId: latestInvoice?.invoiceId,
                        invoiceStatus: latestInvoice?.status,
                      })
                    }
                  >
                    ✓ Activate Account
                  </Button>
                )}
              </div>
            </div>
          )}
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
                {can('convert') && (
                  <Button className="bacc" size="sm" onClick={() => openModal('convert')}>
                    Convert to Full Deployment
                  </Button>
                )}
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
            {tierProfile.hasAuth ? (
              <>
                <KCard label="Total SKUs" value={skuCount} />
                <KCard label="Active Batches" value={String(batchTotal)} />
                <KCard
                  label="Auth Rate (30d)"
                  value={client.authRate === '—' ? '—' : client.authRate}
                  trendType="up"
                />
                <div style={{ cursor: 'pointer' }} onClick={() => navigate('/investigations')} role="presentation">
                  <KCard label="Open Investigations" value={String(openInvCount)} trend="Click to view" trendType="dn" />
                </div>
              </>
            ) : (
              <>
                <KCard label="Field Reps" value={String(apiTeam.length)} />
                <KCard label="Active Leads" value={String(leadCount)} />
                <KCard label="LPOs" value={String(lpoCount)} />
                <KCard label="Revenue Seats" value={String(crmSeatCount)} />
              </>
            )}
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
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Contact Name</div>
                  <div style={{ fontWeight: 500 }}>{client.contactName || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Contact Email</div>
                  <div style={{ fontWeight: 500 }}>{d?.contactEmail || client.email || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Phone</div>
                  <div style={{ fontWeight: 500 }}>{d?.contactPhone || '—'}</div>
                </div>
                {tierProfile.hasAuth && (
                  <div>
                    <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Engagement</div>
                    <Badge variant="bgold">{tierProfile.engagementLabel}</Badge>
                  </div>
                )}
                {tierProfile.hasAuth && (
                  <div>
                    <div style={{ color: 'var(--text3)', marginBottom: 2 }}>SKU Tier</div>
                    <Badge variant="bgold">{client.scband}</Badge>
                  </div>
                )}
                {tierProfile.hasCrm && (
                  <div>
                    <div style={{ color: 'var(--text3)', marginBottom: 2 }}>CRM Tier</div>
                    <div>
                      {crmLbl && crmVar && <ProductPill variant={crmVar}>{crmLbl}</ProductPill>}
                      {tierProfile.crmTier !== '360' && (
                        <span style={{ marginLeft: 6, fontSize: 12 }}>
                          · {tierProfile.seatSummary} · {crmBill.rate}
                        </span>
                      )}
                      {tierProfile.crmTier === '360' && (
                        <span style={{ marginLeft: 6, fontSize: 12 }}>· {tierProfile.seatSummary}</span>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Billing Cycle</div>
                  <div style={{ fontWeight: 500 }}>{tierProfile.billingCycleLabel}</div>
                </div>
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
          <Card style={{ marginBottom: 12 }}>
            <div className="ct" style={{ marginBottom: 13 }}>
              Platform Configuration
            </div>
            <div className="fr2">
              <FormGroup label="Client Code (used in Sartor SKU auto-generation)">
                <input className="inp" value={client.code} readOnly />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                  Format: SC-HPC-{client.code}-00001. Set at onboarding — contact engineering to change.
                </div>
              </FormGroup>
              <FormGroup label="QR URL Mode">
                <input className="inp" value="STATIC_PORTAL" readOnly />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                  Static per SKU (default all tiers). BATCH_PATH and UNIT_PATH require Enterprise + VDP confirmed.
                </div>
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="VDP Confirmed">
                <select className="inp" defaultValue="false">
                  <option value="false">FALSE — standard printing only</option>
                  <option value="true">TRUE — VDP capability confirmed by Sartor</option>
                </select>
              </FormGroup>
              <FormGroup label="Current Verification Domain">
                <input
                  className="inp"
                  value={`https://verify.dorascan.ai/${client.code.toLowerCase()}/{order_token}`}
                  readOnly
                />
              </FormGroup>
            </div>
            <Button variant="primary" size="sm" onClick={saveConfig} disabled={configSaving}>
              {configSaving ? 'Saving…' : 'Save Config Changes'}
            </Button>
          </Card>
          <Card style={{ marginBottom: 12 }}>
            <div className="ch">
              <div className="ct">Verification Domain</div>
              <Badge variant="bg">{tierProfile.domainTierLabel} — Active</Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 13 }}>
              All clients start on the Sartor default domain. Domain upgrades are optional commercial add-ons. Each tier
              is independent of SKU volume pricing.
            </div>
            <div className="domain-tier-grid">
              {(() => {
                const activeTier = (client.domainTier || 'starter').toLowerCase();
                const starterActive = activeTier === 'starter';
                const growthActive = activeTier === 'growth';
                const entActive = activeTier === 'enterprise';
                return (
                  <>
                    <div
                      style={{
                        border: starterActive ? '2px solid var(--green)' : '1px solid var(--border)',
                        borderRadius: 9,
                        padding: 13,
                        background: starterActive ? 'var(--gb)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <strong style={{ color: starterActive ? 'var(--gt)' : undefined }}>Starter</strong>
                        <Badge variant={starterActive ? 'bg' : 'bx'}>{starterActive ? 'Active' : 'Available'}</Badge>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--gt)', marginBottom: 4, wordBreak: 'break-all' }}>
                        verify.dorascan.ai/{client.code.toLowerCase()}/{'{order_token}'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gt)', marginBottom: 4 }}>
                        Sartor default domain · Included for all clients at no charge
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gt)', fontWeight: 600 }}>₦0 — Included</div>
                    </div>
                    <div
                      style={{
                        border: growthActive ? '2px solid var(--green)' : '1px solid var(--border)',
                        borderRadius: 9,
                        padding: 13,
                        background: growthActive ? 'var(--gb)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <strong>Growth Subdomain</strong>
                        <Badge variant={growthActive ? 'bg' : 'bx'}>{growthActive ? 'Active' : 'Not Active'}</Badge>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text3)', marginBottom: 4, wordBreak: 'break-all' }}>
                        verify-{client.code.toLowerCase()}.dorascan.ai
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
                        Sartor-managed subdomain · DevOps provisioned · Wildcard SSL included
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>
                        ₦100,000 setup + ₦50,000/yr maintenance
                      </div>
                      {!growthActive && (
                        <Button className="bacc" size="sm" onClick={() => openModal('domain-upgrade')}>
                          Upgrade to Growth
                        </Button>
                      )}
                    </div>
                    <div
                      style={{
                        border: entActive ? '2px solid var(--green)' : '1px solid var(--border)',
                        borderRadius: 9,
                        padding: 13,
                        background: entActive ? 'var(--gb)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <strong>Enterprise CNAME</strong>
                        <Badge variant={entActive ? 'bg' : 'bx'}>{entActive ? 'Active' : 'Not Active'}</Badge>
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text3)', marginBottom: 4, wordBreak: 'break-all' }}>
                        verify.{client.code.toLowerCase()}.com
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>
                        Client&apos;s own domain · CNAME to Sartor · Individual SSL per client
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>
                        ₦150,000 setup + ₦200,000/yr maintenance
                      </div>
                      {!entActive && (
                        <Button variant="primary" size="sm" onClick={() => openModal('domain-upgrade')}>
                          Upgrade to Enterprise
                        </Button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <div
              style={{
                padding: '9px 12px',
                background: 'var(--ab)',
                borderRadius: 7,
                fontSize: 12,
                color: 'var(--at)',
                marginTop: 12,
              }}
            >
              ⚠ Domain upgrades affect all printed QR codes for this client. Existing labels in the field will continue
              to work. New batches after upgrade use the new domain. Inform the client before activating.
            </div>
          </Card>
          <Card>
            <div className="ct" style={{ marginBottom: 4 }}>
              Gift Engine Stacking
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 13 }}>
              Controlled by Sartor Super Admin only. Client cannot self-serve this setting.
            </div>
            <ToggleRow
              key={`stack-${String(campaignStacking)}`}
              label="Campaign stacking"
              description="Allow this client's consumers to win gifts from multiple simultaneous campaigns per scan. Default: OFF. FIRST_AUTH pools always exempt regardless of this setting."
              defaultOn={campaignStacking}
              onToggle={setCampaignStacking}
            />
            <div
              style={{
                padding: 9,
                background: 'var(--ab)',
                borderRadius: 7,
                fontSize: 12,
                color: 'var(--at)',
                marginTop: 11,
              }}
            >
              ⚠ Before enabling: confirm client understands that all qualifying pools will fire on each scan. Document
              confirmation in internal notes.
            </div>
            <Button variant="primary" size="sm" style={{ marginTop: 11 }} onClick={saveConfig} disabled={configSaving}>
              {configSaving ? 'Saving…' : 'Save Config Changes'}
            </Button>
          </Card>
        </>
      )}

      {isActive('credits') && (
        <>
          <div className="kgrid3" style={{ marginBottom: 14 }}>
            <div className="kcard">
              <div className="klbl">Batch Calibration</div>
              <div className="kval">{client.batchCalCredits ?? 0}</div>
              <div className="ktrend neu">of {Math.max(30, client.batchCalCredits ?? 30)} purchased</div>
              <div className="pbar">
                <div
                  className="pfill"
                  style={{
                    width: `${Math.min(100, Math.round(((client.batchCalCredits ?? 0) / Math.max(30, client.batchCalCredits ?? 30)) * 100))}%`,
                    background: 'var(--amber)',
                  }}
                />
              </div>
            </div>
            <div className="kcard">
              <div className="klbl">PIN Authentication</div>
              <div className="kval">{pinCredits.toLocaleString()}</div>
              <div className="ktrend up">of {Math.max(10000, pinCredits).toLocaleString()} purchased</div>
              <div className="pbar">
                <div
                  className="pfill"
                  style={{
                    width: `${Math.min(100, Math.round((pinCredits / Math.max(10000, pinCredits)) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div className="kcard">
              <div className="klbl">SMS Notifications</div>
              <div className="kval">{smsCredits.toLocaleString()}</div>
              <div className="ktrend dn">
                {Math.round((1 - smsCredits / Math.max(10000, smsCredits)) * 100)}% used — monitor
              </div>
              <div className="pbar">
                <div
                  className="pfill"
                  style={{
                    width: `${Math.min(100, Math.round((1 - smsCredits / Math.max(10000, smsCredits)) * 100))}%`,
                    background: 'var(--amber)',
                  }}
                />
              </div>
            </div>
          </div>
          <Card style={{ marginBottom: 12 }}>
            <div className="ch">
              <div className="ct">Add Credits</div>
            </div>
            <div className="fr3">
              <FormGroup label="Credit Type">
                <select className="inp" value={creditType} onChange={(e) => setCreditType(e.target.value)}>
                  <option>Batch Calibration</option>
                  <option>PIN Authentication</option>
                  <option>SMS Notifications</option>
                </select>
              </FormGroup>
              <FormGroup label="Quantity to Add">
                <input
                  type="number"
                  className="inp"
                  placeholder="e.g. 10,000"
                  value={creditQty}
                  onChange={(e) => setCreditQty(e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Amount Charged">
                <input
                  className="inp"
                  placeholder="₦ amount invoiced"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </FormGroup>
            </div>
            <FormGroup label="Notes">
              <input
                className="inp"
                placeholder="e.g. Invoice #INV-2026-041 paid Apr 20"
                value={creditInv}
                onChange={(e) => setCreditInv(e.target.value)}
              />
            </FormGroup>
            {can('topup') && (
              <Button className="bacc" size="sm" onClick={addCredits} disabled={creditSaving}>
                {creditSaving ? 'Saving…' : 'Add Credits & Log Transaction'}
              </Button>
            )}
          </Card>
          <Card>
            <div className="ch">
              <div className="ct">Transaction History</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Added By</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {apiTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)' }}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  apiTransactions.map((t) => (
                    <tr key={t.inv}>
                      <td>{t.date}</td>
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

      {isActive('billing') && (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div className="ch">
              <div className="ct">Current Subscription</div>
              {can('invoice') && (
                <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
                  + Create Invoice
                </Button>
              )}
            </div>
            <div
              style={{
                background: 'var(--navy)',
                borderRadius: 9,
                padding: '14px 18px',
                color: '#fff',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 18,
              }}
            >
              <div style={{ flex: 1, minWidth: 150 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,.5)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  Engagement
                </div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{tierProfile.subscriptionTitle}</div>
                {tierProfile.subscriptionSubtitle ? (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
                    {tierProfile.subscriptionSubtitle}
                  </div>
                ) : null}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,.5)',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {tierProfile.billingCycleLabel.toLowerCase().includes('annual')
                    ? 'Year 1 (annual)'
                    : 'Billing'}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 17, fontWeight: 700 }}>
                  {tierProfile.subscriptionPrice}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,.5)',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  Next Invoice
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 17, fontWeight: 700, color: '#7EC8FF' }}>
                  —
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="ch">
              <div className="ct">Invoice History</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>NGN</th>
                  <th>USD Eq.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)' }}>
                      No invoices yet.
                    </td>
                  </tr>
                ) : (
                  apiTransactions.map((t) => {
                    const amtNum = parseFloat(String(t.amount).replace(/[^0-9.-]/g, '')) || 0;
                    return (
                      <tr key={t.inv}>
                        <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{t.inv}</td>
                        <td style={{ fontSize: 12 }}>{t.date}</td>
                        <td style={{ fontSize: 12 }}>{t.type}</td>
                        <td style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                          {formatInvoiceAmount(amtNum)}
                        </td>
                        <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text3)' }}>
                          {formatUsd(amtNum)}
                        </td>
                        <td>
                          <Badge variant={invoiceStatusVariant(t.status || 'Pending')}>
                            {t.status || 'Pending'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setDetailInvoice(
                                transactionToInvoiceRow(t, client?.name, client?.code),
                              )
                            }
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })
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
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiTeam.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)' }}>
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
            <div className="ct">Registered SKUs & Batches</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {apiSkus.length} product{apiSkus.length === 1 ? '' : 's'} · {totalSkuBatches} total batches
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              className="inp"
              style={{ flex: 1, minWidth: 160 }}
              placeholder="Search by product name or SKU code..."
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
            />
            <select
              className="inp"
              style={{ width: 150 }}
              value={skuDoraFilter}
              onChange={(e) => setSkuDoraFilter(e.target.value)}
            >
              <option value="all">All DORA status</option>
              <option value="Active">DORA Active</option>
              <option value="Pending">DORA Pending</option>
            </select>
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
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {apiSkus.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)' }}>
                    No SKUs registered yet.
                  </td>
                </tr>
              ) : filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>
                    No SKUs match your search.
                  </td>
                </tr>
              ) : (
                filteredSkus.map((s) => (
                  <tr key={s.sku}>
                    <td>
                      <strong>{s.product}</strong>
                    </td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{s.sku}</td>
                    <td>{s.barcode}</td>
                    <td>{s.batches}</td>
                    <td style={{ color: s.dora === 'Pending' ? 'var(--at)' : 'var(--gt)', fontWeight: 600 }}>
                      {s.auth}
                    </td>
                    <td>
                      <Badge variant={s.dora === 'Active' ? 'bg' : 'ba'}>{s.dora}</Badge>
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => showToast(`Manage SKU: ${s.sku}`, 'success')}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      <InvoiceDetailModal
        invoice={detailInvoice}
        open={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
      />
    </>
  );
}
