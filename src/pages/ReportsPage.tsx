import { type CSSProperties, type ReactNode, useState } from 'react';
import { DonutLegend, PageHeader, RangeFilterBar, ReportToolbar } from '../components/patterns';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import { TabBar } from '../components/ui/TabBar';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { RevenueBarChart, RevenueDonutChart } from '../components/charts/AdminCharts';
import { useTabs } from '../hooks/useTabs';
import { exportReport } from './shared';

type ReportTab = 'revenue' | 'scans' | 'clients' | 'crm' | 'credits' | 'invoices';

export function ReportsPage() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { active, setActive } = useTabs<ReportTab>('revenue');
  const [clientFilter, setClientFilter] = useState('All Clients');
  const [range, setRange] = useState('7 days');

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

  const rptPanelIds: Record<ReportTab, string> = {
    revenue: 'rpt-revenue',
    scans: 'rpt-scans',
    clients: 'rpt-clients',
    crm: 'rpt-crm',
    credits: 'rpt-credits',
    invoices: 'rpt-invoices',
  };

  const panel = (id: ReportTab, children: ReactNode) => (
    <div
      id={rptPanelIds[id]}
      data-g="rpt-tabs"
      style={(active === id ? {} : { display: 'none' }) as CSSProperties}
    >
      {children}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Platform-wide reporting · Select, filter, and export"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Report', 'csv')}>
              ↓ Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => exportReport(showToast, 'Report', 'pdf')}>
              📄 Export PDF
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
        onClientChange={(v) => {
          setClientFilter(v);
          showToast(`Report filtered for: ${v}`);
        }}
        reportOptions={[
          { value: 'rpt-revenue', label: 'Revenue Summary' },
          { value: 'rpt-scans', label: 'Scan Analytics' },
          { value: 'rpt-clients', label: 'Client Performance' },
          { value: 'rpt-crm', label: 'CRM Usage' },
          { value: 'rpt-credits', label: 'Credit Usage' },
          { value: 'rpt-invoices', label: 'Invoice Aging' },
        ]}
        clientOptions={[
          'All Clients',
          'Sartor Health Co. Ltd',
          'DankePharma Ltd',
          'NaturalKing FMCG',
          'Bright Home Products',
          'TechBev Nigeria Ltd',
          'AgriPack Ltd',
        ]}
      />

      <TabBar tabs={tabs} active={active} onChange={setActive} />

      {panel(
        'revenue',
        <>
          <RangeFilterBar
            value={range}
            onChange={(r) => {
              setRange(r);
              showToast(`Period set to ${r === 'YTD' ? 'Year to date' : `Last ${r}`}`);
            }}
            onExport={() => exportReport(showToast, 'Revenue Summary', 'csv')}
          />
          <KCardGrid columns={4}>
            <KCard label="Total Revenue (YTD)" value="₦33.45M" trend="↑ 18% vs last year" trendType="up" accent />
            <KCard label="SKU Licence Revenue" value="₦18.4M" trend="55% of total" trendType="up" />
            <KCard label="Credit Bundle Revenue" value="₦7.36M" trend="22% of total" trendType="up" />
            <KCard label="CRM Subscription Revenue" value="₦4.01M" trend="12% of total" trendType="up" />
          </KCardGrid>
          <div className="r3" style={{ marginBottom: 14 }}>
            <Card style={{ marginBottom: 0 }}>
              <div className="ch">
                <div className="ct">Monthly revenue — 2026</div>
              </div>
              {active === 'revenue' && <RevenueBarChart height={200} />}
            </Card>
            <Card style={{ marginBottom: 0 }}>
              <div className="ch">
                <div className="ct">Revenue by type</div>
              </div>
              {active === 'revenue' && <RevenueDonutChart height={155} />}
              <DonutLegend />
            </Card>
          </div>
          <Card>
            <div className="ch">
              <div className="ct">Revenue by client</div>
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Revenue by Client', 'csv')}>
                ↓ CSV
              </Button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>SKU Licences</th>
                  <th>Credit Bundles</th>
                  <th>CRM Subs</th>
                  <th>Onboarding</th>
                  <th>Total YTD</th>
                  <th>% Share</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Sartor Health Co. Ltd', '₦4,200,000', '₦750,000', '₦1,500,000', '₦4,500,000', '₦10,950,000', '32.7%', 'bg'],
                  ['DankePharma Ltd', '₦3,150,000', '₦1,200,000', '—', '₦4,500,000', '₦8,850,000', '26.5%', 'bg'],
                  ['Bright Home Products', '₦1,925,000', '₦1,800,000', '—', '₦4,500,000', '₦8,225,000', '24.6%', 'bg'],
                  ['NaturalKing FMCG', '₦1,400,000', '₦900,000', '—', '₦4,500,000', '₦6,800,000', '20.4%', 'bg'],
                  ['TechBev Nigeria Ltd', '₦700,000', '₦120,000', '₦200,000', '₦3,500,000', '₦4,520,000', '13.5%', 'bx'],
                  ['AgriPack Ltd', '₦1,125,000', '₦430,000', '₦576,000', '₦4,500,000', '₦6,631,000', '19.8%', 'bx'],
                ].map((r) => (
                  <tr key={r[0]}>
                    <td>
                      <strong>{r[0]}</strong>
                    </td>
                    <td>{r[1]}</td>
                    <td>{r[2]}</td>
                    <td>{r[3]}</td>
                    <td>{r[4]}</td>
                    <td style={{ fontWeight: 600 }}>{r[5]}</td>
                    <td>
                      <Badge variant={r[7] as 'bg' | 'bx'}>{r[6]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>,
      )}

      {panel(
        'scans',
        <>
          <RangeFilterBar
            value={range}
            onChange={(r) => {
              setRange(r);
              showToast(`Period set to ${r === 'YTD' ? 'Year to date' : `Last ${r}`}`);
            }}
            onExport={() => exportReport(showToast, 'Scan Analytics', 'csv')}
          />
          <KCardGrid columns={4}>
            <KCard label="Total Scans (YTD)" value="2.14M" trend="↑ 41% vs target" trendType="up" accent />
            <KCard label="GENUINE (DC-1)" value="2.07M" trend="96.8%" trendType="up" />
            <KCard label="Warnings (DC-3/4/5)" value="47K" trend="2.2%" trendType="neu" />
            <KCard label="Counterfeit Suspected" value="23K" trend="1.1%" trendType="dn" />
          </KCardGrid>
          <Card>
            <div className="ch">
              <div className="ct">Scan volume by client</div>
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Scan Analytics', 'csv')}>
                ↓ CSV
              </Button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Total Scans</th>
                  <th>Genuine</th>
                  <th>Uncertain</th>
                  <th>Warning</th>
                  <th>Auth Rate</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Sartor Health', '145,000', '141,230', '2,900', '870', '97.4%', 'up', 'var(--gt)'],
                  ['DankePharma', '92,000', '87,492', '3,220', '1,288', '95.1%', 'up', 'var(--gt)'],
                  ['Bright Home', '31,000', '29,853', '961', '186', '96.3%', 'up', 'var(--gt)'],
                  ['NaturalKing', '19,000', '16,758', '1,330', '912', '88.2%', 'dn', 'var(--at)'],
                  ['TechBev Nigeria', '8,400', '7,983', '294', '123', '94.8%', 'up', 'var(--gt)'],
                  ['AgriPack', '21,600', '20,754', '605', '241', '96.1%', 'up', 'var(--gt)'],
                ].map((r) => (
                  <tr key={r[0]}>
                    <td>
                      <strong>{r[0]}</strong>
                    </td>
                    <td>{r[1]}</td>
                    <td>{r[2]}</td>
                    <td>{r[3]}</td>
                    <td>{r[4]}</td>
                    <td style={{ color: r[7], fontWeight: 600 }}>{r[5]}</td>
                    <td className={r[6]}>{r[6] === 'up' ? '↑ 1.2%' : '↓ 1.8%'}</td>
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
          <RangeFilterBar
            value={range}
            onChange={(r) => {
              setRange(r);
              showToast(`Period set to ${r === 'YTD' ? 'Year to date' : `Last ${r}`}`);
            }}
            onExport={() => exportReport(showToast, 'Client Scorecard', 'csv')}
          />
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
                  <th>Renewal Due</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Sartor Health', 'growth', '360', '97.4%', 'Healthy', 'bg', 1, 4, 'Jan 2027', '⭐ 4.7/5', 'bg'],
                  ['AgriPack', 'growth', 'snp', '96.1%', 'Healthy', 'bg', 0, 0, 'Feb 2027', '⭐ 4.6/5', 'bg'],
                  ['Bright Home', 'growth', null, '96.3%', 'Healthy', 'bg', 1, 1, 'Mar 2027', '⭐ 4.3/5', 'bg'],
                  ['DankePharma', 'growth', null, '95.1%', 'SMS Low', 'ba', 1, 1, 'Feb 2027', '⭐ 3.9/5', 'ba'],
                  ['TechBev Nigeria', 'starter', 'sn', '94.8%', 'Healthy', 'bg', 0, 0, 'Apr 2027', '⭐ 4.1/5', 'bg'],
                  ['NaturalKing', 'growth', null, '88.2%', 'PIN Critical', 'br', 1, 2, 'Jun 2026', '⭐ 2.8/5', 'br'],
                ].map((r) => (
                  <tr key={r[0]}>
                    <td>
                      <strong>{r[0]}</strong>
                    </td>
                    <td>
                      <ProductPill variant={r[1] as string}>SC</ProductPill>
                      {r[2] && (
                        <ProductPill variant={r[2] as string}>
                          {r[2] === '360' ? 'CRM 360' : r[2] === 'snp' ? 'SNP' : 'SN'}
                        </ProductPill>
                      )}
                    </td>
                    <td style={{ color: 'var(--gt)', fontWeight: 600 }}>{r[3]}</td>
                    <td>
                      <Badge variant={r[5] as 'bg' | 'ba' | 'br'}>{r[4]}</Badge>
                    </td>
                    <td>{r[6]}</td>
                    <td>{r[7]}</td>
                    <td>{r[8]}</td>
                    <td>
                      <Badge variant={r[10] as 'bg' | 'ba' | 'br'}>{r[9]}</Badge>
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
          <RangeFilterBar
            value={range}
            onChange={(r) => {
              setRange(r);
              showToast(`Period set to ${r === 'YTD' ? 'Year to date' : `Last ${r}`}`);
            }}
            onExport={() => exportReport(showToast, 'CRM Usage Report', 'csv')}
          />
          <KCardGrid columns={4}>
            <KCard label="CRM Subscription MRR" value="₦1.036M" trend="↑ 15%" trendType="up" accent />
            <KCard label="CRM Clients" value="3" trend="Active subscriptions" trendType="neu" />
            <KCard label="Total Active Seats" value="36" trend="↑ 4 this month" trendType="up" />
            <KCard label="CRM 360 Seats" value="12" trend="Sartor Health only" trendType="neu" />
          </KCardGrid>
          <Card>
            <div className="ch">
              <div className="ct">CRM subscription by client — all tiers billed per seat per month</div>
              <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'CRM Subscriptions', 'csv')}>
                ↓ CSV
              </Button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>CRM Tier</th>
                  <th>Active Seats</th>
                  <th>Rate (per seat/month)</th>
                  <th>Monthly Total</th>
                  <th>Annual (20% off)</th>
                  <th>Next Billing</th>
                  <th>Status</th>
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
                    <Badge variant="bg">Active</Badge>
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
                    <Badge variant="bg">Active</Badge>
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
                    <Badge variant="bg">Active</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
          <Card>
            <div className="ch">
              <div className="ct">Seat usage detail (May 2026)</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Tier</th>
                  <th>Provisioned Seats</th>
                  <th>Active Users</th>
                  <th>Utilisation</th>
                  <th>Last Login (any seat)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Sartor Health', '360', 20, 12, 60, 'var(--amber)', 'Today'],
                  ['AgriPack', 'snp', 20, 16, 80, 'var(--green)', 'Today'],
                  ['TechBev', 'sn', 10, 8, 80, 'var(--green)', 'Yesterday'],
                ].map((r) => (
                  <tr key={r[0]}>
                    <td>
                      <strong>{r[0]}</strong>
                    </td>
                    <td>
                      <ProductPill variant={r[1] as string}>
                        {r[1] === '360' ? 'CRM 360' : r[1] === 'snp' ? 'Sales Nav+' : 'Sales Nav'}
                      </ProductPill>
                    </td>
                    <td>{r[2]}</td>
                    <td>{r[3]}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 60 }}>
                          <div className="pbar">
                            <div className="pfill" style={{ width: `${r[4]}%`, background: r[5] }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 11 }}>{r[4]}%</span>
                      </div>
                    </td>
                    <td>{r[6]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>,
      )}

      {panel(
        'credits',
        <>
          <RangeFilterBar
            value={range}
            onChange={(r) => {
              setRange(r);
              showToast(`Period set to ${r === 'YTD' ? 'Year to date' : `Last ${r}`}`);
            }}
            onExport={() => exportReport(showToast, 'Credit Usage', 'csv')}
          />
          <Card>
            <div className="ch">
              <div className="ct">Credit usage by client</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>PIN Used</th>
                  <th>PIN Remaining</th>
                  <th>SMS Used</th>
                  <th>SMS Remaining</th>
                  <th>Batch Cal Used</th>
                  <th>Batch Cal Left</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Sartor Health</strong>
                  </td>
                  <td>1,800</td>
                  <td style={{ color: 'var(--gt)' }}>8,200</td>
                  <td>4,124</td>
                  <td style={{ color: 'var(--at)' }}>5,876</td>
                  <td>12</td>
                  <td>18</td>
                </tr>
                <tr>
                  <td>
                    <strong>DankePharma</strong>
                  </td>
                  <td>22,000</td>
                  <td style={{ color: 'var(--gt)' }}>28,000</td>
                  <td>44,000</td>
                  <td style={{ color: 'var(--rt)' }}>6,000 (12%)</td>
                  <td>9</td>
                  <td>6</td>
                </tr>
                <tr>
                  <td>
                    <strong>Bright Home</strong>
                  </td>
                  <td>8,500</td>
                  <td style={{ color: 'var(--gt)' }}>1,500</td>
                  <td>3,200</td>
                  <td>6,800</td>
                  <td>5</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>
                    <strong>NaturalKing</strong>
                  </td>
                  <td>9,200</td>
                  <td style={{ color: 'var(--rt)' }}>800 (8%)</td>
                  <td>8,100</td>
                  <td style={{ color: 'var(--gt)' }}>1,900</td>
                  <td>8</td>
                  <td>6</td>
                </tr>
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
              <button key={r} type="button" className={`rng-btn ${i === 0 ? 'on' : ''}`} onClick={() => showToast(`Period: ${r}`)}>
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
                  <th>Days Overdue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>INV-2026-044</td>
                  <td>DankePharma</td>
                  <td>SMS Credits 50K</td>
                  <td>₦200,000</td>
                  <td>Apr 25</td>
                  <td>May 9</td>
                  <td style={{ color: 'var(--rt)', fontWeight: 600 }}>3 days</td>
                  <td>
                    <Badge variant="br">Overdue</Badge>
                  </td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        followUp('DankePharma Ltd', 'INV-2026-044 (₦200,000) 3 days overdue.')
                      }
                    >
                      Chase
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>INV-2026-047</td>
                  <td>NaturalKing</td>
                  <td>PIN Credits 10K</td>
                  <td>₦150,000</td>
                  <td>May 1</td>
                  <td>May 15</td>
                  <td style={{ color: 'var(--at)' }}>3 left</td>
                  <td>
                    <Badge variant="ba">Due Soon</Badge>
                  </td>
                  <td>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        followUp('NaturalKing FMCG', 'INV-2026-047 (₦150,000) due May 15.')
                      }
                    >
                      Remind
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>INV-2026-049</td>
                  <td>FreshNow</td>
                  <td>Pilot Programme Fee</td>
                  <td>₦3,500,000</td>
                  <td>May 5</td>
                  <td>May 20</td>
                  <td style={{ color: 'var(--text3)' }}>8 left</td>
                  <td>
                    <Badge variant="bx">Pending</Badge>
                  </td>
                  <td>
                    <Button variant="success" size="sm" onClick={() => showToast('Payment recorded.', 'success')}>
                      Mark Paid
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>INV-2026-031</td>
                  <td>Sartor Health</td>
                  <td>SMS Credits 10K</td>
                  <td>₦45,000</td>
                  <td>Apr 1</td>
                  <td>Apr 15</td>
                  <td style={{ color: 'var(--gt)' }}>Paid</td>
                  <td>
                    <Badge variant="bg">Paid</Badge>
                  </td>
                  <td>
                    <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'INV-2026-031 Receipt')}>
                      Receipt
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </>,
      )}
    </>
  );
}
