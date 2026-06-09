import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ClientAvatar } from '../components/ui/ClientAvatar';
import { KCard, KCardGrid } from '../components/ui/KCard';
import { ProductPill } from '../components/ui/ProductPill';
import type { Client } from '../data/clients';
import { usePlatform } from '../context/PlatformContext';
import { useFollowUp } from '../hooks/useFollowUp';
import { useToast } from '../context/ToastContext';
import { useAuthStore } from '../store/authStore';
import { authColor, crmPillLabel, crmPillVariant, exportReport, scPillVariant } from './shared';

export function AmDashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const user = useAuthStore((s) => s.user);
  const { clients, loading } = usePlatform();

  const portfolio = clients as Client[];

  const stats = useMemo(() => {
    const attention = portfolio.filter((c) => c.status === 'Attention').length;
    const rates = portfolio
      .map((c) => parseFloat(c.authRate))
      .filter((n) => !Number.isNaN(n));
    const avgAuth = rates.length
      ? `${(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1)}%`
      : '—';
    const renewals = portfolio.filter((c) => c.status === 'Active').length;
    return { attention, avgAuth, renewals };
  }, [portfolio]);

  return (
    <>
      <div className="pghead">
        <div>
          <div className="pgtitle">My Accounts</div>
          <div className="pgsub">
            {user?.fullName ?? 'Account Manager'} · {portfolio.length} assigned client
            {portfolio.length === 1 ? '' : 's'}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/reports')}>
          📄 My Reports
        </Button>
      </div>

      {loading && portfolio.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Loading portfolio…</p>
      )}

      <KCardGrid columns={4}>
        <KCard label="Active Clients" value={String(portfolio.length)} />
        <KCard label="Requiring Attention" value={String(stats.attention)} trend="Low credits / status" trendType="dn" />
        <KCard label="Avg Auth Rate" value={stats.avgAuth} trend="Portfolio average" trendType="up" />
        <KCard label="Active accounts" value={String(stats.renewals)} trend="Status Active" trendType="neu" />
      </KCardGrid>

      <Card>
        <div className="ch">
          <div className="ct">My client portfolio</div>
          <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Portfolio Summary')}>
            ↓ Export
          </Button>
        </div>
        {portfolio.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No clients assigned to your account yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>Client</th>
                <th>Products</th>
                <th>Auth Rate</th>
                <th>Credit Health</th>
                <th>Industry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((c) => {
                const crmVar = crmPillVariant(c.crm);
                const crmLbl = crmPillLabel(c.crm);
                const needsFollowUp = c.status === 'Attention';
                return (
                  <tr key={c.code} className="cl" onClick={() => navigate(`/clients/${c.code}`)}>
                    <td>
                      <ClientAvatar initials={c.ini} color={c.av} />
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      <ProductPill variant={scPillVariant(c.scband)}>SC·{c.scband}</ProductPill>
                      {crmVar && crmLbl && <ProductPill variant={crmVar}>{crmLbl}</ProductPill>}
                    </td>
                    <td style={{ color: authColor(c.authRate), fontWeight: 600 }}>{c.authRate}</td>
                    <td>
                      <Badge variant={c.creditHealth.variant}>{c.creditHealth.label}</Badge>
                    </td>
                    <td>{c.industry}</td>
                    <td>
                      <Badge variant={c.status === 'Attention' ? 'ba' : c.status === 'Onboarding' ? 'bb' : 'bg'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td>
                      {needsFollowUp ? (
                        <Button
                          className="bacc"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            followUp(c.name, `${c.creditHealth.label} — please review credits.`, c._id);
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
        )}
      </Card>
    </>
  );
}
