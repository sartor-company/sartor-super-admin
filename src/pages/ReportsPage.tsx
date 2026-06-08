import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { platformApi } from '../api/platform';
import { DonutLegend, PageHeader, RangeFilterBar, ReportToolbar } from '../components/patterns';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import { TabBar } from '../components/ui/TabBar';
import type { Client } from '../data/clients';
import type { InvestigationRow } from '../data/investigations';
import { usePlatform } from '../context/PlatformContext';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { RevenueBarChart, RevenueDonutChart } from '../components/charts/AdminCharts';
import { useTabs } from '../hooks/useTabs';
import {
  crmSeatRate,
  formatDueLabel,
  formatInvoiceAmount,
  formatInvoiceDate,
  invoiceStatusVariant,
  parseSeatsFromDescription,
  type PlatformInvoiceRow,
} from '../utils/financeDisplay';
import { formatNaira } from '../utils/format';
import { crmPillLabel, crmPillVariant, scPillVariant } from '../utils/clientDisplay';
import {
  creditHealthColor,
  filterClientsByName,
  invoiceDaysOverdue,
  invoiceDaysUntilDue,
  investigationsForClient,
  openTicketsForClient,
  revenueByClient,
} from '../utils/reportsData';
import {
  donutFromBreakdown,
  revenueSeriesFromCharts,
  revenueSeriesFromInvoices,
} from '../utils/chartSeries';
import { exportReport } from './shared';

type ReportTab = 'revenue' | 'scans' | 'clients' | 'crm' | 'credits' | 'invoices';

