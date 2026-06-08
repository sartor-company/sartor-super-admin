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
import { RevenueBarChart, RevenueDonutChart } from '../components/charts/AdminCharts';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { useTabs } from '../hooks/useTabs';
import {
  crmSeatRate,
  formatDueLabel,
  formatInvoiceAmount,
  formatInvoiceDate,
  invoiceStatusVariant,
  isCreditSaleInvoice,
  parseSeatsFromDescription,
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

type FinTab = 'dash' | 'invoices' | 'crm' | 'credits';

const FIN_TAB_IDS: FinTab[] = ['dash', 'invoices', 'crm', 'credits'];

const finPanelStyle = (visible: boolean): CSSProperties =>
  visible ? {} : { display: 'none' };

export function FinancePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { clients, invoices, financeSummary, charts, loading, refresh } = usePlatform();

  const urlTab = searchParams.get('finTab') as FinTab | null;
  const { active, setActive, isActive } = useTabs<FinTab>(
    urlTab && FIN_TAB_IDS.includes(urlTab) ? urlTab : 'dash',
  );

  const [invQuery, setInvQuery] = useState('');
  const [invStatus, setInvStatus] = useState('');
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
    mrr?: number;
    outstandingTotal?: number;
    overdueTotal?: number;
    pendingInvoices?: number;
    overdueInvoices?: number;
    crmSubscriptions?: number;
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
        return okQ && okSt;
      }),
    [invoiceRows, invQuery, invStatus],
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
    const total = crmCycle === 'annual' ? monthly * 12 * 0.8 : monthly;
    return crmCycle === 'annual'
      ? `Annual: ${seats} × ${formatNaira(rate)} × 12 × 80% = ${formatNaira(total)}`
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
          crmCycle === 'annual' ? rate * seats * 12 * 0.8 : rate * seats;
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
  ];

  const paidTotal = summary?.paidTotal ?? summary?.mrr ?? 0;
  const outstanding = summary?.outstandingTotal ?? 0;

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
        title="Finance Dashboard"
        subtitle="Revenue, invoices, credits & CRM subscription management"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/reports')}>
              📄 Full Reports
            </Button>
            <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
              + Create Invoice
            </Button>
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
            label="Total collected"
            value={formatNaira(paidTotal)}
            trend={`${invoiceRows.filter((i) => i.status === 'Paid').length} paid invoices`}
            trendType="up"
            accent
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="CRM subscriptions"
            value={String(summary?.crmSubscriptions ?? crmClients.length)}
            trend="Active CRM clients"
            trendType="up"
            valueStyle={{ fontSize: 20 }}
          />
          <KCard
            label="Outstanding invoices"
            value={formatNaira(outstanding)}
            trend={`${summary?.pendingInvoices ?? 0} pending · ${summary?.overdueInvoices ?? 0} overdue`}
            trendType="dn"
            valueStyle={{ fontSize: 20, color: 'var(--at)' }}
          />
          <KCard
            label="Overdue amount"
            value={formatNaira(summary?.overdueTotal ?? 0)}
            trend={`${summary?.overdueInvoices ?? 0} invoices`}
            trendType="dn"
            valueStyle={{ fontSize: 20 }}
          />
        </KCardGrid>
        <div className="r3" style={{ marginBottom: 14 }}>
          <Card style={{ marginBottom: 0 }}>
            <CardHeader
              title="Revenue by month — 2026"
              action={
                <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Revenue', 'csv')}>
                  ↓ CSV
                </Button>
              }
            />
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
      </div>

      <div id="fin-invoices" data-g="fin-tabs" style={finPanelStyle(isActive('invoices'))}>
        <div className="ch" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="inp"
              style={{ width: 220 }}
              placeholder="Search invoice or client..."
              value={invQuery}
              onChange={(e) => setInvQuery(e.target.value)}
            />
            <select className="inp" style={{ width: 140 }} value={invStatus} onChange={(e) => setInvStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Invoices', 'csv')}>
              ↓ Export CSV
            </Button>
            <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
              + New Invoice
            </Button>
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
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Issued</th>
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
                    <td>{row.description || '—'}</td>
                    <td>{formatInvoiceAmount(row.amount)}</td>
                    <td>{formatInvoiceDate(row.issuedAt)}</td>
                    <td style={{ color: row.status === 'Overdue' ? 'var(--rt)' : undefined }}>
                      {formatDueLabel(row.dueAt, row.status)}
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
                      {row.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button variant="success" size="sm" onClick={() => markPaid(row)}>
                            Mark Paid
                          </Button>
                        </div>
                      )}
                      {row.status === 'Paid' && (
                        <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, `${row.invoiceId} Receipt`)}>
                          Receipt
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div id="fin-crm" data-g="fin-tabs" style={finPanelStyle(isActive('crm'))}>
        <InfoBanner>
          ℹ CRM tiers: SN ₦5,000 · Sales Nav+ ₦12,000 · CRM 360 ₦25,000 per seat/month. Annual billing at 20% discount.
        </InfoBanner>
        <Card>
          <CardHeader
            title="Active CRM subscriptions"
            action={
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'CRM Subscriptions', 'csv')}>
                ↓ CSV
              </Button>
            }
          />
          {crmClients.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No active CRM subscriptions.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Tier</th>
                  <th>Est. seats</th>
                  <th>Rate</th>
                  <th>Monthly est.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {crmClients.map((c) => {
                  const rate = crmSeatRate(c.crm);
                  const seats =
                    parseSeatsFromDescription(
                      invoiceRows.find((i) => i.clientCode === c.code && i.description?.includes('CRM'))
                        ?.description,
                    ) ?? '—';
                  const seatNum = typeof seats === 'number' ? seats : 0;
                  const crmVar = crmPillVariant(c.crm);
                  const crmLbl = crmPillLabel(c.crm);
                  return (
                    <tr key={c.code}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>{crmVar && crmLbl && <ProductPill variant={crmVar}>{crmLbl}</ProductPill>}</td>
                      <td>{seats}</td>
                      <td>{rate ? `${formatNaira(rate)}/seat/month` : '—'}</td>
                      <td style={{ fontWeight: 600 }}>{seatNum ? formatNaira(rate * seatNum) : '—'}</td>
                      <td>
                        <Badge variant={c.status === 'Attention' ? 'ba' : 'bg'}>{c.status}</Badge>
                      </td>
                      <td>
                        <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
                          Invoice
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
            <Button className="bacc" size="sm" disabled={saving} onClick={() => saveCrmSubscription(true)}>
              Save Subscription & Create Invoice
            </Button>
            <Button className="bsec" size="sm" disabled={saving} onClick={() => saveCrmSubscription(false)}>
              Save Without Invoice
            </Button>
          </div>
        </Card>
      </div>

      <div id="fin-credits" data-g="fin-tabs" style={finPanelStyle(isActive('credits'))}>
        <Card>
          <CardHeader
            title="SartorChain credit bundle sales"
            action={
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Credit Sales', 'csv')}>
                ↓ CSV
              </Button>
            }
          />
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
          <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
            Create credit sale invoice
          </Button>
        </Card>
      </div>
    </>
  );
}
