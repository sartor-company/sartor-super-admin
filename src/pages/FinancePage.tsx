import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormGroup } from '../components/ui/FormGroup';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import { TabBar } from '../components/ui/TabBar';
import { DonutLegend, InfoBanner, PageHeader } from '../components/patterns';
import { Card, CardHeader } from '../components/ui/Card';
import { useFollowUp } from '../hooks/useFollowUp';
import { RevenueBarChart, RevenueDonutChart } from '../components/charts/AdminCharts';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { useTabs } from '../hooks/useTabs';
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

  const urlTab = searchParams.get('finTab') as FinTab | null;
  const { active, setActive, isActive } = useTabs<FinTab>(
    urlTab && FIN_TAB_IDS.includes(urlTab) ? urlTab : 'dash',
  );

  const [invQuery, setInvQuery] = useState('');
  const [invStatus, setInvStatus] = useState('');
  const [crmPreview, setCrmPreview] = useState('');

  useEffect(() => {
    if (urlTab && FIN_TAB_IDS.includes(urlTab) && urlTab !== active) {
      setActive(urlTab);
    }
  }, [urlTab, active, setActive]);

  const setFinTab = (tab: FinTab) => {
    setActive(tab);
    setSearchParams({ finTab: tab }, { replace: true });
  };

  const tabs = [
    { id: 'dash' as const, label: 'Dashboard' },
    { id: 'invoices' as const, label: 'Invoices' },
    { id: 'crm' as const, label: 'CRM Subscriptions' },
    { id: 'credits' as const, label: 'SC Credit Sales' },
  ];

  const invoices = useMemo(
    () =>
      [
        { id: 'INV-2026-044', client: 'DankePharma', desc: 'SMS Credits 50K', amount: '₦200,000', issued: 'Apr 25', due: 'May 9 (overdue)', status: 'Overdue', st: 'Overdue' },
        { id: 'INV-2026-047', client: 'NaturalKing', desc: 'PIN Credits 10K', amount: '₦150,000', issued: 'May 1', due: 'May 15', status: 'Due Soon', st: 'Due Soon' },
        { id: 'INV-2026-049', client: 'FreshNow', desc: 'Pilot Programme Fee', amount: '₦3,500,000', issued: 'May 5', due: 'May 20', status: 'Pending', st: 'Pending' },
        { id: 'INV-2026-031', client: 'Sartor Health', desc: 'CRM 360 Monthly Seats (12 × ₦25K)', amount: '₦300,000', issued: 'Apr 1', due: 'Apr 15', status: 'Paid', st: 'Paid' },
        { id: 'INV-2026-028', client: 'AgriPack', desc: 'Sales Nav Plus 16 seats × ₦12K', amount: '₦192,000', issued: 'Apr 1', due: 'Apr 15', status: 'Paid', st: 'Paid' },
      ].filter((row) => {
        const q = invQuery.toLowerCase();
        const okQ = !q || `${row.id} ${row.client}`.toLowerCase().includes(q);
        const okSt = !invStatus || row.st === invStatus;
        return okQ && okSt;
      }),
    [invQuery, invStatus],
  );

  const calcFinCRM = () => {
    const tier = (document.getElementById('fin-crm-tier') as HTMLSelectElement | null)?.value;
    const seats = Number((document.getElementById('fin-crm-seats') as HTMLInputElement | null)?.value || 0);
    const cycle = (document.getElementById('fin-crm-cycle') as HTMLSelectElement | null)?.value;
    if (!tier || !seats) {
      setCrmPreview('');
      return;
    }
    const rate = Number(tier);
    const monthly = rate * seats;
    const total = cycle === 'annual' ? monthly * 12 * 0.8 : monthly;
    setCrmPreview(
      cycle === 'annual'
        ? `Annual: ${seats} × ₦${rate.toLocaleString()} × 12 × 80% = ₦${total.toLocaleString()}`
        : `Monthly: ${seats} × ₦${rate.toLocaleString()} = ₦${monthly.toLocaleString()}/month`,
    );
  };

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

      <div id="fin-dash" data-g="fin-tabs" style={finPanelStyle(isActive('dash'))}>
        <KCardGrid columns={4}>
          <KCard
            label="Monthly Recurring Revenue"
            value="₦8.75M"
            trend="↑ 12% MoM"
            trendType="up"
            accent
            valueStyle={{ fontSize: 20 }}
          />
          <KCard label="CRM Subscription MRR" value="₦1.04M" trend="↑ 15%" trendType="up" valueStyle={{ fontSize: 20 }} />
          <KCard
            label="Outstanding Invoices"
            value="₦1.25M"
            trend="3 invoices"
            trendType="dn"
            valueStyle={{ fontSize: 20, color: 'var(--at)' }}
          />
          <KCard label="Onboarding Fees (YTD)" value="₦18M" trend="4 clients" trendType="up" valueStyle={{ fontSize: 20 }} />
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
            {isActive('dash') && <RevenueBarChart height={190} />}
          </Card>
          <Card style={{ marginBottom: 0 }}>
            <CardHeader title="Revenue breakdown" />
            {isActive('dash') && <RevenueDonutChart height={145} />}
            <DonutLegend marginTop={7} />
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
                {invoices.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{row.id}</td>
                    <td>{row.client}</td>
                    <td>{row.desc}</td>
                    <td>{row.amount}</td>
                    <td>{row.issued}</td>
                    <td style={{ color: row.st === 'Overdue' ? 'var(--rt)' : undefined }}>{row.due}</td>
                    <td>
                      <Badge variant={row.st === 'Overdue' ? 'br' : row.st === 'Due Soon' ? 'ba' : row.st === 'Paid' ? 'bg' : 'bx'}>
                        {row.status}
                      </Badge>
                    </td>
                    <td>
                      {row.st === 'Overdue' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            followUp('DankePharma Ltd', `${row.id} (${row.amount}) is 3 days overdue.`)
                          }
                        >
                          Chase
                        </Button>
                      )}
                      {row.st === 'Due Soon' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            followUp('NaturalKing FMCG', `${row.id} (${row.amount}) due May 15.`)
                          }
                        >
                          Remind
                        </Button>
                      )}
                      {row.st === 'Pending' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button variant="secondary" size="sm" onClick={() => showToast('Invoice viewed.')}>
                            View
                          </Button>
                          <Button variant="success" size="sm" onClick={() => showToast('Payment recorded for INV-2026-049.', 'success')}>
                            Mark Paid
                          </Button>
                        </div>
                      )}
                      {row.st === 'Paid' && (
                        <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, `${row.id} Receipt`)}>
                          Receipt
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
      </div>

      <div id="fin-crm" data-g="fin-tabs" style={finPanelStyle(isActive('crm'))}>
        <InfoBanner>
          ℹ All CRM tiers are billed per seat per month. SN: ₦5,000 · Sales Nav+: ₦12,000 · CRM 360: ₦25,000. Annual billing available at 20% discount.
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
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Tier</th>
                  <th>Active Seats</th>
                  <th>Rate</th>
                  <th>Monthly Total</th>
                  <th>Annual (20% off)</th>
                  <th>Next Billing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Sartor Health Co. Ltd</strong>
                  </td>
                  <td>
                    <ProductPill variant="360">CRM 360</ProductPill>
                  </td>
                  <td>12</td>
                  <td>₦25,000/seat/month</td>
                  <td style={{ fontWeight: 600 }}>₦300,000</td>
                  <td>₦2,880,000</td>
                  <td>May 30, 2026</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="secondary" size="sm" onClick={() => openModal('seatadj')}>
                        Adjust Seats
                      </Button>
                      <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
                        Invoice
                      </Button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>AgriPack Ltd</strong>
                  </td>
                  <td>
                    <ProductPill variant="snp">Sales Nav+</ProductPill>
                  </td>
                  <td>16</td>
                  <td>₦12,000/seat/month</td>
                  <td style={{ fontWeight: 600 }}>₦192,000</td>
                  <td>₦1,843,200</td>
                  <td>May 30, 2026</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="secondary" size="sm" onClick={() => openModal('seatadj')}>
                        Adjust Seats
                      </Button>
                      <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
                        Invoice
                      </Button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>TechBev Nigeria Ltd</strong>
                  </td>
                  <td>
                    <ProductPill variant="sn">Sales Navigator</ProductPill>
                  </td>
                  <td>8</td>
                  <td>₦5,000/seat/month</td>
                  <td style={{ fontWeight: 600 }}>₦40,000</td>
                  <td>₦384,000</td>
                  <td>May 30, 2026</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="secondary" size="sm" onClick={() => openModal('seatadj')}>
                        Adjust Seats
                      </Button>
                      <Button className="bacc" size="sm" onClick={() => openModal('invoice')}>
                        Invoice
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
          <Card>
            <CardHeader title="Add or update CRM subscription" />
            <div className="fr2">
              <FormGroup label="Client *">
                <select className="inp" id="fin-crm-client" defaultValue="">
                  <option value="">Select client...</option>
                  <option>Sartor Health Co. Ltd</option>
                  <option>DankePharma Ltd</option>
                  <option>NaturalKing FMCG</option>
                  <option>Bright Home Products</option>
                  <option>FreshNow Consumer</option>
                  <option>TechBev Nigeria Ltd</option>
                  <option>AgriPack Ltd</option>
                </select>
              </FormGroup>
              <FormGroup label="CRM Tier *">
                <select className="inp" id="fin-crm-tier" onChange={calcFinCRM} defaultValue="">
                  <option value="">Select tier...</option>
                  <option value="5000">Sales Navigator — ₦5,000/seat/month</option>
                  <option value="12000">Sales Navigator Plus — ₦12,000/seat/month</option>
                  <option value="25000">CRM 360 — ₦25,000/seat/month</option>
                </select>
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="Number of Seats *">
                <input type="number" className="inp" id="fin-crm-seats" placeholder="e.g. 10" min={1} onInput={calcFinCRM} />
              </FormGroup>
              <FormGroup label="Billing Cycle">
                <select className="inp" id="fin-crm-cycle" onChange={calcFinCRM} defaultValue="monthly">
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
            <FormGroup label="Notes">
              <input className="inp" placeholder="e.g. Upgrade from SN to SNP, 4 additional seats" />
            </FormGroup>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                className="bacc"
                size="sm"
                onClick={() => {
                  showToast('Subscription saved. Invoice created.', 'success');
                  openModal('invoice');
                }}
              >
                Save Subscription & Create Invoice
              </Button>
              <Button className="bsec" size="sm" onClick={() => showToast('Subscription saved.', 'success')}>
                Save Without Invoice
              </Button>
            </div>
          </Card>
      </div>

      <div id="fin-credits" data-g="fin-tabs" style={finPanelStyle(isActive('credits'))}>
        <Card>
          <CardHeader
            title="SartorChain credit bundle sales (30d)"
            action={
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Credit Sales', 'csv')}>
                ↓ CSV
              </Button>
            }
          />
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Product</th>
                  <th>Credit Type</th>
                  <th>Qty</th>
                  <th>Revenue</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Sartor Health', 'SMS Starter 10K', '10,000', '₦45,000', 'Apr 1'],
                  ['Sartor Health', 'PIN Entry 10K', '10,000', '₦150,000', 'Mar 15'],
                  ['Bright Home', 'Batch Cal. Starter 5cr', '5 credits', '₦800,000', 'Apr 10'],
                  ['DankePharma', 'SMS Standard 50K', '50,000', '₦200,000', 'Apr 5'],
                  ['NaturalKing', 'PIN Entry 10K', '10,000', '₦150,000', 'Apr 3'],
                ].map((r) => (
                  <tr key={r[0] + r[1]}>
                    <td>{r[0]}</td>
                    <td>
                      <ProductPill variant="growth">SC</ProductPill>
                    </td>
                    <td>{r[1]}</td>
                    <td>{r[2]}</td>
                    <td>{r[3]}</td>
                    <td>{r[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        <Card>
          <CardHeader title="Add SartorChain credits to client account" />
            <div className="fr3">
              <FormGroup label="Client">
                <select className="inp" defaultValue="">
                  <option>Select client...</option>
                  <option>Sartor Health Co. Ltd</option>
                  <option>DankePharma Ltd</option>
                  <option>NaturalKing FMCG</option>
                  <option>Bright Home Products</option>
                </select>
              </FormGroup>
              <FormGroup label="Credit Type">
                <select className="inp">
                  <option>Batch Calibration</option>
                  <option>PIN Authentication</option>
                  <option>SMS Notifications</option>
                </select>
              </FormGroup>
              <FormGroup label="Quantity">
                <input type="number" className="inp" placeholder="e.g. 10,000" />
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="Amount Charged (₦)">
                <input className="inp" placeholder="₦ invoiced" />
              </FormGroup>
              <FormGroup label="Invoice Reference">
                <input className="inp" placeholder="INV-2026-XXX" />
              </FormGroup>
            </div>
          <Button className="bacc" size="sm" onClick={() => showToast('Credits added and transaction logged.', 'success')}>
            Add Credits & Log Transaction
          </Button>
        </Card>
      </div>
    </>
  );
}