export function ReportsPage() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { active, setActive } = useTabs<ReportTab>('revenue');
  const [clientFilter, setClientFilter] = useState('All Clients');
  const [range, setRange] = useState('7 days');

  const {
    clients,
    invoices,
    financeSummary,
    overview,
    investigations,
    tickets,
    loading,
    refresh,
    charts,
  } = usePlatform();

  const clientList = clients as Client[];
  const invoiceRows = invoices as unknown as PlatformInvoiceRow[];
  const investigationRows = investigations as InvestigationRow[];
  const ticketRows = tickets as Record<string, unknown>[];

  const filteredClients = useMemo(
    () => filterClientsByName(clientList, clientFilter),
    [clientList, clientFilter],
  );

  const summary = financeSummary as {
    paidTotal?: number;
    outstandingTotal?: number;
    overdueTotal?: number;
    crmSubscriptions?: number;
  } | null;

  const cards = (overview?.cards || {}) as Record<string, number | string>;
  const revenueRows = useMemo(() => revenueByClient(invoiceRows), [invoiceRows]);
  const filteredRevenue = useMemo(() => {
    if (clientFilter === 'All Clients') return revenueRows;
    return revenueRows.filter((r) => r.name === clientFilter || r.name.includes(clientFilter));
  }, [revenueRows, clientFilter]);

  const crmClients = useMemo(() => clientList.filter((c) => c.crm), [clientList]);
  const filteredCrm = useMemo(
    () => filterClientsByName(crmClients, clientFilter),
    [crmClients, clientFilter],
  );

  const filteredInvoices = useMemo(() => {
    let rows = [...invoiceRows].sort((a, b) => (b.dueAt || 0) - (a.dueAt || 0));
    if (clientFilter !== 'All Clients') {
      rows = rows.filter(
        (r) => r.clientName === clientFilter || (r.clientName && clientFilter.includes(r.clientName)),
      );
    }
    return rows;
  }, [invoiceRows, clientFilter]);

  const creditTotal = useMemo(
    () =>
      invoiceRows
        .filter((i) => i.status === 'Paid' && (i.description || '').toLowerCase().match(/sms|pin|credit/))
        .reduce((s, i) => s + i.amount, 0),
    [invoiceRows],
  );

  const crmRevenue = useMemo(
    () =>
      invoiceRows
        .filter((i) => i.status === 'Paid' && (i.description || '').toLowerCase().includes('crm'))
        .reduce((s, i) => s + i.amount, 0),
    [invoiceRows],
  );

  const markPaid = async (inv: PlatformInvoiceRow) => {
    try {
      await platformApi.updateInvoice(inv._id, { status: 'Paid' });
      await refresh();
      showToast(`Payment recorded for ${inv.invoiceId}.`, 'success');
    } catch {
      showToast('Could not update invoice.', 'error');
    }
  };

  const clientOptions = ['All Clients', ...clientList.map((c) => c.name)];

  const tabs = [
    { id: 'revenue' as const, label: 'Revenue' },
    { id: 'scans' as const, label: 'Scan Analytics' },
    { id: 'clients' as const, label: 'Client Performance' },
    { id: 'crm' as const, label: 'CRM Usage' },
    { id: 'credits' as const, label: 'Credit Usage' },
    { id: 'invoices' as const, label: 'Invoice Aging' },
  ];

  const reportSelectValue: Record<ReportTab, string> = {
    revenue: 'rpt-revenue',
    scans: 'rpt-scans',
    clients: 'rpt-clients',
    crm: 'rpt-crm',
    credits: 'rpt-credits',
    invoices: 'rpt-invoices',
  };

  const rptPanelIds: Record<ReportTab, string> = { ...reportSelectValue };

  const panel = (id: ReportTab, children: ReactNode) => (
    <div
      id={rptPanelIds[id]}
      data-g="rpt-tabs"
      style={(active === id ? {} : { display: 'none' }) as CSSProperties}
    >
      {children}
    </div>
  );

  const paidTotal = summary?.paidTotal ?? 0;

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
        title="Reports & Analytics"
        subtitle={loading ? 'Loading platform data…' : 'Platform-wide reporting · Live data'}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Report', 'csv')}>
              ↓ Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => openModal('invoice')}>
              + Create Invoice
            </Button>
          </div>
        }
      />

      <ReportToolbar
        reportValue={reportSelectValue[active]}
        onReportChange={(v) => {
          const map: Record<string, ReportTab> = {
            'rpt-revenue': 'revenue',
            'rpt-scans': 'scans',
            'rpt-clients': 'clients',
            'rpt-crm': 'crm',
            'rpt-credits': 'credits',
            'rpt-invoices': 'invoices',
          };
          setActive(map[v] ?? 'revenue');
        }}
        clientValue={clientFilter}
        onClientChange={setClientFilter}
        reportOptions={[
          { value: 'rpt-revenue', label: 'Revenue Summary' },
          { value: 'rpt-scans', label: 'Scan Analytics' },
          { value: 'rpt-clients', label: 'Client Performance' },
          { value: 'rpt-crm', label: 'CRM Usage' },
          { value: 'rpt-credits', label: 'Credit Usage' },
          { value: 'rpt-invoices', label: 'Invoice Aging' },
        ]}
        clientOptions={clientOptions}
      />

      <TabBar tabs={tabs} active={active} onChange={setActive} />

      {panel(
        'revenue',
        <>
          <RangeFilterBar
            value={range}
            onChange={setRange}
            onExport={() => exportReport(showToast, 'Revenue Summary', 'csv')}
          />
          <KCardGrid columns={4}>
            <KCard
              label="Total Revenue (Paid)"
              value={formatNaira(paidTotal)}
              trend={`${filteredRevenue.length} clients`}
              trendType="up"
              accent
            />
            <KCard
              label="Credit Bundle Revenue"
              value={formatNaira(creditTotal)}
              trend="From paid invoices"
              trendType="up"
            />
            <KCard
              label="CRM Subscription Revenue"
              value={formatNaira(crmRevenue)}
              trend={`${summary?.crmSubscriptions ?? 0} active`}
              trendType="up"
            />
            <KCard
              label="Outstanding"
              value={formatNaira(summary?.outstandingTotal ?? 0)}
              trend={formatNaira(summary?.overdueTotal ?? 0) + ' overdue'}
              trendType="dn"
            />
          </KCardGrid>
          <div className="r3" style={{ marginBottom: 14 }}>
            <Card style={{ marginBottom: 0 }}>
              <div className="ch">
                <div className="ct">Monthly revenue</div>
              </div>
              {active === 'revenue' && (
                <RevenueBarChart
                  height={200}
                  labels={revenueSeries.labels}
                  values={revenueSeries.values}
                  colors={revenueSeries.colors}
                />
              )}
            </Card>
            <Card style={{ marginBottom: 0 }}>
              <div className="ch">
                <div className="ct">Revenue by type</div>
              </div>
              {active === 'revenue' && (
                <RevenueDonutChart
                  height={155}
                  labels={donutSeries.labels}
                  values={donutSeries.values}
                />
              )}
              <DonutLegend items={donutSeries.legend} />
            </Card>
          </div>
          <Card>
            <div className="ch">
              <div className="ct">Revenue by client (paid invoices)</div>
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Revenue by Client', 'csv')}>
                ↓ CSV
              </Button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Credit Bundles</th>
                  <th>CRM Subs</th>
                  <th>Other</th>
                  <th>Total</th>
                  <th>% Share</th>
                </tr>
              </thead>
              <tbody>
                {filteredRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--text3)', textAlign: 'center' }}>
                      No paid invoice data yet.
                    </td>
                  </tr>
                ) : (
                  filteredRevenue.map((r) => (
                    <tr key={r.code || r.name}>
                      <td>
                        <strong>{r.name}</strong>
                      </td>
                      <td>{formatNaira(r.credits)}</td>
                      <td>{formatNaira(r.crm)}</td>
                      <td>{formatNaira(r.other)}</td>
                      <td style={{ fontWeight: 600 }}>{formatNaira(r.total)}</td>
                      <td>
                        <Badge variant="bg">{r.share.toFixed(1)}%</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>,
      )}

      {panel(
        'scans',
        <>
          <RangeFilterBar value={range} onChange={setRange} onExport={() => exportReport(showToast, 'Scan Analytics', 'csv')} />
          <KCardGrid columns={4}>
            <KCard
              label="Total Scans (30d)"
              value={String(cards.totalScans30d ?? '—')}
              trend="Platform-wide"
              trendType="up"
              accent
            />
            <KCard label="Platform Auth Rate" value={String(cards.platformAuthRate ?? '—')} trend="Live" trendType="up" />
            <KCard label="Active Clients" value={String(cards.activeClients ?? clientList.length)} trend="Live" trendType="neu" />
            <KCard label="Open Investigations" value={String(cards.openInvestigations ?? 0)} trend="Open" trendType="dn" />
          </KCardGrid>
          <Card>
            <div className="ch">
              <div className="ct">Client auth rates & catalogue size</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>SKUs</th>
                  <th>Batches</th>
                  <th>Auth Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.skus}</td>
                    <td>{c.batches}</td>
                    <td style={{ color: c.authRate === '—' ? 'var(--text3)' : 'var(--gt)', fontWeight: 600 }}>
                      {c.authRate}
                    </td>
                    <td>
                      <Badge variant={c.status === 'Attention' ? 'ba' : c.status === 'Onboarding' ? 'bb' : 'bg'}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>,
      )}

      {panel(
        'clients',
        <>
          <RangeFilterBar value={range} onChange={setRange} onExport={() => exportReport(showToast, 'Client Scorecard', 'csv')} />
          <Card>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Products</th>
                  <th>Auth Rate</th>
                  <th>Credit Health</th>
                  <th>Open Tickets</th>
                  <th>Investigations</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      <ProductPill variant={scPillVariant(c.scband)}>SC·{c.scband}</ProductPill>
                      {crmPillVariant(c.crm) && crmPillLabel(c.crm) && (
                        <ProductPill variant={crmPillVariant(c.crm)!}>{crmPillLabel(c.crm)}</ProductPill>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.authRate}</td>
                    <td>
                      <Badge variant={c.creditHealth.variant}>{c.creditHealth.label}</Badge>
                    </td>
                    <td>{openTicketsForClient(ticketRows, c)}</td>
                    <td>{investigationsForClient(investigationRows, c)}</td>
                    <td>
                      <Badge variant={c.status === 'Attention' ? 'ba' : c.status === 'Onboarding' ? 'bb' : 'bg'}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>,
      )}

      {panel(
        'crm',
        <>
          <RangeFilterBar value={range} onChange={setRange} onExport={() => exportReport(showToast, 'CRM Usage Report', 'csv')} />
          <KCardGrid columns={4}>
            <KCard
              label="CRM Clients"
              value={String(filteredCrm.length)}
              trend="Active subscriptions"
              trendType="neu"
              accent
            />
            <KCard label="CRM Revenue (Paid)" value={formatNaira(crmRevenue)} trend="From invoices" trendType="up" />
            <KCard
              label="360 Tier Clients"
              value={String(filteredCrm.filter((c) => (c.crm || '').includes('360')).length)}
              trend="CRM 360"
              trendType="neu"
            />
            <KCard
              label="Nav+ / Nav Clients"
              value={String(filteredCrm.filter((c) => c.crm && !c.crm.includes('360')).length)}
              trend="Sales Navigator"
              trendType="neu"
            />
          </KCardGrid>
          <Card>
            <div className="ch">
              <div className="ct">CRM subscription by client</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>CRM Tier</th>
                  <th>Rate (per seat/month)</th>
                  <th>Est. Monthly</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCrm.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ color: 'var(--text3)', textAlign: 'center' }}>
                      No CRM subscriptions yet.
                    </td>
                  </tr>
                ) : (
                  filteredCrm.map((c) => {
                    const rate = crmSeatRate(c.crm);
                    const seats = parseSeatsFromDescription(c.products) ?? 10;
                    return (
                      <tr key={c.code}>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>
                          {crmPillVariant(c.crm) && crmPillLabel(c.crm) && (
                            <ProductPill variant={crmPillVariant(c.crm)!}>{crmPillLabel(c.crm)}</ProductPill>
                          )}
                        </td>
                        <td>{formatNaira(rate)}/seat/month</td>
                        <td style={{ fontWeight: 600 }}>{formatNaira(rate * seats)}</td>
                        <td>
                          <Badge variant="bg">Active</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </>,
      )}

      {panel(
        'credits',
        <>
          <RangeFilterBar value={range} onChange={setRange} onExport={() => exportReport(showToast, 'Credit Usage', 'csv')} />
          <Card>
            <div className="ch">
              <div className="ct">Credit balances by client</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>PIN Credits</th>
                  <th>SMS Credits</th>
                  <th>Credit Health</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td style={{ color: creditHealthColor(c.creditHealth.label) }}>{c.pinCredits ?? '—'}</td>
                    <td style={{ color: creditHealthColor(c.creditHealth.label) }}>{c.smsCredits ?? '—'}</td>
                    <td>
                      <Badge variant={c.creditHealth.variant}>{c.creditHealth.label}</Badge>
                    </td>
                    <td>
                      {(c.creditHealth.label.includes('Critical') || c.creditHealth.label.includes('Low')) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            followUp(c.name, `${c.creditHealth.label} — please review credits.`, c._id)
                          }
                        >
                          Follow Up
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>,
      )}

      {panel(
        'invoices',
        <>
          <div className="rpt-filter">
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Period:</span>
            {['30 days', '90 days', 'YTD'].map((r, i) => (
              <button key={r} type="button" className={`rng-btn ${i === 0 ? 'on' : ''}`} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => exportReport(showToast, 'Invoice Aging Report', 'csv')}
            >
              ↓ Aging CSV
            </Button>
          </div>
          <Card>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Aging</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ color: 'var(--text3)', textAlign: 'center' }}>
                      No invoices match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((row) => {
                    const overdue = invoiceDaysOverdue(row.dueAt, row.status);
                    const untilDue = invoiceDaysUntilDue(row.dueAt, row.status);
                    const adminId = typeof row.admin === 'string' ? row.admin : undefined;
                    return (
                      <tr key={row._id}>
                        <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{row.invoiceId}</td>
                        <td>{row.clientName || row.clientCode || '—'}</td>
                        <td>{row.description || '—'}</td>
                        <td>{formatInvoiceAmount(row.amount)}</td>
                        <td>{formatInvoiceDate(row.issuedAt)}</td>
                        <td>{formatDueLabel(row.dueAt, row.status)}</td>
                        <td style={{ color: overdue ? 'var(--rt)' : untilDue !== null && untilDue <= 7 ? 'var(--at)' : undefined }}>
                          {row.status === 'Paid'
                            ? 'Paid'
                            : overdue
                              ? `${overdue} days overdue`
                              : untilDue !== null
                                ? `${untilDue} days left`
                                : '—'}
                        </td>
                        <td>
                          <Badge variant={invoiceStatusVariant(row.status)}>{row.status}</Badge>
                        </td>
                        <td>
                          {row.status === 'Overdue' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                followUp(
                                  row.clientName || 'Client',
                                  `${row.invoiceId} (${formatInvoiceAmount(row.amount)}) is overdue.`,
                                  adminId,
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
                                  adminId,
                                )
                              }
                            >
                              Remind
                            </Button>
                          )}
                          {row.status === 'Pending' && (
                            <Button variant="success" size="sm" onClick={() => markPaid(row)}>
                              Mark Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </>,
      )}
    </>
  );
}
