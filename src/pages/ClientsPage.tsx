import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ClientAvatar } from '../components/ui/ClientAvatar';
import { ProductPill } from '../components/ui/ProductPill';
import { useFollowUp } from '../hooks/useFollowUp';
import { useModal } from '../context/ModalContext';
import { usePlatform } from '../context/PlatformContext';
import { authColor, crmPillLabel, crmPillVariant, scPillVariant } from './shared';

export function ClientsPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const followUp = useFollowUp();
  const { clients, loading, refreshClients } = usePlatform();
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
      const okProd = !prod || c.products.toLowerCase().includes(prod.toLowerCase().split(' ')[0]);
      const okStat = !stat || c.status.toLowerCase() === stat.toLowerCase();
      return okText && okProd && okStat;
    });
  }, [text, prod, stat, clients]);

  const openClient = (code: string) => navigate(`/clients/${code}`);

  if (loading && !clients.length) {
    return <div className="pghead"><div className="pgsub">Loading clients…</div></div>;
  }

  return (
    <>
      <div className="pghead">
        <div>
          <div className="pgtitle">Client Management</div>
          <div className="pgsub">All active and onboarding clients</div>
        </div>
        <Button className="bacc" size="sm" onClick={() => openModal('onboard')}>
          + Onboard New Client
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            className="inp"
            style={{ flex: 1, minWidth: 160 }}
            placeholder="Search by name, RC number, client code..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select className="inp" style={{ width: 160 }} value={prod} onChange={(e) => setProd(e.target.value)}>
            <option value="">All Products</option>
            <option value="SC">SartorChain Only</option>
            <option value="CRM">Has CRM</option>
            <option value="360">CRM 360</option>
            <option value="SNP">Sales Nav Plus</option>
            <option value="SN">Sales Navigator</option>
          </select>
          <select className="inp" style={{ width: 140 }} value={stat} onChange={(e) => setStat(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Attention">Attention</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th>Client</th>
              <th>RC Number</th>
              <th>Products Subscribed</th>
              <th>SKUs</th>
              <th>Batches</th>
              <th>Auth Rate</th>
              <th>Credit Health</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const crmVar = crmPillVariant(c.crm);
              const crmLbl = crmPillLabel(c.crm);
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
                    <ProductPill variant={scPillVariant(c.scband)}>SC·{c.scband}</ProductPill>
                    {crmVar && crmLbl && <ProductPill variant={crmVar}>{crmLbl}</ProductPill>}
                  </td>
                  <td>{c.skus}</td>
                  <td>{c.batches}</td>
                  <td style={{ color: authColor(c.authRate), fontWeight: 600 }}>{c.authRate}</td>
                  <td>
                    <Badge variant={c.creditHealth.variant}>{c.creditHealth.label}</Badge>
                  </td>
                  <td>
                    <Badge variant={c.status === 'Active' ? 'bg' : 'ba'}>{c.status}</Badge>
                  </td>
                  <td>
                    {c.code === 'NKF' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          followUp('NaturalKing FMCG', 'PIN credits critical.');
                        }}
                      >
                        Alert
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openClient(c.code);
                        }}
                      >
                        {c.status === 'Onboarding' ? 'View' : 'Manage'}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>
            No clients match your search.
          </div>
        )}
      </Card>
    </>
  );
}
