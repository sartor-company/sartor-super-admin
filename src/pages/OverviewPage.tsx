import { useMemo } from 'react';
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
import { usePlatform } from '../context/PlatformContext';
import { authColor, crmPillLabel, crmPillVariant, exportReport, scPillVariant } from './shared';

export function OverviewPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { overview, clients, charts, loading } = usePlatform();
  const scanSeries = useMemo(
    () =>
      charts?.scanVolume?.length
        ? { labels: charts.scanVolume.map((d) => d.label), values: charts.scanVolume.map((d) => d.count) }
        : undefined,
    [charts],
  );
  const cards = (overview?.cards || {}) as Record<string, number | string>;
  const health = (overview?.health || {}) as Record<string, string | number>;
  const overviewClients = (overview?.clients as typeof clients) || clients.slice(0, 6);

  const healthRows = [
    { dot: 'var(--green)', label: 'API uptime (30d)', value: health.apiUptime || '—' },
    { dot: 'var(--green)', label: 'p95 response time', value: health.p95Response || '—' },
    { dot: 'var(--green)', label: 'DORA model coverage', value: health.doraCoverage ? `${health.doraCoverage}%` : '—' },
    {
      dot: 'var(--amber)',
      label: 'Pending DORA training',
      value: `${health.pendingDoraTraining ?? 0} batches`,
      color: 'var(--at)',
    },
    {
      dot: 'var(--red)',
      label: 'P1/P2 investigations',
      value: `${health.openInvestigationsP1P2 ?? 0} open`,
      color: 'var(--rt)',
    },
    { dot: 'var(--green)', label: 'SMS delivery rate', value: health.smsDeliveryRate || '—' },
  ];

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
        <KCard
          label="Active Clients"
          value={String(cards.activeClients ?? '—')}
          trend={loading ? '…' : 'Live'}
          trendType="up"
          accent
        />
        <KCard label="Total Scans (30d)" value={String(cards.totalScans30d ?? '—')} trend="30d" trendType="up" />
        <KCard label="Platform Auth Rate" value={String(cards.platformAuthRate ?? '—')} trend="Live" trendType="up" />
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/investigations')} role="presentation">
          <KCard label="Open Investigations" value={String(cards.openInvestigations ?? '—')} trend="Open" trendType="dn" />
        </div>
        <KCard
          label="MRR"
          value={cards.mrr ? `₦${Number(cards.mrr).toLocaleString()}` : '—'}
          trend="Paid invoices"
          trendType="up"
        />
      </div>

      <div className="r3" style={{ marginBottom: 14 }}>
        <ChartPanel
          title="Platform scan volume — last 30 days"
          chart="platform-scan"
          marginBottom={0}
          series={scanSeries}
        />
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="System health" />
          {healthRows.map((row) => (
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
              {overviewClients.map((c) => (
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
                          followUp(c.name, 'PIN credits critical at 8%.', c._id);
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
                          followUp(c.name, 'SMS credits at 12%.', c._id);
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
