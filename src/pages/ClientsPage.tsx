import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ClientAvatar } from '../components/ui/ClientAvatar';
import { Loader } from '../components/ui/Loader';
import { SubscriptionTierPills } from '../components/ui/SubscriptionTierPills';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { useActivateClient, clientProductsLabel } from '../hooks/useActivateClient';
import { useRoleGates } from '../hooks/useRoleGates';
import { authColor, clientSkuLeadsLabel, hasScDora } from '../utils/clientDisplay';

export function ClientsPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const followUp = useFollowUp();
  const { clients, loading } = usePlatform();
  const openActivate = useActivateClient();
  const { can } = useRoleGates();
  const canActivate = can('activate');
  const [text, setText] = useState('');
  const [prod, setProd] = useState('');
  const [stat, setStat] = useState('');

  const filtered = useMemo(() => {
    const q = text.toLowerCase();
    return clients.filter((c) => {
      const okText =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.rc.toLowerCase().includes(q);
      const okProd =
        !prod ||
        (c.productKeys || []).some((k) => k.includes(prod.replace('crm-', 'crm-'))) ||
        c.products.toLowerCase().includes(prod.toLowerCase().replace('-', ' '));
      const okStat =
        !stat ||
        (stat.toLowerCase() === 'pending'
          ? c.accountActivated === false || c.accountStatus === 'inactive'
          : c.status.toLowerCase() === stat.toLowerCase());
      return okText && okProd && okStat;
    });
  }, [text, prod, stat, clients]);

  const openClient = (code: string) => navigate(`/clients/${code}`);

  const needsAlert = (c: (typeof clients)[0]) =>
    c.status === 'Attention' ||
    c.creditHealth.variant === 'br' ||
    (c.creditHealth.variant === 'ba' && c.creditHealth.label.toLowerCase().includes('pin'));

  if (loading && !clients.length) {
    return <Loader label="Loading clients…" />;
  }

  return (
    <>
      <div className="pghead">
        <div>
          <div className="pgtitle">Client Management</div>
          <div className="pgsub">All active and onboarding clients</div>
        </div>
        {can('onboard') && (
          <Button className="bacc" size="sm" onClick={() => openModal('onboard')}>
            + Onboard New Client
          </Button>
        )}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            className="inp"
            style={{ flex: 1, minWidth: 160 }}
            placeholder="Search clients by name, RC number, contact..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select className="inp" style={{ width: 160 }} value={prod} onChange={(e) => setProd(e.target.value)}>
            <option value="">All Products</option>
            <option value="scdora">Sartor-Chain &amp; DORA AI</option>
            <option value="crm-field">Sartor CRM Field</option>
            <option value="crm-depot">Sartor CRM Depot</option>
            <option value="crm-360">Sartor CRM 360</option>
          </select>
          <select className="inp" style={{ width: 140 }} value={stat} onChange={(e) => setStat(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Pilot">Pilot</option>
            <option value="Attention">Attention</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th>Client</th>
              <th>RC Number</th>
              <th>Subscription</th>
              <th>SKUs / Leads</th>
              <th>Batches</th>
              <th>Auth Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const inactive = c.accountActivated === false || c.accountStatus === 'inactive';
              const showBatches = hasScDora(c);
              return (
                <tr key={c.code} className="cl crow" onClick={() => openClient(c.code)}>
                  <td>
                    <ClientAvatar initials={c.ini} color={c.av} />
                  </td>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.location}</div>
                  </td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{c.rc}</td>
                  <td>
                    <SubscriptionTierPills client={c} />
                  </td>
                  <td>{clientSkuLeadsLabel(c)}</td>
                  <td>{showBatches ? c.batches || 0 : '—'}</td>
                  <td style={{ color: authColor(c.authRate), fontWeight: 600 }}>{c.authRate}</td>
                  <td>
                    <Badge
                      variant={
                        inactive
                          ? 'bx'
                          : c.status === 'Active'
                            ? 'bg'
                            : c.status === 'Pilot'
                              ? 'ba'
                              : 'ba'
                      }
                    >
                      {inactive ? 'Pending' : c.status}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                      <Button variant="secondary" size="sm" onClick={() => openClient(c.code)}>
                        {inactive || c.status === 'Onboarding' || c.status === 'Pilot' ? 'View' : 'Manage'}
                      </Button>
                      {inactive && canActivate && c._id && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() =>
                            openActivate({
                              clientId: c._id!,
                              code: c.code,
                              name: c.name,
                              email: c.email || '',
                              products: clientProductsLabel(c),
                            })
                          }
                        >
                          Activate
                        </Button>
                      )}
                      {needsAlert(c) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => followUp(c.name, `${c.creditHealth.label} — review credits.`, c._id)}
                        >
                          Alert
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>
            No clients match your search or filters.
          </div>
        )}
      </Card>
    </>
  );
}
