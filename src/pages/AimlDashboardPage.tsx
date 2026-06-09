import { useMemo } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { usePlatform } from '../context/PlatformContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import type { Client } from '../data/clients';
import type { DoraQueueRow } from '../types/dora';
import { exportReport } from './shared';

export function AimlDashboardPage() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const { doraStats, doraQueue, clients, loading } = usePlatform();

  const stats = doraStats as {
    total?: number;
    trained?: number;
    pending?: number;
    coverage?: string | number;
  } | null;
  const queue = doraQueue as DoraQueueRow[];
  const inTraining = queue.filter((q) => q.stage === 'training').length;
  const awaiting = queue.filter((q) => q.stage === 'awaiting').length;

  const clientRows = useMemo(() => {
    return (clients as Client[])
      .filter((c) => c.skus > 0 || c.batches > 0)
      .map((c) => ({
        name: c.name,
        code: c.code,
        models: c.skus,
        batches: c.batches,
        authRate: c.authRate,
        status: c.status,
      }));
  }, [clients]);

  return (
    <>
      <div className="pghead">
        <div>
          <div className="pgtitle">DORA AI Dashboard</div>
          <div className="pgsub">Model training & performance · Internal only</div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'DORA Performance')}>
          ↓ Export
        </Button>
      </div>

      {loading && !stats && (
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Loading DORA metrics…</p>
      )}

      <KCardGrid columns={4}>
        <KCard label="Awaiting Images" value={String(awaiting || stats?.pending || 0)} trend="Training queue" trendType="dn" accent />
        <KCard label="Models In Training" value={String(inTraining)} trend="From live queue" trendType="neu" />
        <KCard label="Trained Labels" value={String(stats?.trained ?? 0)} trend={`${stats?.total ?? 0} total labels`} trendType="up" />
        <KCard label="Platform Coverage" value={`${stats?.coverage ?? 0}%`} trend="Completed / total" trendType="up" />
      </KCardGrid>

      <Card>
        <div className="ch">
          <div className="ct">Client DORA footprint</div>
          <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Client DORA')}>
            ↓ Export
          </Button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
          SKUs and batches per client from live platform data.
        </div>
        {clientRows.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No client product data yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>SKUs</th>
                <th>Batches</th>
                <th>Auth Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clientRows.map((r) => (
                <tr key={r.code}>
                  <td>
                    <strong>{r.name}</strong>
                  </td>
                  <td>{r.models}</td>
                  <td>{r.batches}</td>
                  <td style={{ fontWeight: 600 }}>{r.authRate}</td>
                  <td>
                    <Badge variant={r.status === 'Attention' ? 'ba' : 'bg'}>{r.status}</Badge>
                  </td>
                  <td>
                    <Button variant="secondary" size="sm" onClick={() => showToast(`Client ${r.code} detail opened.`)}>
                      Detail
                    </Button>
                    {r.status === 'Attention' && (
                      <Button variant="danger" size="sm" onClick={() => openModal('model-review')}>
                        Review
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
