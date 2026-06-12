import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { MonoCell, PageHeader } from '../components/patterns';
import { useApp } from '../context/AppContext';
import { usePlatform } from '../context/PlatformContext';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { exportReport } from '../utils/exportReport';
import { platformApi } from '../api/platform';

type ApiTicket = {
  _id?: string;
  ticketId?: string;
  id?: string;
  clientName?: string;
  client?: string;
  subject?: string;
  type?: string;
  description?: string;
  desc?: string;
  priority?: string;
  priorityLabel?: string;
  priorityVariant?: 'br' | 'ba';
  assignedName?: string;
  assigned?: string;
  assignedTo?: string;
  status?: string;
  statusVariant?: 'ba' | 'br';
  age?: string;
  ageColor?: string;
  action?: string;
  admin?: string;
};

export function SupportPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const { openTicketAssign, openTicketEscalate, openTicketView } = useApp();
  const { tickets, investigations, refresh } = usePlatform();
  const [query, setQuery] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const rows = tickets as ApiTicket[];

  const ticketStats = useMemo(() => {
    const open = rows.filter((t) => ['Open', 'In Progress'].includes(String(t.status || '')));
    const p1 = open.filter((t) => t.priority === 'P1').length;
    return { open: open.length, p1 };
  }, [rows]);

  const openInvestigations = useMemo(
    () => investigations.filter((i) => i.status !== 'Closed').length,
    [investigations],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((t) => {
      const id = String(t.ticketId || t.id || t._id || '');
      const client = String(t.clientName || t.client || '');
      const desc = String(t.description || t.desc || '');
      return !q || `${id} ${client} ${desc}`.toLowerCase().includes(q);
    });
  }, [query, rows]);

  const openTicket = (t: ApiTicket) => {
    const id = String(t.ticketId || t.id || '');
    openTicketView({
      id,
      _id: t._id ? String(t._id) : id,
      client: String(t.clientName || t.client || '—'),
      subject: t.subject || t.type,
      description: String(t.description || t.desc || ''),
      priority: t.priority,
      status: t.status,
      assigned: t.assignedName || t.assigned,
      assignedTo: t.assignedTo ? String(t.assignedTo) : undefined,
      escalated: (t as { escalated?: boolean }).escalated,
    });
    openModal('ticket-detail');
  };

  const resolveTicket = async (t: ApiTicket) => {
    const patchId = t._id ? String(t._id) : String(t.ticketId || t.id);
    setResolvingId(patchId);
    try {
      await platformApi.patchTicket(patchId, { status: 'Resolved' });
      await refresh();
      showToast('Ticket resolved.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not resolve ticket.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

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
        <KCard label="Open Tickets" value={String(ticketStats.open)} trend={`${ticketStats.p1} P1`} trendType="dn" accent />
        <KCard label="Total Tickets" value={String(rows.length)} trend="All time" trendType="neu" />
        <KCard label="Resolved / Closed" value={String(rows.length - ticketStats.open)} trend="Live" trendType="up" />
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/investigations')} role="presentation">
          <KCard label="Open Investigations" value={String(openInvestigations)} trend="Click to review" trendType="dn" />
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text3)' }}>
                  No tickets found.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const id = String(t.ticketId || t.id || t._id);
                const patchId = t._id ? String(t._id) : id;
                const assigned = String(t.assignedName || t.assigned || 'Unassigned');
                const priority = t.priorityLabel || (t.priority === 'P1' ? 'Critical' : 'Normal');
                const priorityVariant = t.priority === 'P1' ? 'br' : 'ba';
                const action = t.action || (t.assignedTo ? 'resolve' : 'assign');

                return (
                  <tr key={id}>
                    <MonoCell>{id}</MonoCell>
                    <td>{t.clientName || t.client}</td>
                    <td>
                      <Badge variant="bb">{t.type || t.subject || 'Support'}</Badge>
                    </td>
                    <td style={{ fontSize: 12 }}>{t.description || t.desc}</td>
                    <td>
                      <Badge variant={priorityVariant}>{priority}</Badge>
                    </td>
                    <td style={assigned === 'Unassigned' ? { color: 'var(--rt)' } : undefined}>{assigned}</td>
                    <td style={{ fontWeight: 600, color: t.ageColor }}>{t.age || '—'}</td>
                    <td>
                      <Badge variant={t.statusVariant || 'ba'}>{t.status || 'Open'}</Badge>
                    </td>
                    <td>
                      {action === 'escalate' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            openTicketEscalate(patchId);
                            openModal('escalate');
                          }}
                        >
                          Escalate
                        </Button>
                      )}
                      {action === 'assign' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            openTicketAssign(patchId);
                            openModal('assign');
                          }}
                        >
                          Assign
                        </Button>
                      )}
                      {action === 'resolve' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button variant="secondary" size="sm" onClick={() => openTicket(t)}>
                            View
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            disabled={resolvingId === patchId}
                            onClick={() => resolveTicket(t)}
                          >
                            {resolvingId === patchId ? '…' : 'Resolve'}
                          </Button>
                        </div>
                      )}
                      {action === 'followup' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              followUp(
                                String(t.clientName || t.client),
                                String(t.description || t.desc || ''),
                                t.admin ? String(t.admin) : undefined,
                              )
                            }
                          >
                            Follow Up
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            disabled={resolvingId === patchId}
                            onClick={() => resolveTicket(t)}
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
