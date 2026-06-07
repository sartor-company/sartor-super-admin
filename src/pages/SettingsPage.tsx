import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { FormGroup } from '../components/ui/FormGroup';
import { TabBar } from '../components/ui/TabBar';
import { PageHeader, ToggleRowCustom } from '../components/patterns';
import {
  platformRoleBadgeVariant,
  platformRoleLabel,
  tempPassword,
} from '../constants/platformStaff';
import { ROLES } from '../constants/roles';
import { useApp } from '../context/AppContext';
import { usePlatform } from '../context/PlatformContext';
import { useOpenStaff } from '../hooks/useFollowUp';
import { useToast } from '../context/ToastContext';
import { useTabs } from '../hooks/useTabs';
import { platformApi } from '../api/platform';
import { useAuthStore } from '../store/authStore';
import type { PlatformSettings, PlatformStaff, RoleId } from '../types';

type SettingsTab = 'general' | 'staff' | 'nafdac' | 'api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

function formatLastSeen(online?: string): string {
  if (!online) return '—';
  const d = new Date(online);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function emptyGeneralForm(): Pick<
  PlatformSettings,
  | 'defaultVerifyDomain'
  | 'subdomainPattern'
  | 'doraTrainingSlaDays'
  | 'defaultPinDigits'
  | 'smsCreditAlertPercent'
  | 'pinCreditAlertPercent'
  | 'p1p2AlertToSupport'
> {
  return {
    defaultVerifyDomain: '',
    subdomainPattern: '',
    doraTrainingSlaDays: 3,
    defaultPinDigits: 6,
    smsCreditAlertPercent: 20,
    pinCreditAlertPercent: 20,
    p1p2AlertToSupport: true,
  };
}

export function SettingsPage() {
  const openStaff = useOpenStaff();
  const { showToast } = useToast();
  const { role } = useApp();
  const currentUserId = useAuthStore((s) => s.user?._id);
  const { staff, settings, loading, refresh } = usePlatform();
  const { active, setActive, isActive } = useTabs<SettingsTab>('general');
  const [generalForm, setGeneralForm] = useState(emptyGeneralForm());
  const [nafdacForm, setNafdacForm] = useState({
    nafdacMouSigned: false,
    nafdacPortalUrl: '',
    nafdacApiNamespace: '',
  });
  const [apiForm, setApiForm] = useState({
    apiVersion: 'v1',
    rateLimitPerMinute: 1000,
    webhookRetryCount: 3,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setGeneralForm({
      defaultVerifyDomain: settings.defaultVerifyDomain ?? '',
      subdomainPattern: settings.subdomainPattern ?? '',
      doraTrainingSlaDays: settings.doraTrainingSlaDays ?? 3,
      defaultPinDigits: settings.defaultPinDigits ?? 6,
      smsCreditAlertPercent: settings.smsCreditAlertPercent ?? 20,
      pinCreditAlertPercent: settings.pinCreditAlertPercent ?? 20,
      p1p2AlertToSupport: settings.p1p2AlertToSupport ?? true,
    });
    setNafdacForm({
      nafdacMouSigned: settings.nafdacMouSigned ?? false,
      nafdacPortalUrl: settings.nafdacPortalUrl ?? '',
      nafdacApiNamespace: settings.nafdacApiNamespace ?? '',
    });
    setApiForm({
      apiVersion: settings.apiVersion ?? 'v1',
      rateLimitPerMinute: settings.rateLimitPerMinute ?? 1000,
      webhookRetryCount: settings.webhookRetryCount ?? 3,
    });
  }, [settings]);

  if (role !== 'super') {
    return <Navigate to={ROLES[role].defaultPath} replace />;
  }

  const saveSettings = async (body: Record<string, unknown>, message: string) => {
    setSaving(true);
    try {
      await platformApi.patchSettings(body);
      await refresh();
      showToast(message, 'success');
    } catch {
      showToast('Could not save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetStaffPassword = async (member: PlatformStaff) => {
    const pwd = tempPassword();
    try {
      await platformApi.patchStaff(member._id, { password: pwd });
      await refresh();
      showToast(`Password reset for ${member.email}. Temporary password: ${pwd}`, 'success');
    } catch {
      showToast('Could not reset password.', 'error');
    }
  };

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

      {loading && !settings && (
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Loading settings…</p>
      )}

      {isActive('general') && (
        <>
          <Card>
            <div className="ct" style={{ marginBottom: 13 }}>
              Platform-wide defaults
            </div>
            <div className="fr2">
              <FormGroup label="Default Verification Domain">
                <input
                  className="inp"
                  value={generalForm.defaultVerifyDomain}
                  onChange={(e) =>
                    setGeneralForm((f) => ({ ...f, defaultVerifyDomain: e.target.value }))
                  }
                />
              </FormGroup>
              <FormGroup label="Subdomain Pattern (Growth)">
                <input
                  className="inp"
                  value={generalForm.subdomainPattern}
                  onChange={(e) =>
                    setGeneralForm((f) => ({ ...f, subdomainPattern: e.target.value }))
                  }
                />
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="Default PIN Format">
                <select
                  className="inp"
                  value={generalForm.defaultPinDigits}
                  onChange={(e) =>
                    setGeneralForm((f) => ({
                      ...f,
                      defaultPinDigits: Number(e.target.value),
                    }))
                  }
                >
                  <option value={6}>6-digit numeric</option>
                  <option value={8}>8-digit numeric</option>
                </select>
              </FormGroup>
              <FormGroup label="DORA Training SLA (days)">
                <input
                  type="number"
                  className="inp"
                  min={1}
                  value={generalForm.doraTrainingSlaDays}
                  onChange={(e) =>
                    setGeneralForm((f) => ({
                      ...f,
                      doraTrainingSlaDays: Number(e.target.value),
                    }))
                  }
                />
              </FormGroup>
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={() =>
                saveSettings(
                  {
                    defaultVerifyDomain: generalForm.defaultVerifyDomain,
                    subdomainPattern: generalForm.subdomainPattern,
                    defaultPinDigits: generalForm.defaultPinDigits,
                    doraTrainingSlaDays: generalForm.doraTrainingSlaDays,
                  },
                  'Platform defaults saved.',
                )
              }
            >
              Save defaults
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
                  min={1}
                  max={100}
                  value={generalForm.smsCreditAlertPercent}
                  onChange={(e) =>
                    setGeneralForm((f) => ({
                      ...f,
                      smsCreditAlertPercent: Number(e.target.value),
                    }))
                  }
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
                  min={1}
                  max={100}
                  value={generalForm.pinCreditAlertPercent}
                  onChange={(e) =>
                    setGeneralForm((f) => ({
                      ...f,
                      pinCreditAlertPercent: Number(e.target.value),
                    }))
                  }
                  className="inp"
                  style={{ width: 60, textAlign: 'center' }}
                />
                %
              </div>
            </div>
            <ToggleRowCustom
              label="P1/P2 internal alert to Platform Support"
              control={
                <div
                  className={`toggle ${generalForm.p1p2AlertToSupport ? 'on' : ''}`}
                  role="switch"
                  aria-checked={generalForm.p1p2AlertToSupport}
                  tabIndex={0}
                  onClick={() =>
                    setGeneralForm((f) => ({
                      ...f,
                      p1p2AlertToSupport: !f.p1p2AlertToSupport,
                    }))
                  }
                />
              }
            />
            <div style={{ marginTop: 11 }}>
              <Button
                variant="primary"
                size="sm"
                disabled={saving}
                onClick={() =>
                  saveSettings(
                    {
                      smsCreditAlertPercent: generalForm.smsCreditAlertPercent,
                      pinCreditAlertPercent: generalForm.pinCreditAlertPercent,
                      p1p2AlertToSupport: generalForm.p1p2AlertToSupport,
                    },
                    'Notification thresholds saved.',
                  )
                }
              >
                Save thresholds
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
          {loading && staff.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Loading staff…</p>
          ) : staff.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No staff accounts yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const roleId = (s.platformRole || 'support') as RoleId;
                  const isSelf = s._id === currentUserId;
                  return (
                    <tr key={s._id}>
                      <td>
                        <strong>{s.fullName}</strong>
                      </td>
                      <td>{s.email}</td>
                      <td>
                        {roleId === 'super' ? (
                          <span
                            className="badge"
                            style={{ background: 'rgba(255,92,53,.15)', color: 'var(--accent)' }}
                          >
                            {platformRoleLabel(roleId)}
                          </span>
                        ) : (
                          <Badge variant={platformRoleBadgeVariant(roleId)}>
                            {platformRoleLabel(roleId)}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge variant={s.blocked ? 'br' : 'bg'}>{s.blocked ? 'Blocked' : 'Active'}</Badge>
                      </td>
                      <td>{formatLastSeen(s.online)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <Button variant="secondary" size="sm" onClick={() => openStaff(s._id)}>
                            Edit
                          </Button>
                          {!isSelf && (
                            <Button variant="secondary" size="sm" onClick={() => resetStaffPassword(s)}>
                              Reset PW
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {isActive('nafdac') && (
        <>
          {!nafdacForm.nafdacMouSigned && (
            <div className="warn-b">
              Regulatory portal access remains disabled until the NAFDAC MOU is marked signed below.
            </div>
          )}
          <Card>
            <div className="ct" style={{ marginBottom: 11 }}>
              NAFDAC Portal Status
            </div>
            <div className="srow">
              <span>MOU Status</span>
              <Badge variant={nafdacForm.nafdacMouSigned ? 'bg' : 'br'}>
                {nafdacForm.nafdacMouSigned ? 'Signed' : 'Not signed'}
              </Badge>
            </div>
            <div className="srow">
              <span>API Namespace</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                {nafdacForm.nafdacApiNamespace || '—'}
              </span>
            </div>
            <div className="srow">
              <span>Portal URL</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                {nafdacForm.nafdacPortalUrl || '—'}
                {!nafdacForm.nafdacMouSigned ? ' (not live)' : ''}
              </span>
            </div>
            <FormGroup label="Portal URL">
              <input
                className="inp"
                value={nafdacForm.nafdacPortalUrl}
                onChange={(e) =>
                  setNafdacForm((f) => ({ ...f, nafdacPortalUrl: e.target.value }))
                }
              />
            </FormGroup>
            <FormGroup label="API namespace">
              <input
                className="inp"
                value={nafdacForm.nafdacApiNamespace}
                onChange={(e) =>
                  setNafdacForm((f) => ({ ...f, nafdacApiNamespace: e.target.value }))
                }
              />
            </FormGroup>
            <ToggleRowCustom
              label="NAFDAC MOU signed"
              description="Enable when MOU with NAFDAC PPMD is executed"
              control={
                <div
                  className={`toggle ${nafdacForm.nafdacMouSigned ? 'on' : ''}`}
                  role="switch"
                  aria-checked={nafdacForm.nafdacMouSigned}
                  tabIndex={0}
                  onClick={() =>
                    setNafdacForm((f) => ({ ...f, nafdacMouSigned: !f.nafdacMouSigned }))
                  }
                />
              }
            />
            <div style={{ marginTop: 11 }}>
              <Button
                variant="primary"
                size="sm"
                disabled={saving}
                onClick={() =>
                  saveSettings(
                    {
                      nafdacMouSigned: nafdacForm.nafdacMouSigned,
                      nafdacPortalUrl: nafdacForm.nafdacPortalUrl,
                      nafdacApiNamespace: nafdacForm.nafdacApiNamespace,
                    },
                    'NAFDAC settings saved.',
                  )
                }
              >
                Save NAFDAC settings
              </Button>
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
            <span>API base URL (this console)</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>{API_BASE}</span>
          </div>
          <FormGroup label="API version">
            <input
              className="inp"
              value={apiForm.apiVersion}
              onChange={(e) => setApiForm((f) => ({ ...f, apiVersion: e.target.value }))}
            />
          </FormGroup>
          <FormGroup label="Rate limit (requests/min per client)">
            <input
              type="number"
              className="inp"
              min={100}
              value={apiForm.rateLimitPerMinute}
              onChange={(e) =>
                setApiForm((f) => ({ ...f, rateLimitPerMinute: Number(e.target.value) }))
              }
            />
          </FormGroup>
          <div className="srow">
            <span>Authentication</span>
            <Badge variant="bb">s-token header</Badge>
          </div>
          <FormGroup label="Webhook retry count">
            <input
              type="number"
              className="inp"
              min={0}
              max={10}
              value={apiForm.webhookRetryCount}
              onChange={(e) =>
                setApiForm((f) => ({ ...f, webhookRetryCount: Number(e.target.value) }))
              }
            />
          </FormGroup>
          <Button
            variant="primary"
            size="sm"
            disabled={saving}
            onClick={() =>
              saveSettings(
                {
                  apiVersion: apiForm.apiVersion,
                  rateLimitPerMinute: apiForm.rateLimitPerMinute,
                  webhookRetryCount: apiForm.webhookRetryCount,
                },
                'API settings saved.',
              )
            }
          >
            Save API settings
          </Button>
        </Card>
      )}
    </>
  );
}
