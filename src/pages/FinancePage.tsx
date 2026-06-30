import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { platformApi } from '../api/platform';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import { TabBar } from '../components/ui/TabBar';
import { DonutLegend, InfoBanner, PageHeader } from '../components/patterns';
import { Card, CardHeader } from '../components/ui/Card';
import type { Client } from '../data/clients';
import { usePlatform } from '../context/PlatformContext';
import { useFollowUp } from '../hooks/useFollowUp';
import { useRoleGates } from '../hooks/useRoleGates';
import { RevenueBarChart, RevenueDonutChart } from '../components/charts/AdminCharts';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { useTabs } from '../hooks/useTabs';
import {
  crmSeatRate,
  formatDueLabel,
  formatInvoiceAmount,
  formatInvoiceDate,
  formatUsd,
  invoiceStatusVariant,
  isCreditSaleInvoice,
  parseSeatsFromDescription,
  revenueBadgeVariant,
  type PlatformInvoiceRow,
} from '../utils/financeDisplay';
import { formatNaira } from '../utils/format';
import { crmPillLabel, crmPillVariant } from '../utils/clientDisplay';
import {
  donutFromBreakdown,
  revenueSeriesFromCharts,
  revenueSeriesFromInvoices,
} from '../utils/chartSeries';
import { exportReport } from './shared';
import { InvoiceDetailModal } from '../modals/InvoiceDetailModal';

type FinTab = 'dash' | 'invoices' | 'crm' | 'credits' | 'scdora';

const FIN_TAB_IDS: FinTab[] = ['dash', 'invoices', 'crm', 'credits', 'scdora'];

const REVENUE_TYPE_OPTIONS = [
  'All revenue types',
  'Credit Bundles',
  'CRM Subscriptions',
  'SKU Licences',
  'SC-DORA Deployment',
  'Domains',
  'Multiple',
] as const;

const finPanelStyle = (visible: boolean): CSSProperties =>
  visible ? {} : { display: 'none' };

