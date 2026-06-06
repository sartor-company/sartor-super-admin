import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { MonoCell, PageHeader } from '../components/patterns';
import { usePlatform } from '../context/PlatformContext';
import type { SupportTicket } from '../data/supportTickets';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { exportReport } from '../utils/exportReport';

export function SupportPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { tickets } = usePlatform();
  const [query, setQuery] = useState('');

  const mapped = useMemo(
    (): SupportTicket[] =>
      tickets.map((t) => {
        const row = t as {
          ticketId?: string;
          _id?: string;
          clientName?: string;
          subject?: string;
          description?: string;
          priority?: string;
          assignedName?: string;
          status?: string;
          assignedTo?: string;
        };
        return {
          id: String(row.ticketId || row._id),
          client: String(row.clientName || '—'),
          type: String(row.subject || 'Support'),
          typeVariant: 'bb',
          desc: String(row.description || row.subject || ''),
          priority: row.priority === 'P1' ? 'Critical' : 'Normal',
          priorityVariant: row.priority === 'P1' ? 'br' : 'ba',
          assigned: String(row.assignedName || 'Unassigned'),
          age: '—',
          status: String(row.status || 'Open'),
          statusVariant: 'ba',
          action: row.assignedTo ? 'resolve' : 'assign',
        };
      }),
    [tickets],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return mapped.filter((t) => !q || `${t.id} ${t.client} ${t.desc}`.toLowerCase().includes(q));
  }, [query, mapped]);

  return (
    <>
      <PageHeader
        title="Support Dashboard"
        subtitle="Open tickets · Client lookup · Issue escalation"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Support Report')}>
              ↓ Export
            </Button>
            <Button className="bacc" size="sm" onClick={() => openModal('ticket')}>
              + Log Ticket
            </Button>
          </div>
        }
      />

      <KCardGrid columns={4}>
        <KCard label="Open Tickets" value="5" trend="2 escalated" trendType="dn" accent />
        <KCard label="Resolved Today" value="3" />
        <KCard label="Avg Resolution Time" value="4.2h" trend="↑ vs 5.8h" trendType="up" />
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/investigations')} role="presentation">
          <KCard label="P1 Investigations" value="4" trend="Click to review" trendType="dn" />
        </div>
      </KCardGrid>

      <Card>
        <CardHeader
          title="Open support tickets"
          action={
            <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Support Tickets')}>
              ↓ Export
            </Button>
          }
        />
        <input
          className="inp"
          style={{ width: 200, fontSize: 12, padding: '5px 10px', marginBottom: 12 }}
          placeholder="Search tickets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Client</th>
              <th>Type</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Assigned</th>
              <th>Age</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <MonoCell>{t.id}</MonoCell>
                <td>{t.client}</td>
                <td>
                  <Badge variant={t.typeVariant}>{t.type}</Badge>
                </td>
                <td style={{ fontSize: 12 }}>{t.desc}</td>
                <td>
                  <Badge variant={t.priorityVariant}>{t.priority}</Badge>
                </td>
                <td style={t.assigned === 'Unassigned' ? { color: 'var(--rt)' } : undefined}>{t.assigned}</td>
                <td style={{ fontWeight: 600, color: t.ageColor }}>{t.age}</td>
                <td>
                  <Badge variant={t.statusVariant}>{t.status}</Badge>
                </td>
                <td>
                  {t.action === 'escalate' && (
                    <Button variant="danger" size="sm" onClick={() => openModal('escalate')}>
                      Escalate
                    </Button>
                  )}
                  {t.action === 'assign' && (
                    <Button variant="primary" size="sm" onClick={() => openModal('assign')}>
                      Assign
                    </Button>
                  )}
                  {t.action === 'resolve' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="secondary" size="sm" onClick={() => showToast('Ticket viewed.')}>
                        View
                      </Button>
                      <Button variant="success" size="sm" onClick={() => showToast('Ticket resolved.', 'success')}>
                        Resolve
                      </Button>
                    </div>
                  )}
                  {t.action === 'followup' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => followUp('FreshNow Consumer', t.followUpMessage ?? '')}
                      >
                        Follow Up
                      </Button>
                      <Button variant="success" size="sm" onClick={() => showToast('Ticket resolved.', 'success')}>
                        Resolve
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
