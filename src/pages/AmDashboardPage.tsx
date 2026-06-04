import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ClientAvatar } from '../components/ui/ClientAvatar';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { CLIENTS } from '../data/clients';
import { authColor, crmPillLabel, crmPillVariant, exportReport, scPillVariant } from './shared';

const AM_CLIENTS = CLIENTS.filter((c) => ['SHC', 'DPL', 'NKF', 'BHP', 'APL'].includes(c.code));

export function AmDashboardPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const followUp = useFollowUp();

  return (
    <>
      <div className="pghead">
        <div>
          <div className="pgtitle">My Accounts</div>
          <div className="pgsub">Amaka Eze · 6 assigned clients</div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/reports')}>
          📄 My Reports
        </Button>
      </div>

      <KCardGrid columns={4}>
        <KCard label="Active Clients" value="6" />
        <KCard label="Requiring Attention" value="2" trend="Credits low" trendType="dn" />
        <KCard label="Avg Auth Rate" value="95.7%" trend="↑ 1.1%" trendType="up" />
        <KCard label="Renewals (30d)" value="3" trend="SKU licences" trendType="neu" />
      </KCardGrid>

      <Card>
        <div className="ch">
          <div className="ct">My client portfolio</div>
          <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Portfolio Summary')}>
            ↓ Export
          </Button>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th>Client</th>
              <th>Products</th>
              <th>Auth Rate</th>
              <th>Credit Health</th>
              <th>Next Renewal</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {AM_CLIENTS.map((c) => {
              const crmVar = crmPillVariant(c.crm);
              const crmLbl = crmPillLabel(c.crm);
              const renewal =
                c.code === 'SHC'
                  ? 'Jan 2027'
                  : c.code === 'DPL' || c.code === 'APL'
                    ? 'Feb 2027'
                    : c.code === 'BHP'
                      ? 'Mar 2027'
                      : 'Jun 2026';
              return (
                <tr key={c.code} className="cl" onClick={() => navigate(`/clients/${c.code}`)}>
                  <td>
                    <ClientAvatar initials={c.ini} color={c.av} />
                  </td>
                  <td>
                    <strong>{c.name.replace(' Co. Ltd', '').replace(' FMCG', '').replace(' Products', '')}</strong>
                  </td>
                  <td>
                    <ProductPill variant={scPillVariant(c.scband)}>SC·{c.scband}</ProductPill>
                    {crmVar && crmLbl && <ProductPill variant={crmVar}>{crmLbl}</ProductPill>}
                  </td>
                  <td style={{ color: authColor(c.authRate), fontWeight: 600 }}>{c.authRate}</td>
                  <td>
                    <Badge variant={c.creditHealth.variant}>{c.creditHealth.label}</Badge>
                  </td>
                  <td>{renewal}</td>
                  <td>
                    <Badge variant={c.status === 'Attention' ? 'ba' : 'bg'}>{c.status}</Badge>
                  </td>
                  <td>
                    {c.code === 'NKF' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          followUp('NaturalKing FMCG', 'PIN credits critical at 8%.');
                        }}
                      >
                        Urgent
                      </Button>
                    ) : c.code === 'DPL' ? (
                      <Button
                        className="bacc"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          followUp('DankePharma Ltd', 'SMS credits at 12%.');
                        }}
                      >
                        Follow Up
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${c.code}`);
                        }}
                      >
                        View
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
