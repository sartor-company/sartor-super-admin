import { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { FormGroup } from '../components/ui/FormGroup';
import { TabBar } from '../components/ui/TabBar';
import { PageHeader, ToggleRow } from '../components/patterns';
import { SETTINGS_STAFF } from '../data/staff';
import { useOpenStaff } from '../hooks/useFollowUp';
import { useToast } from '../context/ToastContext';
import { useTabs } from '../hooks/useTabs';

type SettingsTab = 'general' | 'staff' | 'nafdac' | 'api';

export function SettingsPage() {
  const openStaff = useOpenStaff();
  const { showToast } = useToast();
  const { active, setActive, isActive } = useTabs<SettingsTab>('general');
  const [smsThreshold, setSmsThreshold] = useState(20);
  const [pinThreshold, setPinThreshold] = useState(20);

  const tabs = [
    { id: 'general' as const, label: 'General' },
    { id: 'staff' as const, label: 'Sartor Staff' },
    { id: 'nafdac' as const, label: 'NAFDAC Portal' },
    { id: 'api' as const, label: 'API & Webhooks' },
  ];

  return (
    <>
      <PageHeader title="Platform Settings" subtitle="System-wide configuration — Super Admin only" />

      <TabBar tabs={tabs} active={active} onChange={setActive} />

      {isActive('general') && (
        <>
          <Card>
            <div className="ct" style={{ marginBottom: 13 }}>
              Platform-wide defaults
            </div>
            <div className="fr2">
              <FormGroup label="Default Verification Domain">
                <input className="inp" value="https://verify.sartor.com" readOnly />
              </FormGroup>
              <FormGroup label="Subdomain Pattern (Growth)">
                <input className="inp" value="verify-{clientcode}.sartor.ng" readOnly />
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="Default PIN Format">
                <select className="inp" defaultValue="6">
                  <option>6-digit numeric</option>
                  <option>8-digit numeric</option>
                </select>
              </FormGroup>
              <FormGroup label="DORA Training SLA (days)">
                <input type="number" className="inp" defaultValue={3} />
              </FormGroup>
            </div>
            <Button variant="primary" size="sm" onClick={() => showToast('Platform settings saved.', 'success')}>
              Save Settings
            </Button>
          </Card>
          <Card>
            <div className="ct" style={{ marginBottom: 4 }}>
              Notification thresholds
            </div>
            <div className="twrap">
              <div>
                <div className="tlbl">Auto-alert at SMS credit threshold</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={smsThreshold}
                  onChange={(e) => setSmsThreshold(Number(e.target.value))}
                  className="inp"
                  style={{ width: 60, textAlign: 'center' }}
                />
                %
              </div>
            </div>
            <div className="twrap">
              <div>
                <div className="tlbl">Auto-alert at PIN credit threshold</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={pinThreshold}
                  onChange={(e) => setPinThreshold(Number(e.target.value))}
                  className="inp"
                  style={{ width: 60, textAlign: 'center' }}
                />
                %
              </div>
            </div>
            <ToggleRow
              label="P1/P2 internal alert to Platform Support"
              defaultOn
              messageOn="Alert setting updated."
              messageOff="Alert setting updated."
            />
            <div style={{ marginTop: 11 }}>
              <Button variant="primary" size="sm" onClick={() => showToast('Thresholds saved.', 'success')}>
                Save
              </Button>
            </div>
          </Card>
        </>
      )}

      {isActive('staff') && (
        <Card>
          <CardHeader
            title="Sartor Staff Accounts"
            action={
              <Button className="bacc" size="sm" onClick={() => openStaff(null)}>
                + Add Staff
              </Button>
            }
          />
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SETTINGS_STAFF.map((s) => (
                <tr key={s.email}>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>{s.email}</td>
                  <td>
                    {'roleStyle' in s && s.roleStyle ? (
                      <span className="badge" style={s.roleStyle}>
                        {s.role}
                      </span>
                    ) : (
                      <Badge variant={s.roleVariant!}>{s.role}</Badge>
                    )}
                  </td>
                  <td>
                    <Badge variant="bg">Active</Badge>
                  </td>
                  <td>{s.name === 'Chidi Ogu' ? 'Yesterday' : 'Today'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Button variant="secondary" size="sm" onClick={() => openStaff(s.name)}>
                        Edit
                      </Button>
                      {s.name !== 'Nwachukwu Confidence' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            showToast(`Reset sent${s.email === 'amaka@sartor.ng' ? ' to amaka@sartor.ng' : '.'}`, 'success')
                          }
                        >
                          Reset PW
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {isActive('nafdac') && (
        <>
          <div className="warn-b">
            ⚠ NAFDAC portal is Sprint 3, gated on signed MOU with NAFDAC PPMD. /api/regulatory/ scaffolded — returns 403 until MOU signed.
          </div>
          <Card>
            <div className="ct" style={{ marginBottom: 11 }}>
              NAFDAC Portal Status
            </div>
            <div className="srow">
              <span>MOU Status</span>
              <Badge variant="br">Not Signed</Badge>
            </div>
            <div className="srow">
              <span>API Namespace</span>
              <Badge variant="bg">Scaffolded — /api/regulatory/</Badge>
            </div>
            <div className="srow">
              <span>Auth Middleware</span>
              <Badge variant="bg">Built — Returns 403</Badge>
            </div>
            <div className="srow">
              <span>Portal URL</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>regulatory.sartor.ng (not live)</span>
            </div>
            <div className="srow">
              <span>Target Sprint</span>
              <Badge variant="bb">Sprint 3</Badge>
            </div>
          </Card>
        </>
      )}

      {isActive('api') && (
        <Card>
          <div className="ct" style={{ marginBottom: 11 }}>
            API & Webhook Configuration
          </div>
          <div className="srow">
            <span>API Version</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>v1</span>
          </div>
          <div className="srow">
            <span>Rate Limit</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>1,000 req/min per client</span>
          </div>
          <div className="srow">
            <span>Authentication</span>
            <Badge variant="bb">JWT Bearer</Badge>
          </div>
          <div className="srow">
            <span>Webhook Retries</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>3 × exponential backoff</span>
          </div>
        </Card>
      )}
    </>
  );
}
