import { useNavigate } from 'react-router-dom';
import { OnboardingProgress } from '../patterns/ProgressBar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProductPill } from '../ui/ProductPill';
import type { OnboardingRow } from '../../data/onboarding';
import { useApp } from '../../context/AppContext';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useModal } from '../../context/ModalContext';

export function OnboardingTable({ rows }: { rows: OnboardingRow[] }) {
  const navigate = useNavigate();
  const followUp = useFollowUp();
  const { openModal } = useModal();
  const { openOnboardingAssign } = useApp();

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
            <th>Products</th>
            <th>Step</th>
            <th>Progress</th>
            <th>Blocker</th>
            <th>Assigned</th>
            <th>Started</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id || r.client}>
              <td>
                <strong>{r.client}</strong>
              </td>
              <td>
                <ProductPill variant={r.product}>{r.productLabel}</ProductPill>
              </td>
              <td>{r.step}</td>
              <td>
                <OnboardingProgress percent={r.progress} color={r.progressColor} />
              </td>
              <td style={{ fontSize: 12, color: r.blockerColor || 'var(--text3)' }}>{r.blocker}</td>
              <td>{r.assigned}</td>
              <td>{r.started}</td>
              <td>
                {r.action === 'followup' && (
                  <Button
                    className="bacc"
                    size="sm"
                    onClick={() =>
                      followUp(r.client, r.followUpMessage ?? r.blocker, r._id)
                    }
                  >
                    Follow Up
                  </Button>
                )}
                {r.action === 'view' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/clients/${r.viewClientCode ?? ''}`)}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