export function FinancePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { can } = useRoleGates();
  const { clients, invoices, financeSummary, charts, loading, refresh } = usePlatform();

  const urlTab = searchParams.get('finTab') as FinTab | null;
  const { active, setActive, isActive } = useTabs<FinTab>(
    urlTab && FIN_TAB_IDS.includes(urlTab) ? urlTab : 'dash',
  );

  const [invQuery, setInvQuery] = useState('');
  const [invStatus, setInvStatus] = useState('');
  const [invType, setInvType] = useState('All revenue types');
  const [detailInvoice, setDetailInvoice] = useState<PlatformInvoiceRow | null>(null);
  const [crmClientId, setCrmClientId] = useState('');
  const [crmTierRate, setCrmTierRate] = useState('');
  const [crmSeats, setCrmSeats] = useState('');
  const [crmCycle, setCrmCycle] = useState('monthly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (urlTab && FIN_TAB_IDS.includes(urlTab) && urlTab !== active) {
      setActive(urlTab);
    }
  }, [urlTab, active, setActive]);

  const setFinTab = (tab: FinTab) => {
    setActive(tab);
    setSearchParams({ finTab: tab }, { replace: true });
  };

  const invoiceRows = invoices as unknown as PlatformInvoiceRow[];
  const summary = financeSummary as {
    paidTotal?: number;
    paidCount?: number;
    arr?: number;
    mrr?: number;
    crmMrr?: number;
    crmArr?: number;
    skuArr?: number;
    outstandingTotal?: number;
    overdueTotal?: number;
    pendingInvoices?: number;
    overdueInvoices?: number;
    crmSubscriptions?: number;
    deferredRevenue?: number;
    creditLiability?: number;
    creditRevenueYtd?: number;
    recurringYtd?: number;
    oneTimeYtd?: number;
    deploymentMix?: {
      fullPaid?: number;
      pilotPaid?: number;
      convertPaid?: number;
      pilotCount?: number;
      fullCount?: number;
      convertCount?: number;
      pilotConvertRate?: number;
    };
    invoiceCounts?: { total?: number; paid?: number; pending?: number; overdue?: number };
    crmSubscriptionRows?: {
      clientName: string;
      tier: string;
      seats: number;
      opSeats: number;
      mrr: number;
      arr: number;
      billingCycle: string;
      status: string;
    }[];
    scDoraEngagements?: {
      clientName: string;
      stage: string;
      deploymentRevenue: number;
      deploymentPaid: boolean;
      skuLicenceArr: number;
      status: string;
      accountActivated: boolean;
    }[];
  } | null;

  const filteredInvoices = useMemo(
    () =>
      invoiceRows.filter((row) => {
        const q = invQuery.toLowerCase();
        const okQ =
          !q ||
          `${row.invoiceId} ${row.clientName} ${row.clientCode} ${row.description}`
            .toLowerCase()
            .includes(q);
        const okSt = !invStatus || row.status === invStatus;
        const okType =
          invType === 'All revenue types' ||
          (invType === 'Credit Bundles' && row.revenueType === 'credits') ||
          (invType === 'CRM Subscriptions' && row.revenueType === 'crm') ||
          (invType === 'SKU Licences' && row.revenueType === 'sku') ||
          (invType === 'SC-DORA Deployment' &&
            ['scdora-full', 'scdora-pilot', 'scdora-convert'].includes(row.revenueType || '')) ||
          (invType === 'Domains' && row.revenueType === 'domains') ||
          (invType === 'Multiple' && row.revenueType === 'multiple');
        return okQ && okSt && okType;
      }),
    [invoiceRows, invQuery, invStatus, invType],
  );

  const crmClients = useMemo(
    () => (clients as Client[]).filter((c) => c.crm),
    [clients],
  );

  const creditSales = useMemo(
    () => invoiceRows.filter((inv) => isCreditSaleInvoice(inv.description)),
    [invoiceRows],
  );

  const crmPreview = useMemo(() => {
    const rate = Number(crmTierRate);
    const seats = Number(crmSeats);
    if (!rate || !seats) return '';
    const monthly = rate * seats;
    const yearlyList = monthly * 12;
    const total = crmCycle === 'annual' ? Math.round(yearlyList * 0.8) : monthly;
    return crmCycle === 'annual'
      ? `Annual: ${formatNaira(yearlyList)} list − 20% (${formatNaira(yearlyList - total)}) = ${formatNaira(total)}`
      : `Monthly: ${seats} × ${formatNaira(rate)} = ${formatNaira(monthly)}/month`;
  }, [crmTierRate, crmSeats, crmCycle]);

  const markPaid = async (inv: PlatformInvoiceRow) => {
    try {
      await platformApi.updateInvoice(inv._id, { status: 'Paid' });
      await refresh();
      showToast(`Payment recorded for ${inv.invoiceId}.`, 'success');
    } catch {
      showToast('Could not update invoice.', 'error');
    }
  };

  const saveCrmSubscription = async (createInvoice: boolean) => {
    const client = (clients as Client[]).find((c) => c._id === crmClientId);
    if (!client?._id) {
      showToast('Select a client.', 'error');
      return;
    }
    const tierMap: Record<string, string> = {
      '5000': 'Sales Navigator',
      '12000': 'Sales Navigator Plus',
      '25000': 'CRM 360',
    };
    const tier = tierMap[crmTierRate] || 'CRM';
    const seats = Number(crmSeats) || 0;
    setSaving(true);
    try {
      await platformApi.patchClient(client._id, {
        crmEnabled: true,
        crmTier: tier,
      });
      if (createInvoice && seats > 0) {
        const rate = Number(crmTierRate);
        const amount =
          crmCycle === 'annual' ? Math.round(rate * seats * 12 * 0.8) : rate * seats;
        await platformApi.createInvoice({
          adminId: client._id,
          clientName: client.name,
          clientCode: client.code,
          description: `CRM subscription — ${tier} (${seats} seats)`,
          amount,
        });
      }
      await refresh();
      showToast(
        createInvoice ? 'Subscription saved. Invoice created.' : 'Subscription saved.',
        'success',
      );
      if (createInvoice) openModal('invoice');
    } catch {
      showToast('Could not save subscription.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'dash' as const, label: 'Dashboard' },
    { id: 'invoices' as const, label: 'Invoices' },
    { id: 'crm' as const, label: 'CRM Subscriptions' },
    { id: 'credits' as const, label: 'SC Credit Sales' },
    { id: 'scdora' as const, label: 'SC-DORA Engagements' },
  ];

  const paidTotal = summary?.paidTotal ?? 0;
  const outstanding = summary?.outstandingTotal ?? 0;
  const mix = summary?.deploymentMix;
  const crmRows = summary?.crmSubscriptionRows ?? [];
  const scDoraRows = summary?.scDoraEngagements ?? [];
  const recurringTotal = (summary?.recurringYtd ?? 0) + (summary?.oneTimeYtd ?? 0);
  const recurringPct = recurringTotal
    ? Math.round(((summary?.recurringYtd ?? 0) / recurringTotal) * 1000) / 10
    : 0;

  const revenueSeries = useMemo(() => {
    const fromApi = revenueSeriesFromCharts(charts);
    if (fromApi) return fromApi;
    return revenueSeriesFromInvoices(invoiceRows);
  }, [charts, invoiceRows]);

  const donutSeries = useMemo(
    () => donutFromBreakdown(charts?.revenueBreakdown),
    [charts],
  );

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle="Collections, recurring revenue, invoices & credit economics · FY2026"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button className="bacc" size="sm" onClick={() => navigate('/reports')}>
              📄 Full Reports
            </Button>
            {can('invoice') && (
              <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
                + Create Invoice
              </Button>
            )}
          </div>
        }
      />

      <TabBar tabs={tabs} active={active} onChange={setFinTab} />

      {loading && !summary && invoiceRows.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Loading finance data…</p>
      )}

      <div id="fin-dash" data-g="fin-tabs" style={finPanelStyle(isActive('dash'))}>
        <KCardGrid columns={4}>
          <KCard
            label="Total Collected (YTD)"
            value={formatNaira(paidTotal)}
            trend={`${summary?.paidCount ?? invoiceRows.filter((i) => i.status === 'Paid').length} paid invoices`}
            trendType="up"
            accent
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="ARR (recurring)"
            value={formatNaira(summary?.arr ?? 0)}
            trend="CRM + SKU licences"
            trendType="up"
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="MRR"
            value={formatNaira(summary?.mrr ?? summary?.crmMrr ?? 0)}
            trend={`${summary?.crmSubscriptions ?? crmClients.length} active subscriptions`}
            trendType="up"
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="Outstanding"
            value={formatNaira(outstanding)}
            trend={`${summary?.pendingInvoices ?? 0} invoices`}
            trendType="dn"
            valueStyle={{ fontSize: 20, color: 'var(--at)' }}
          />
        </KCardGrid>
        <KCardGrid columns={3}>
          <KCard
            label="Overdue"
            value={formatNaira(summary?.overdueTotal ?? 0)}
            trend={`${summary?.overdueInvoices ?? 0} invoices · chase`}
            trendType="dn"
            valueStyle={{ fontSize: 20, color: 'var(--rt)' }}
          />
          <KCard
            label="Deferred Revenue"
            value={formatNaira(summary?.deferredRevenue ?? 0)}
            trend="CRM annual prepay"
            trendType="neu"
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="Credit Liability"
            value={formatNaira(summary?.creditLiability ?? 0)}
            trend="Unredeemed balance"
            trendType="neu"
            valueStyle={{ fontSize: 20 }}
          />
        </KCardGrid>
        <div className="r3" style={{ marginBottom: 14 }}>
          <Card style={{ marginBottom: 0 }}>
            <CardHeader title="Revenue by month — 2026" />
            {isActive('dash') && (
              <RevenueBarChart
                height={190}
                labels={revenueSeries.labels}
                values={revenueSeries.values}
                colors={revenueSeries.colors}
              />
            )}
          </Card>
          <Card style={{ marginBottom: 0 }}>
            <CardHeader title="Revenue breakdown" />
            {isActive('dash') && (
              <RevenueDonutChart
                height={145}
                labels={donutSeries.labels}
                values={donutSeries.values}
              />
            )}
            <DonutLegend items={donutSeries.legend} marginTop={7} />
          </Card>
        </div>
        <Card style={{ marginBottom: 14 }}>
          <CardHeader title="SC-DORA deployment mix & pilot funnel" />
          <KCardGrid columns={4}>
            <KCard
              label="Full Deployment"
              value={formatNaira(mix?.fullPaid ?? 0)}
              trend={`${mix?.fullCount ?? 0} clients`}
              trendType="up"
              valueStyle={{ fontSize: 18 }}
            />
            <KCard
              label="Pilot Deployment"
              value={formatNaira(mix?.pilotPaid ?? 0)}
              trend={`${mix?.pilotCount ?? 0} active pilots`}
              trendType="neu"
              valueStyle={{ fontSize: 18, color: 'var(--at)' }}
            />
            <KCard
              label="Pilot → Full Convert"
              value={formatNaira(mix?.convertPaid ?? 0)}
              trend={`${mix?.convertCount ?? 0} conversions`}
              trendType="up"
              valueStyle={{ fontSize: 18, color: 'var(--gold)' }}
            />
            <KCard
              label="Pilot → Full Rate"
              value={`${mix?.pilotConvertRate ?? 0}%`}
              trend="Conversion rate"
              trendType="up"
              accent
              valueStyle={{ fontSize: 18 }}
            />
          </KCardGrid>
        </Card>
        <Card style={{ marginBottom: 14 }}>
          <CardHeader title="Recurring vs one-time — collected YTD" />
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text2)' }}>Recurring (CRM subscriptions)</span>
                <strong>
                  {formatNaira(summary?.recurringYtd ?? 0)} · {recurringPct}%
                </strong>
              </div>
              <div style={{ height: 9, background: 'var(--bg2)', borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: `${recurringPct}%`, height: '100%', background: 'var(--navy)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text2)' }}>One-time (deployment, setup, credits)</span>
                <strong>
                  {formatNaira(summary?.oneTimeYtd ?? 0)} · {100 - recurringPct}%
                </strong>
              </div>
              <div style={{ height: 9, background: 'var(--bg2)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${100 - recurringPct}%`, height: '100%', background: 'var(--accent)' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div id="fin-invoices" data-g="fin-tabs" style={finPanelStyle(isActive('invoices'))}>
        <div className="ch" style={{ marginBottom: 12 }}>
          <div className="ct">All invoices</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="inp"
              style={{ width: 220, fontSize: 12 }}
              placeholder="Search invoice or client..."
              value={invQuery}
              onChange={(e) => setInvQuery(e.target.value)}
            />
            <select className="inp" style={{ width: 140, fontSize: 12 }} value={invStatus} onChange={(e) => setInvStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
            <select className="inp" style={{ width: 160, fontSize: 12 }} value={invType} onChange={(e) => setInvType(e.target.value)}>
              {REVENUE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="inp"
              style={{ maxWidth: 140, fontSize: 12 }}
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = '';
                if (v === 'csv') {
                  exportReport(showToast, 'Invoices', {
                    headers: ['Invoice', 'Client', 'Description', 'Amount', 'Status'],
                    rows: filteredInvoices.map((r) => [
                      r.invoiceId,
                      r.clientName || '',
                      r.description || '',
                      String(r.amount),
                      r.status || '',
                    ]),
                  });
                }
              }}
            >
              <option value="">↓ Export…</option>
              <option value="csv">CSV (.csv)</option>
            </select>
            {can('invoice') && (
              <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
                + Create Invoice
              </Button>
            )}
          </div>
        </div>
        <Card>
          {filteredInvoices.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No invoices found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Revenue Type</th>
                  <th>NGN</th>
                  <th>USD Eq.</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((row) => (
                  <tr key={row._id}>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{row.invoiceId}</td>
                    <td>{row.clientName || row.clientCode || '—'}</td>
                    <td>
                      <Badge variant={revenueBadgeVariant(row.revenueVariant)}>{row.revenueLabel || '—'}</Badge>
                      {(row.lineCount ?? 0) > 1 && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {row.lineCount} lines
                        </div>
                      )}
                    </td>
                    <td>{formatInvoiceAmount(row.amount)}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 11 }}>
                      {formatUsd(row.amount, row.usdEquivalent)}
                    </td>
                    <td style={{ color: row.status === 'Overdue' ? 'var(--rt)' : undefined }}>
                      {formatDueLabel(row.dueAt, row.status)}
                    </td>
                    <td>
                      <Badge variant={invoiceStatusVariant(row.status)}>{row.status}</Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Button variant="secondary" size="sm" onClick={() => setDetailInvoice(row)}>
                          View
                        </Button>
                        {row.status === 'Overdue' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            followUp(
                              row.clientName || 'Client',
                              `${row.invoiceId} (${formatInvoiceAmount(row.amount)}) is overdue.`,
                              typeof row.admin === 'string' ? row.admin : undefined,
                            )
                          }
                        >
                          Chase
                        </Button>
                      )}
                      {row.status === 'Due Soon' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            followUp(
                              row.clientName || 'Client',
                              `${row.invoiceId} (${formatInvoiceAmount(row.amount)}) due soon.`,
                              typeof row.admin === 'string' ? row.admin : undefined,
                            )
                          }
                        >
                          Remind
                        </Button>
                      )}
                      {row.status === 'Pending' && can('invoice') && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button variant="success" size="sm" onClick={() => markPaid(row)}>
                            Mark Paid
                          </Button>
                        </div>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div id="fin-crm" data-g="fin-tabs" style={finPanelStyle(isActive('crm'))}>
        <KCardGrid columns={3}>
          <KCard
            label="CRM MRR"
            value={formatNaira(summary?.crmMrr ?? 0)}
            trend={`${crmRows.length || crmClients.length} active subscriptions`}
            trendType="up"
            accent
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="CRM ARR"
            value={formatNaira(summary?.crmArr ?? 0)}
            trend="Annualised recurring"
            trendType="up"
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="Avg Revenue / Sub"
            value={
              crmRows.length
                ? `${formatNaira(Math.round((summary?.crmMrr ?? 0) / crmRows.length))}/mo`
                : '—'
            }
            trend="Across active CRM clients"
            trendType="neu"
            valueStyle={{ fontSize: 20 }}
          />
        </KCardGrid>
        <InfoBanner>
          ℹ MRR/ARR are recognised on active-contract basis. Deployment fees and credit bundles are one-time — see Dashboard for collected cash.
        </InfoBanner>
        <Card>
          <CardHeader title="Active CRM subscriptions" />
          {crmRows.length === 0 && crmClients.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No active CRM subscriptions.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Tier</th>
                  <th>Seats</th>
                  <th>MRR</th>
                  <th>ARR</th>
                  <th>Billing</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(crmRows.length
                  ? crmRows.map((r) => (
                      <tr key={r.clientName}>
                        <td>
                          <strong>{r.clientName}</strong>
                        </td>
                        <td>{r.tier}</td>
                        <td>
                          {r.seats}
                          {r.opSeats ? ` + ${r.opSeats} op` : ''}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatNaira(r.mrr)}</td>
                        <td>{formatNaira(r.arr)}</td>
                        <td>{r.billingCycle}</td>
                        <td>
                          <Badge variant={r.status === 'Attention' ? 'ba' : 'bg'}>{r.status}</Badge>
                        </td>
                      </tr>
                    ))
                  : crmClients.map((c) => {
                      const rate = crmSeatRate(c.crm);
                      const seats = c.crmSeats ?? '—';
                      const seatNum = typeof seats === 'number' ? seats : 0;
                      const mrr = seatNum ? rate * seatNum : 0;
                      return (
                        <tr key={c.code}>
                          <td>
                            <strong>{c.name}</strong>
                          </td>
                          <td>{crmPillLabel(c.crm)}</td>
                          <td>{seats}</td>
                          <td style={{ fontWeight: 600 }}>{mrr ? formatNaira(mrr) : '—'}</td>
                          <td>{mrr ? formatNaira(mrr * 12) : '—'}</td>
                          <td>Monthly</td>
                          <td>
                            <Badge variant={c.status === 'Attention' ? 'ba' : 'bg'}>{c.status}</Badge>
                          </td>
                        </tr>
                      );
                    }))}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <CardHeader title="Add or update CRM subscription" />
          <div className="fr2">
            <FormGroup label="Client *">
              <select
                className="inp"
                value={crmClientId}
                onChange={(e) => setCrmClientId(e.target.value)}
              >
                <option value="">Select client...</option>
                {(clients as Client[]).map((c) => (
                  <option key={c._id || c.code} value={c._id || ''}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormGroup>
            <FormGroup label="CRM Tier *">
              <select
                className="inp"
                value={crmTierRate}
                onChange={(e) => setCrmTierRate(e.target.value)}
              >
                <option value="">Select tier...</option>
                <option value="5000">Sales Navigator — ₦5,000/seat/month</option>
                <option value="12000">Sales Navigator Plus — ₦12,000/seat/month</option>
                <option value="25000">CRM 360 — ₦25,000/seat/month</option>
              </select>
            </FormGroup>
          </div>
          <div className="fr2">
            <FormGroup label="Number of Seats *">
              <input
                type="number"
                className="inp"
                placeholder="e.g. 10"
                min={1}
                value={crmSeats}
                onChange={(e) => setCrmSeats(e.target.value)}
              />
            </FormGroup>
            <FormGroup label="Billing Cycle">
              <select className="inp" value={crmCycle} onChange={(e) => setCrmCycle(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (20% discount)</option>
              </select>
            </FormGroup>
          </div>
          {crmPreview && (
            <div style={{ padding: '10px 13px', background: 'var(--gb)', borderRadius: 7, fontSize: 13, color: 'var(--gt)', marginBottom: 13 }}>
              {crmPreview}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {can('invoice') && (
              <Button className="bacc" size="sm" disabled={saving} onClick={() => saveCrmSubscription(true)}>
                Save Subscription & Create Invoice
              </Button>
            )}
            <Button className="bsec" size="sm" disabled={saving} onClick={() => saveCrmSubscription(false)}>
              Save Without Invoice
            </Button>
          </div>
        </Card>
      </div>

      <div id="fin-credits" data-g="fin-tabs" style={finPanelStyle(isActive('credits'))}>
        <KCardGrid columns={4}>
          <KCard
            label="Credit Revenue (YTD, paid)"
            value={formatNaira(summary?.creditRevenueYtd ?? 0)}
            trend={`${creditSales.filter((i) => i.status === 'Paid').length} bundles sold`}
            trendType="up"
            accent
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="Credit Liability"
            value={formatNaira(summary?.creditLiability ?? 0)}
            trend="Unredeemed balance"
            trendType="neu"
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="Breakage (YTD)"
            value={formatNaira(0)}
            trend="Credits protected on lapse"
            trendType="up"
            valueStyle={{ fontSize: 20, color: 'var(--gt)' }}
          />
          <KCard
            label="Open credit invoices"
            value={String(creditSales.filter((i) => i.status !== 'Paid').length)}
            trend="Pending / overdue"
            trendType="dn"
            valueStyle={{ fontSize: 20 }}
          />
        </KCardGrid>
        <Card>
          <CardHeader title="SartorChain credit bundle sales" />
          {creditSales.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No credit sales invoices yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Product</th>
                  <th>Description</th>
                  <th>Revenue</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {creditSales.map((inv) => (
                  <tr key={inv._id}>
                    <td>{inv.clientName || inv.clientCode}</td>
                    <td>
                      <ProductPill variant="growth">SC</ProductPill>
                    </td>
                    <td>{inv.description}</td>
                    <td>{formatInvoiceAmount(inv.amount)}</td>
                    <td>{formatInvoiceDate(inv.issuedAt)}</td>
                    <td>
                      <Badge variant={invoiceStatusVariant(inv.status)}>{inv.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <CardHeader title="Add credits via invoice" />
          <InfoBanner>
            Create an invoice with SMS, PIN, batch, or calibration in the description — credits are applied automatically on Paystack payment when configured.
          </InfoBanner>
          {can('invoice') && (
            <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
              Create credit sale invoice
            </Button>
          )}
        </Card>
      </div>

      <div id="fin-scdora" data-g="fin-tabs" style={finPanelStyle(isActive('scdora'))}>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>
          SC-DORA combines deployment fees, SKU annual licences (Year 2+), and consumable credit bundles. This view
          tracks engagement stage and recurring SKU-licence ARR.
        </p>
        <KCardGrid columns={4}>
          <KCard
            label="Active Full Deployments"
            value={String(mix?.fullCount ?? 0)}
            trend="Committed clients"
            trendType="up"
            accent
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="Active Pilots"
            value={String(mix?.pilotCount ?? 0)}
            trend="90-day trials"
            trendType="neu"
            valueStyle={{ fontSize: 20, color: 'var(--at)' }}
          />
          <KCard
            label="Pilot → Full Rate"
            value={`${mix?.pilotConvertRate ?? 0}%`}
            trend={`${mix?.convertCount ?? 0} conversions`}
            trendType="up"
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="SKU Licence ARR"
            value={formatNaira(summary?.skuArr ?? 0)}
            trend="Recurring (Yr 2+)"
            trendType="up"
            valueStyle={{ fontSize: 20 }}
          />
        </KCardGrid>
        <Card>
          <CardHeader title="SC-DORA engagements by client" />
          {scDoraRows.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No SC-DORA engagements yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Stage</th>
                  <th>Deployment Revenue</th>
                  <th>SKU Licence ARR</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scDoraRows.map((row) => (
                  <tr key={row.clientName}>
                    <td>
                      <strong>{row.clientName}</strong>
                    </td>
                    <td>{row.stage}</td>
                    <td>
                      {row.deploymentRevenue ? (
                        <>
                          {formatNaira(row.deploymentRevenue)}{' '}
                          <span style={{ color: row.deploymentPaid ? 'var(--gt)' : 'var(--at)', fontSize: 11 }}>
                            {row.deploymentPaid ? 'paid' : 'pending'}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{row.skuLicenceArr ? formatNaira(row.skuLicenceArr) : '—'}</td>
                    <td>
                      <Badge variant={row.status === 'Attention' ? 'ba' : row.accountActivated ? 'bg' : 'bx'}>
                        {row.accountActivated ? row.status : 'Onboarding'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <InvoiceDetailModal
        invoice={detailInvoice}
        open={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
      />
    </>
  );
}
