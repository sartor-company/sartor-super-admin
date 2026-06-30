import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ClientAvatar } from '../components/ui/ClientAvatar';
import { KCard, KCardGrid } from '../components/ui/KCard';
import type { Client } from '../data/clients';
import { usePlatform } from '../context/PlatformContext';
import { useFollowUp } from '../hooks/useFollowUp';
import { useToast } from '../context/ToastContext';
import { useAuthStore } from '../store/authStore';
import { amTierLabel, authColor, clientsForAccountManager } from '../utils/clientDisplay';

export function AmDashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const followUp = useFollowUp();
  const user = useAuthStore((s) => s.user);
  const { clients, loading } = usePlatform();

  const portfolio = useMemo(
    () => clientsForAccountManager(clients as Client[], user?.fullName),
    [clients, user?.fullName],
  );

  const stats = useMemo(() => {
    const attention = portfolio.filter(
      (c) =>
        c.status === 'Attention' ||
        c.creditHealth.variant === 'br' ||
        c.creditHealth.variant === 'ba',
    ).length;
    const rates = portfolio
      .map((c) => parseFloat(c.authRate))
      .filter((n) => !Number.isNaN(n));
    const avgAuth = rates.length
      ? `${(rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1)}%`
      : '—';
    const renewals = portfolio.filter((c) => {
      if (!c.nextRenewalAt) return false;
      const diff = (c.nextRenewalAt - Date.now()) / 86400000;
      return diff >= 0 && diff <= 30;
    }).length;
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
      </div>

      {loading && portfolio.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Loading portfolio…</p>
      )}

      <KCardGrid columns={4}>
        <KCard label="My Active Clients" value={String(portfolio.length)} />
        <KCard
          label="Requiring Attention"
          value={String(stats.attention)}
          trend="Credits low"
          trendType="dn"
          valueStyle={stats.attention > 0 ? { color: 'var(--at)' } : undefined}
        />
        <KCard label="Avg Auth Rate" value={stats.avgAuth} trend="Portfolio average" trendType="up" />
        <KCard label="Open Renewals (30d)" value={String(stats.renewals)} trend="SKU licences" trendType="neu" />
      </KCardGrid>

      <Card>
        <div className="ch">
          <div className="ct">My client portfolio</div>
        </div>
        {portfolio.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No clients assigned to your account yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>Client</th>
                <th>Tier</th>
                <th>Auth Rate</th>
                <th>Credit Health</th>
                <th>Next Renewal</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((c) => {
                const needsFollowUp =
                  c.status === 'Attention' ||
                  c.creditHealth.variant === 'br' ||
                  (c.creditHealth.variant === 'ba' && c.creditHealth.label.toLowerCase().includes('sms'));
                const urgent =
                  c.creditHealth.variant === 'br' ||
                  (c.creditHealth.label.toLowerCase().includes('pin') && c.creditHealth.variant === 'ba');
                return (
                  <tr key={c.code} className="cl" onClick={() => navigate(`/clients/${c.code}`)}>
                    <td>
                      <ClientAvatar initials={c.ini} color={c.av} />
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {c.location?.split('·')[0]?.trim() || c.location} · {c.skus} SKUs
                      </div>
                    </td>
                    <td>
                      <Badge variant="bgold">{amTierLabel(c)}</Badge>
                    </td>
                    <td style={{ color: authColor(c.authRate), fontWeight: 600 }}>{c.authRate}</td>
                    <td>
                      <Badge variant={c.creditHealth.variant}>{c.creditHealth.label}</Badge>
                    </td>
                    <td>{c.nextRenewal ?? '—'}</td>
                    <td>
                      <Badge variant={c.status === 'Attention' ? 'ba' : c.status === 'Onboarding' ? 'bb' : 'bg'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td>
                      {urgent ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast('Flagged as urgent.', 'success');
                          }}
                        >
                          Urgent
                        </Button>
                      ) : needsFollowUp ? (
                        <Button
                          className="bacc"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            followUp(c.name, `${c.creditHealth.label} — please review.`, c._id);
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
