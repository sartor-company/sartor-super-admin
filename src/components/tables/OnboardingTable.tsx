import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { OnboardingProgress } from '../patterns/ProgressBar';
import { ProductPill } from '../ui/ProductPill';
import type { OnboardingRow } from '../../data/onboarding';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useModal } from '../../context/ModalContext';

function stickerCell(r: OnboardingRow) {
  if (!r.stickerDesignRequired || r.stickerDesignStatus === 'na') {
    return <span style={{ fontSize: 11, color: 'var(--text3)' }}>N/A (CRM only)</span>;
  }
  if (r.stickerDesignStatus === 'approved') {
    return (
      <Badge variant="bg" style={{ fontSize: 10 }}>
        Approved
      </Badge>
    );
  }
  if (r.action === 'sticker' || r.stickerCanFinalize) {
    return null;
  }
  return (
    <Badge variant={r.stickerDesignStatus === 'pending' ? 'ba' : 'bx'} style={{ fontSize: 10 }}>
      {r.stickerDesignLabel || 'Pending'}
    </Badge>
  );
}

export function OnboardingTable({ rows }: { rows: OnboardingRow[] }) {
  const navigate = useNavigate();
  const followUp = useFollowUp();
  const { openModal } = useModal();
  const { openOnboardingAssign, openStickerDesign } = useApp();

  if (!rows.length) {
    return (
      <Card>
        <p style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          No clients in onboarding. Start a new onboarding to add one.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Tier</th>
            <th>Step</th>
            <th>Progress</th>
            <th>Sticker Design</th>
            <th>Blocker</th>
            <th>Assigned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id || r.client}>
              <td>
                <strong>{r.client}</strong>
                {(r.location || r.industry) && (
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {[r.location?.split(' · ')[0] || r.location, r.industry].filter(Boolean).join(' · ')}
                  </div>
                )}
              </td>
              <td>
                <ProductPill variant={r.tierVariant || r.product}>{r.tierLabel || r.productLabel}</ProductPill>
              </td>
              <td style={{ fontWeight: 500 }}>{r.stepDetail || r.step}</td>
              <td>
                <OnboardingProgress percent={r.progress} color={r.progressColor} />
              </td>
              <td>
                {r.action === 'sticker' ? (
                  <Button
                    className="bacc"
                    size="sm"
                    onClick={() => {
                      openStickerDesign({
                        adminId: r._id!,
                        clientName: r.client,
                        clientCode: r.viewClientCode,
                      });
                      openModal('sticker-design');
                    }}
                  >
                    Finalize Design
                  </Button>
                ) : (
                  stickerCell(r)
                )}
              </td>
              <td style={{ fontSize: 12, color: r.blockerColor || 'var(--text3)' }}>{r.blocker}</td>
              <td style={{ color: r.assignedColor }}>{r.assigned}</td>
              <td>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {r.action === 'followup' && (
                    <Button
                      className="bacc"
                      size="sm"
                      onClick={() => followUp(r.client, r.followUpMessage ?? r.blocker, r._id)}
                    >
                      Follow Up
                    </Button>
                  )}
                  {(r.action === 'view' || r.action === 'sticker') && r.viewClientCode && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/clients/${r.viewClientCode}`)}
                    >
                      View
                    </Button>
                  )}
                  {r.action === 'assign' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        openOnboardingAssign(r._id ?? null);
                        openModal('assign');
                      }}
                    >
                      Assign
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
