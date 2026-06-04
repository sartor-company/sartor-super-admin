import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { MonoCell } from '../patterns/MonoCell';
import { INVESTIGATIONS, severityBadge, type InvestigationRow } from '../../data/investigations';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';

export function InvestigationsTable({ rows = INVESTIGATIONS }: { rows?: InvestigationRow[] }) {
  const { openInvestigation } = useApp();
  const { openModal } = useModal();

  const openRow = (row: InvestigationRow) => {
    openInvestigation({
      id: row.id,
      client: row.client,
      batch: row.batch,
      severity: row.severity,
      desc: row.desc,
    });
    openModal('investigation');
  };

  return (
    <Card style={{ marginBottom: 0 }}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Batch</th>
            <th>Severity</th>
            <th>Description</th>
            <th>Assigned</th>
            <th>Opened</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const sev = severityBadge(row.severity);
            return (
              <tr
                key={row.id}
                className="cl"
                onClick={() => openRow(row)}
                style={{ cursor: 'pointer' }}
              >
                <MonoCell>{row.id}</MonoCell>
                <td>{row.clientShort}</td>
                <MonoCell>{row.batch}</MonoCell>
                <td>
                  <Badge variant={sev.variant}>{sev.label}</Badge>
                </td>
                <td style={{ fontSize: 12 }}>{row.description}</td>
                <td>{row.assigned}</td>
                <td>{row.opened}</td>
                <td>
                  <Badge variant={row.statusVariant}>{row.status}</Badge>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {row.action === 'assign' ? (
                    <Button variant="danger" size="sm" onClick={() => openModal('assign')}>
                      Assign
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openRow(row)}
                    >
                      Review
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
