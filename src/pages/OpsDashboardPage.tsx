import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import { CardLinkAction, ChartPanel, PageHeader } from '../components/patterns';
import type { OnboardingRow } from '../data/onboarding';
import { usePlatform } from '../context/PlatformContext';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import type { DoraQueueRow } from '../types/dora';
import { exportReport } from '../utils/exportReport';

export function OpsDashboardPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { onboarding, overview, tickets, doraQueue, charts, loading } = usePlatform();
  const healthSeries = useMemo(
    () =>
      charts?.healthTimeline?.length
        ? {
            labels: charts.healthTimeline.map((d) => d.label),
            values: charts.healthTimeline.map((d) => d.pct),
          }
        : undefined,
    [charts],
  );

  const pipeline = onboarding as OnboardingRow[];
  const health = overview as {
    health?: { apiUptime?: string; pendingDoraTraining?: number };
    cards?: { onboardingCount?: number };
  } | null;
  const queue = doraQueue as DoraQueueRow[];
  const openTickets = (tickets as { status?: string }[]).filter((t) =>
    ['Open', 'In Progress'].includes(t.status || ''),
  ).length;

  const avgStep =
    pipeline.length > 0
      ? (
          pipeline.reduce((sum, r) => {
            const [a, b] = r.step.split('/').map(Number);
            return sum + (b ? a / b : 0);
          }, 0) / pipeline.length
        ).toFixed(1)
      : '—';

  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Client onboarding · Platform health · Training"
        actions={
          <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Ops Dashboard')}>
            ↓ Export
          </Button>
        }
      />

      {loading && !health && pipeline.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Loading operations data…</p>
      )}

      <KCardGrid columns={4}>
        <KCard
          label="Clients Onboarding"
          value={String(health?.cards?.onboardingCount ?? pipeline.length)}
          trend={pipeline.length ? `Step ${avgStep}/4 avg` : 'No active onboarding'}
          trendType="neu"
        />
        <KCard
          label="Batches Pending Training"
          value={String(health?.health?.pendingDoraTraining ?? queue.length)}
          trend={queue[0] ? `Oldest: ${queue[0].waiting}` : 'Queue clear'}
          trendType={queue.length ? 'dn' : 'up'}
        />
        <KCard
          label="Platform Uptime (30d)"
          value={health?.health?.apiUptime ?? '—'}
          trend="From platform health"
          trendType="up"
        />
        <KCard
          label="Support Tickets Open"
          value={String(openTickets)}
          trend={`${tickets.length} total loaded`}
          trendType="neu"
        />
      </KCardGrid>

      <div className="r2">
        <Card style={{ marginBottom: 0 }}>
          <CardHeader
            title="Onboarding pipeline"
            action={<CardLinkAction onClick={() => navigate('/onboarding')}>View all →</CardLinkAction>}
          />
          {pipeline.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No clients in onboarding.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Products</th>
                  <th>Step</th>
                  <th>Blocker</th>
                  <th>Assigned</th>
                  <th>Started</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pipeline.slice(0, 6).map((r) => (
                  <tr key={r.client}>
                    <td>
                      <strong>{r.client}</strong>
                    </td>
                    <td>
                      <ProductPill variant={r.product as 'pilot' | 'growth'}>{r.productLabel}</ProductPill>
                    </td>
                    <td>{r.step}</td>
                    <td>
                      <Badge variant={r.blocker && r.blocker !== 'None' ? 'ba' : 'bg'}>
                        {r.blocker || 'None'}
                      </Badge>
                    </td>
                    <td>{r.assigned}</td>
                    <td>{r.started}</td>
                    <td>
                      {r.action === 'followup' && (
                        <Button
                          className="bacc"
                          size="sm"
                          onClick={() => followUp(r.client, r.followUpMessage ?? r.blocker)}
                        >
                          Chase
                        </Button>
                      )}
                      {r.action === 'view' && r.viewClientCode && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/clients/${r.viewClientCode}`)}
                        >
                          View
                        </Button>
                      )}
                      {r.action === 'assign' && (
                        <Button variant="primary" size="sm" onClick={() => openModal('assign')}>
                          Assign
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card style={{ marginBottom: 0 }}>
          <CardHeader
            title="DORA training queue"
            action={<CardLinkAction onClick={() => navigate('/aiml/queue')}>Full queue →</CardLinkAction>}
          />
          {queue.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No batches awaiting training.</p>
          ) : (
            <div style={{ display: 'grid', gap: 7, fontSize: 12 }}>
              {queue.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  style={{
                    padding: 9,
                    background:
                      item.slaVariant === 'br'
                        ? 'var(--rb)'
                        : item.slaVariant === 'ba'
                          ? 'var(--ab)'
                          : 'var(--bg2)',
                    borderRadius: 7,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <strong>{item.batch}</strong>
                    <Badge variant={item.slaVariant}>{item.waiting}</Badge>
                  </div>
                  <div style={{ color: 'var(--text2)' }}>
                    {item.client} · {item.product}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ChartPanel
        title="Platform health timeline — last 14 days"
        chart="ops-health"
        height={160}
        series={healthSeries}
      />
    </>
  );
}
