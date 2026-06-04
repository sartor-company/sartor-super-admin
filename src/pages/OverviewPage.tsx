import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ClientAvatar } from '../components/ui/ClientAvatar';
import { KCard } from '../components/ui/KCard';
import { AlertPanelButton, CardLinkAction, ChartPanel, PageHeader, StatRow } from '../components/patterns';
import { ProductPill } from '../components/ui/ProductPill';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { CLIENTS } from '../data/clients';
import { authColor, crmPillLabel, crmPillVariant, exportReport, scPillVariant } from './shared';

const HEALTH_ROWS = [
  { dot: 'var(--green)', label: 'API uptime (30d)', value: '99.7%' },
  { dot: 'var(--green)', label: 'p95 response time', value: '1.8s' },
  { dot: 'var(--green)', label: 'DORA model coverage', value: '91.4%' },
  { dot: 'var(--amber)', label: 'Pending DORA training', value: '7 batches', color: 'var(--at)' },
  { dot: 'var(--red)', label: 'P1/P2 investigations', value: '4 open', color: 'var(--rt)' },
  { dot: 'var(--green)', label: 'SMS delivery rate', value: '97.3%' },
];

const OVERVIEW_CLIENTS = CLIENTS.filter((c) =>
  ['SHC', 'DPL', 'FNC', 'NKF'].includes(c.code),
);

export function OverviewPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();

  const openClient = (code: string) => navigate(`/clients/${code}`);

  return (
    <>
      <PageHeader
        title="Platform Overview"
        subtitle="All clients · Live system health · May 12, 2026"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/reports')}>
              📄 Reports
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Platform Overview')}>
              ↓ Export
            </Button>
            <Button className="bacc" size="sm" onClick={() => openModal('onboard')}>
              + Onboard Client
            </Button>
          </div>
        }
      />

      <div className="kgrid5">
        <KCard label="Active Clients" value="14" trend="↑ 2 this month" trendType="up" accent />
        <KCard label="Total Scans (30d)" value="287K" trend="↑ 34%" trendType="up" />
        <KCard label="Platform Auth Rate" value="96.8%" trend="↑ 0.9%" trendType="up" />
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/investigations')} role="presentation">
          <KCard label="Open Investigations" value="23" trend="↑ 5 this week" trendType="dn" />
        </div>
        <KCard label="MRR" value="₦8.75M" trend="↑ 12%" trendType="up" />
      </div>

      <div className="r3" style={{ marginBottom: 14 }}>
        <ChartPanel title="Platform scan volume — last 30 days" chart="platform-scan" marginBottom={0} />
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="System health" />
          {HEALTH_ROWS.map((row) => (
            <StatRow
              key={row.label}
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="hdot" style={{ background: row.dot }} />
                  {row.label}
                </span>
              }
              value={row.value}
              valueColor={row.color}
            />
          ))}
        </Card>
      </div>

      <div className="r2">
        <Card style={{ marginBottom: 0 }}>
          <CardHeader
            title="Client health at a glance"
            action={<CardLinkAction onClick={() => navigate('/clients')}>View all →</CardLinkAction>}
          />
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>Client</th>
                <th>Products</th>
                <th>Auth Rate</th>
                <th>Health</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {OVERVIEW_CLIENTS.map((c) => (
                <tr key={c.code} className="cl" onClick={() => openClient(c.code)}>
                  <td>
                    <ClientAvatar initials={c.ini} color={c.av} />
                  </td>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {c.skus} SKUs · {c.batches} batches
                    </div>
                  </td>
                  <td>
                    <ProductPill variant={scPillVariant(c.scband)}>SC·{c.scband}</ProductPill>
                    {crmPillVariant(c.crm) && crmPillLabel(c.crm) && (
                      <ProductPill variant={crmPillVariant(c.crm)!}>{crmPillLabel(c.crm)}</ProductPill>
                    )}
                  </td>
                  <td style={{ color: authColor(c.authRate), fontWeight: 600 }}>{c.authRate}</td>
                  <td>
                    <Badge variant={c.creditHealth.variant}>{c.creditHealth.label}</Badge>
                  </td>
                  <td>
                    <Badge variant={c.status === 'Onboarding' ? 'ba' : c.status === 'Attention' ? 'ba' : 'bg'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td>
                    {c.code === 'NKF' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          followUp(c.name, 'PIN credits critical at 8%.');
                        }}
                      >
                        Alert
                      </Button>
                    ) : c.code === 'DPL' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          followUp(c.name, 'SMS credits at 12%.');
                        }}
                      >
                        Follow Up
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openClient(c.code);
                        }}
                      >
                        {c.code === 'FNC' ? 'View' : 'Manage'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="Actions required" />
          <div style={{ display: 'grid', gap: 7 }}>
            <AlertPanelButton
              tone="critical"
              title="P1 — NaturalKing Batch Mismatch"
              badge="Critical"
              badgeVariant="br"
              description="BATCH-NK-019 — Shanghai origin. INV-2026-112."
              buttonLabel="Review"
              buttonVariant="danger"
              onClick={() => navigate('/investigations')}
            />
            <AlertPanelButton
              tone="attention"
              title="7 Batches Awaiting DORA Training"
              badge="Attention"
              badgeVariant="ba"
              description="Oldest: BATCH-DP-042 at 6 days."
              buttonLabel="Training Queue"
              onClick={() => navigate('/aiml/queue')}
            />
            <AlertPanelButton
              tone="attention"
              title="NaturalKing PIN Credits at 8%"
              badge="Urgent"
              badgeVariant="ba"
              description="~800 PINs remaining. 4 days."
              buttonLabel="Contact"
              onClick={() => followUp('NaturalKing FMCG', 'PIN credits critical.')}
            />
            <AlertPanelButton
              tone="setup"
              title="FreshNow — Onboarding Blocked"
              badge="Setup"
              badgeVariant="bb"
              description="DORA images not uploaded."
              buttonLabel="Follow Up"
              onClick={() => followUp('FreshNow Consumer', 'DORA reference images required.')}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
