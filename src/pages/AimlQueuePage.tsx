import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TabBar } from '../components/ui/TabBar';
import { InfoBanner, MonoCell, PageHeader, ProgressCell } from '../components/patterns';
import { usePlatform } from '../context/PlatformContext';
import { QUEUE_REVIEW, QUEUE_TRAINING } from '../data/aimlQueue';
import type { QueueAwaitingRow } from '../data/aimlQueue';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { useTabs } from '../hooks/useTabs';

type QueueTab = 'wait' | 'train' | 'review';

export function AimlQueuePage() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { doraQueue } = usePlatform();
  const { active, setActive, isActive } = useTabs<QueueTab>('wait');
  const awaiting = doraQueue as unknown as QueueAwaitingRow[];

  const tabs = [
    { id: 'wait' as const, label: `Awaiting Images (${awaiting.length})` },
    { id: 'train' as const, label: 'In Training (3)' },
    { id: 'review' as const, label: 'Review Required (2)' },
  ];

  return (
    <>
      <PageHeader title="Training Queue" subtitle="All batches awaiting images or in training" />

      <TabBar tabs={tabs} active={active} onChange={setActive} />

      {isActive('wait') && (
        <>
          <Card>
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
                  <tr key={row.batch}>
                    <MonoCell>{row.batch}</MonoCell>
                    <td>{row.client}</td>
                    <td>{row.product}</td>
                    <td>{row.labelType}</td>
                    <td style={{ color: 'var(--rt)' }}>{row.images}</td>
                    <td style={{ color: row.waitingColor, fontWeight: 600 }}>{row.waiting}</td>
                    <td>
                      <Badge variant={row.slaVariant}>{row.sla}</Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {row.batch !== 'BATCH-SH-041' && (
                          <Button className="bacc" size="sm" onClick={() => openModal('upload-images')}>
                            Upload
                          </Button>
                        )}
                        <Button variant="secondary" size="sm" onClick={() => followUp(row.clientFollowUp, row.followUpMessage)}>
                          {row.batch === 'BATCH-SH-041' ? 'Remind' : 'Chase'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <InfoBanner>
            ℹ <strong>Upload for Client:</strong> AI/ML team may upload on behalf of client where physical samples were provided. All uploads are logged.
          </InfoBanner>
        </>
      )}

      {isActive('train') && (
        <Card>
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Client</th>
                <th>Product</th>
                <th>Progress</th>
                <th>Started</th>
                <th>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {QUEUE_TRAINING.map((row) => (
                <tr key={row.batch}>
                  <MonoCell>{row.batch}</MonoCell>
                  <td>{row.client}</td>
                  <td>{row.product}</td>
                  <td>
                    <ProgressCell
                      percent={row.progress}
                      color={row.progressColor ?? 'var(--purple)'}
                    />
                  </td>
                  <td>{row.started}</td>
                  <td>{row.eta}</td>
                  <td>
                    <Badge variant={row.statusVariant ?? 'bp'}>{row.status ?? 'Training'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {isActive('review') && (
        <>
          <InfoBanner>
            ℹ Models completed training below 70-point acceptance threshold. Review and approve or request re-submission.
          </InfoBanner>
          <Card>
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Client</th>
                  <th>Product</th>
                  <th>F-Score</th>
                  <th>Issue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {QUEUE_REVIEW.map((row) => (
                  <tr key={row.batch}>
                    <MonoCell>{row.batch}</MonoCell>
                    <td>{row.client}</td>
                    <td>{row.product}</td>
                    <MonoCell bold color="var(--rt)">
                      {row.score}
                    </MonoCell>
                    <td style={{ fontSize: 12, color: row.issueColor }}>{row.issue}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Approve ${row.batch} at F-Score ${row.score}?`)) {
                              showToast(row.batch === 'BATCH-NK-014' ? 'Model approved and activated.' : 'Model approved.', 'success');
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => openModal('model-review')}>
                          Resubmit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
