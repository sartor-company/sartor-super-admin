import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import { CardLinkAction, ChartPanel, PageHeader } from '../components/patterns';
import { OPS_ONBOARDING_ROWS } from '../data/onboarding';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { exportReport } from '../utils/exportReport';

export function OpsDashboardPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();

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

      <KCardGrid columns={4}>
        <KCard label="Clients Onboarding" value="3" trend="Step 2/4 avg" trendType="neu" />
        <KCard label="Batches Pending Training" value="7" trend="Oldest: 6 days" trendType="dn" />
        <KCard label="Platform Uptime (30d)" value="99.7%" trend="SLA: 99.5%" trendType="up" />
        <KCard label="Support Tickets Open" value="5" trend="2 escalated" trendType="neu" />
      </KCardGrid>

      <div className="r2">
        <Card style={{ marginBottom: 0 }}>
          <CardHeader
            title="Onboarding pipeline"
            action={<CardLinkAction onClick={() => navigate('/onboarding')}>View all →</CardLinkAction>}
          />
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Products</th>
                <th>Step</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Age</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {OPS_ONBOARDING_ROWS.map((r) => (
                <tr key={r.client}>
                  <td>
                    <strong>{r.client}</strong>
                  </td>
                  <td>
                    <ProductPill variant={r.product}>{r.productLabel}</ProductPill>
                  </td>
                  <td>{r.stepDetail}</td>
                  <td>
                    <Badge variant={r.statusVariant}>{r.status}</Badge>
                  </td>
                  <td style={r.assignedColor ? { color: r.assignedColor } : undefined}>{r.assigned}</td>
                  <td>{r.age}</td>
                  <td>
                    {r.action === 'followup' && (
                      <Button
                        className="bacc"
                        size="sm"
                        onClick={() => followUp(r.client, r.followUpMessage ?? '')}
                      >
                        Chase
                      </Button>
                    )}
                    {r.action === 'view' && (
                      <Button variant="secondary" size="sm" onClick={() => navigate('/clients/SHC')}>
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
        </Card>
        <Card style={{ marginBottom: 0 }}>
          <CardHeader
            title="DORA training queue"
            action={<CardLinkAction onClick={() => navigate('/aiml/queue')}>Full queue →</CardLinkAction>}
          />
          <div style={{ display: 'grid', gap: 7, fontSize: 12 }}>
            {[
              { batch: 'BATCH-DP-042', days: '6 days', variant: 'br' as const, desc: 'DankePharma · Paracetamol 500mg', bg: 'var(--rb)' },
              { batch: 'BATCH-NK-018', days: '4 days', variant: 'ba' as const, desc: 'NaturalKing · Body Cream 200ml', bg: 'var(--ab)' },
              { batch: 'BATCH-FN-002', days: '3 days', variant: 'ba' as const, desc: 'FreshNow · Liquid Soap 500ml', bg: 'var(--ab)' },
            ].map((item) => (
              <div key={item.batch} style={{ padding: 9, background: item.bg, borderRadius: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <strong>{item.batch}</strong>
                  <Badge variant={item.variant}>{item.days}</Badge>
                </div>
                <div style={{ color: 'var(--text2)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ChartPanel title="Platform health timeline — last 14 days" chart="ops-health" height={160} />
    </>
  );
}
