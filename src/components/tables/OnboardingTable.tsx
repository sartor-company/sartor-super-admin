import { useNavigate } from 'react-router-dom';
import { OnboardingProgress } from '../patterns/ProgressBar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProductPill } from '../ui/ProductPill';
import type { OnboardingRow } from '../../data/onboarding';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useModal } from '../../context/ModalContext';

export function OnboardingTable({ rows }: { rows: OnboardingRow[] }) {
  const navigate = useNavigate();
  const followUp = useFollowUp();
  const { openModal } = useModal();

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
            <tr key={r.client}>
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
              <td style={{ fontSize: 12, color: r.blockerColor }}>{r.blocker}</td>
              <td style={r.assignedColor ? { color: r.assignedColor } : undefined}>{r.assigned}</td>
              <td>{r.started}</td>
              <td>
                {r.action === 'followup' && (
                  <Button
                    className="bacc"
                    size="sm"
                    onClick={() => followUp(r.client, r.followUpMessage ?? '')}
                  >
                    Follow Up
                  </Button>
                )}
                {r.action === 'view' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/clients/${r.viewClientCode ?? 'SHC'}`)}
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
    </Card>
  );
}
