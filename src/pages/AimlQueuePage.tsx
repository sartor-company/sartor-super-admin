import { useMemo } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TabBar } from '../components/ui/TabBar';
import { InfoBanner, MonoCell, PageHeader } from '../components/patterns';
import { useApp } from '../context/AppContext';
import { usePlatform } from '../context/PlatformContext';
import { platformApi } from '../api/platform';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { useTabs } from '../hooks/useTabs';
import type { DoraQueueRow } from '../types/dora';

type QueueTab = 'wait' | 'train' | 'review';

export function AimlQueuePage() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { openDoraLabel } = useApp();
  const { doraQueue, loading, refresh } = usePlatform();
  const { active, setActive, isActive } = useTabs<QueueTab>('wait');

  const queue = doraQueue as DoraQueueRow[];

  const awaiting = useMemo(() => queue.filter((q) => q.stage === 'awaiting'), [queue]);
  const training = useMemo(() => queue.filter((q) => q.stage === 'training'), [queue]);
  const review = useMemo(() => queue.filter((q) => q.stage === 'review'), [queue]);

  const tabs = [
    { id: 'wait' as const, label: `Awaiting Images (${awaiting.length})` },
    { id: 'train' as const, label: `In Training (${training.length})` },
    { id: 'review' as const, label: `Review Required (${review.length})` },
  ];

  const openLabel = (row: DoraQueueRow) => {
    openDoraLabel({
      _id: row._id,
      batch: row.batch,
      client: row.client,
      adminId: row.adminId,
    });
  };

  const retryTraining = async (row: DoraQueueRow) => {
    try {
      await platformApi.patchDoraLabel(row._id, { status: 'training', markUploaded: true });
      await refresh();
      showToast(`${row.batch} marked for re-training.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not retry training.', 'error');
    }
  };

  const renderEmpty = (msg: string) => (
    <p style={{ color: 'var(--text3)', fontSize: 13 }}>{msg}</p>
  );

  return (
    <>
      <PageHeader title="Training Queue" subtitle="All batches awaiting images or in training" />

      {loading && queue.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Loading queue…</p>
      )}

      <TabBar tabs={tabs} active={active} onChange={setActive} />

      {isActive('wait') && (
        <>
          <Card>
            {awaiting.length === 0 ? (
              renderEmpty('No batches awaiting images.')
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Client</th>
                    <th>Product</th>
                    <th>Label Type</th>
                    <th>Images</th>
                    <th>Waiting</th>
                    <th>SLA</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {awaiting.map((row) => (
                    <tr key={row._id}>
                      <MonoCell>{row.batch}</MonoCell>
                      <td>{row.client}</td>
                      <td>{row.product}</td>
                      <td>{row.labelType}</td>
                      <td style={{ color: 'var(--rt)' }}>{row.images}</td>
                      <td style={{ fontWeight: 600, color: row.slaVariant === 'br' ? 'var(--rt)' : undefined }}>
                        {row.waiting}
                      </td>
                      <td>
                        <Badge variant={row.slaVariant}>{row.sla}</Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <Button
                            className="bacc"
                            size="sm"
                            onClick={() => {
                              openLabel(row);
                              openModal('upload-images');
                            }}
                          >
                            Upload
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              followUp(
                                row.client,
                                `${row.batch} reference images required (${row.waiting}).`,
                                row.adminId,
                              )
                            }
                          >
                            Chase
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <InfoBanner>
            ℹ <strong>Upload for Client:</strong> AI/ML team may upload on behalf of client where physical samples were provided. All uploads are logged.
          </InfoBanner>
        </>
      )}

      {isActive('train') && (
        <Card>
          {training.length === 0 ? (
            renderEmpty('No models currently in training.')
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Client</th>
                  <th>Product</th>
                  <th>Waiting</th>
                  <th>SLA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {training.map((row) => (
                  <tr key={row._id}>
                    <MonoCell>{row.batch}</MonoCell>
                    <td>{row.client}</td>
                    <td>{row.product}</td>
                    <td>{row.waiting}</td>
                    <td>
                      <Badge variant={row.slaVariant}>{row.sla}</Badge>
                    </td>
                    <td>
                      <Badge variant="bp">{row.status || 'Training'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {isActive('review') && (
        <>
          <InfoBanner>
            ℹ Models flagged for review — failed training or SLA breach.
          </InfoBanner>
          <Card>
            {review.length === 0 ? (
              renderEmpty('No batches require review.')
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Client</th>
                    <th>Product</th>
                    <th>Waiting</th>
                    <th>Issue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {review.map((row) => (
                    <tr key={row._id}>
                      <MonoCell>{row.batch}</MonoCell>
                      <td>{row.client}</td>
                      <td>{row.product}</td>
                      <td>{row.waiting}</td>
                      <td style={{ fontSize: 12, color: 'var(--rt)' }}>
                        {row.status === 'failed' ? 'Training failed' : 'SLA breached'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <Button variant="success" size="sm" onClick={() => retryTraining(row)}>
                            Retry
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              openLabel(row);
                              openModal('model-review');
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </>
  );
}
