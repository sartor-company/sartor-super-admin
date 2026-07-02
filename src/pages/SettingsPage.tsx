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
import { BankAccountModal } from '../modals/BankAccountModal';
import type {
  BankAccount,
  PlatformSettings,
  PlatformStaff,
  RoleId,
} from '../types';

function bankBadgeVariant(currency: string): 'bg' | 'bb' | 'bp' | 'bn' {
  if (currency === 'NGN') return 'bg';
  if (currency === 'USD') return 'bb';
  if (currency === 'GBP') return 'bp';
  return 'bn';
}

type SettingsTab = 'general' | 'staff' | 'nafdac' | 'api';

function emptyGeneralForm(): Pick<
  PlatformSettings,
  | 'defaultVerifyDomain'
  | 'subdomainPattern'
  | 'doraTrainingSlaDays'
  | 'defaultPinDigits'
  | 'smsCreditAlertPercent'
  | 'pinCreditAlertPercent'
  | 'p1p2AlertToSupport'
  | 'aimlCanTriggerPin'
> {
  return {
    defaultVerifyDomain: '',
    subdomainPattern: '',
    doraTrainingSlaDays: 3,
    defaultPinDigits: 10,
    smsCreditAlertPercent: 20,
    pinCreditAlertPercent: 20,
    p1p2AlertToSupport: true,
    aimlCanTriggerPin: true,
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
  const [apiForm, setApiForm] = useState({
    apiVersion: 'v1',
    rateLimitPerMinute: 1000,
    webhookRetryCount: 3,
  });
  const [saving, setSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [rateForm, setRateForm] = useState({ usd: 1580, gbp: 2010 });
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankSaving, setBankSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setBankAccounts(settings.bankAccounts ?? []);
    setRateForm({
      usd: settings.exchangeRates?.usd ?? 1580,
      gbp: settings.exchangeRates?.gbp ?? 2010,
    });
    setGeneralForm({
      defaultVerifyDomain: settings.defaultVerifyDomain ?? '',
      subdomainPattern: settings.subdomainPattern ?? '',
      doraTrainingSlaDays: settings.doraTrainingSlaDays ?? 3,
      defaultPinDigits: settings.defaultPinDigits === 12 ? 12 : 10,
      smsCreditAlertPercent: settings.smsCreditAlertPercent ?? 20,
      pinCreditAlertPercent: settings.pinCreditAlertPercent ?? 20,
    p1p2AlertToSupport: settings.p1p2AlertToSupport ?? true,
    aimlCanTriggerPin: settings.aimlCanTriggerPin !== false,
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

  const persistBankAccounts = async (next: BankAccount[]) => {
    setBankSaving(true);
    try {
      await platformApi.patchSettings({ bankAccounts: next });
      await refresh();
      setBankAccounts(next);
      showToast('Bank accounts updated.', 'success');
      setBankModalOpen(false);
      setEditingBank(null);
    } catch {
      showToast('Could not save bank account.', 'error');
    } finally {
      setBankSaving(false);
    }
  };

  const saveBankAccount = (account: BankAccount) => {
    let next: BankAccount[];
    if (account._id) {
      next = bankAccounts.map((a) => (a._id === account._id ? account : a));
    } else {
      next = [...bankAccounts, account];
    }
    // Only one Primary allowed
    if (account.status === 'Primary') {
      next = next.map((a) =>
        a === account || a._id === account._id
          ? a
          : a.status === 'Primary'
            ? { ...a, status: 'Active' }
            : a,
      );
    }
    void persistBankAccounts(next);
  };

  const deleteBankAccount = (account: BankAccount) => {
    const next = bankAccounts.filter((a) =>
      account._id ? a._id !== account._id : a !== account,
    );
    void persistBankAccounts(next);
  };

  const saveRates = () => {
    void saveSettings(
      { exchangeRates: { usd: Number(rateForm.usd), gbp: Number(rateForm.gbp) } },
      'Exchange rates saved.',
    );
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
          <Card style={{ marginBottom: 12 }}>
            <div className="ct" style={{ marginBottom: 13 }}>
              Platform-wide defaults
            </div>
            <div className="fr2">
              <FormGroup label="Default Verification Domain (Starter)">
                <input
                  className="inp"
                  readOnly
                  value={
                    generalForm.defaultVerifyDomain ||
                    'https://verify.dorascan.ai/{client_code}/{order_token}'
                  }
                />
              </FormGroup>
              <FormGroup label="Subdomain Pattern (Growth)">
                <input
                  className="inp"
                  readOnly
                  value={generalForm.subdomainPattern || 'verify-{clientname}.dorascan.ai'}
                />
              </FormGroup>
            </div>
            <div className="fr2">
              <FormGroup label="Default QR URL Mode">
                <input className="inp" readOnly value="STATIC_PORTAL" />
              </FormGroup>
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
                  <option value={10}>10-digit alphanumeric</option>
                  <option value={12}>12-digit alphanumeric</option>
                </select>
              </FormGroup>
            </div>
            <FormGroup label="DORA Training SLA (days)">
              <input
                type="number"
                className="inp"
                min={1}
                style={{ maxWidth: 120 }}
                value={generalForm.doraTrainingSlaDays}
                onChange={(e) =>
                  setGeneralForm((f) => ({
                    ...f,
                    doraTrainingSlaDays: Number(e.target.value),
                  }))
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
                    defaultPinDigits: generalForm.defaultPinDigits,
                    doraTrainingSlaDays: generalForm.doraTrainingSlaDays,
                  },
                  'Platform defaults saved.',
                )
              }
            >
              Save
            </Button>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <div className="ct" style={{ marginBottom: 4 }}>
              Global notification thresholds
            </div>
            <div className="twrap">
              <div>
                <div className="tlbl">Auto-alert clients at SMS credit threshold</div>
                <div className="tdesc">Send auto-notification to Account Owner when SMS credits drop below</div>
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
                <div className="tlbl">Auto-alert clients at PIN credit threshold</div>
                <div className="tdesc">Send auto-notification to Account Owner when PIN credits drop below</div>
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
              label="P1/P2 investigation Sartor alert"
              description="Notify internal Platform Support team on every P1 or P2 investigation"
              control={
                <div
                  className={`toggle ${generalForm.p1p2AlertToSupport ? 'on' : ''}`}
                  role="switch"
                  aria-checked={generalForm.p1p2AlertToSupport}
                  tabIndex={0}
                  onClick={() => {
                    const next = !generalForm.p1p2AlertToSupport;
                    setGeneralForm((f) => ({ ...f, p1p2AlertToSupport: next }));
                    saveSettings({ p1p2AlertToSupport: next }, 'Notification settings saved.');
                  }}
                />
              }
            />
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <CardHeader
              title="Bank Accounts & Exchange Rates"
              action={
                <Button
                  className="bacc"
                  size="sm"
                  onClick={() => {
                    setEditingBank(null);
                    setBankModalOpen(true);
                  }}
                >
                  + Add Account
                </Button>
              }
            />
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
              Accounts shown on invoices for client payment. Exchange rates convert NGN invoice totals for USD/GBP display.
            </div>
            <table style={{ fontSize: 12, marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Bank</th>
                  <th>Account Name</th>
                  <th>Account No.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bankAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--text3)', padding: '12px 0' }}>
                      No bank accounts yet. Add one to show payment details on invoices.
                    </td>
                  </tr>
                ) : (
                  bankAccounts.map((acct, i) => (
                    <tr key={acct._id ?? i}>
                      <td>
                        <Badge variant={bankBadgeVariant(acct.currency)}>{acct.currency}</Badge>
                      </td>
                      <td>{acct.bank}</td>
                      <td>{acct.accountName}</td>
                      <td style={{ fontFamily: "'DM Mono', monospace" }}>{acct.accountNumber}</td>
                      <td>
                        <Badge variant={acct.status === 'Primary' ? 'bg' : acct.status === 'Inactive' ? 'bn' : 'ba'}>
                          {acct.status}
                        </Badge>
                      </td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingBank(acct);
                            setBankModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => deleteBankAccount(acct)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="sect-divider">Exchange Rates (NGN base)</div>
            <div className="fr2">
              <FormGroup label="NGN per 1 USD">
                <input
                  className="inp"
                  type="number"
                  value={rateForm.usd}
                  onChange={(e) =>
                    setRateForm((f) => ({ ...f, usd: Number(e.target.value) }))
                  }
                />
              </FormGroup>
              <FormGroup label="NGN per 1 GBP">
                <input
                  className="inp"
                  type="number"
                  value={rateForm.gbp}
                  onChange={(e) =>
                    setRateForm((f) => ({ ...f, gbp: Number(e.target.value) }))
                  }
                />
              </FormGroup>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                Used to show USD/GBP equivalents on NGN invoices. Update when rates move materially.
              </div>
              <Button className="bacc" size="sm" disabled={saving} onClick={saveRates}>
                Save rates
              </Button>
            </div>
          </Card>

          <BankAccountModal
            open={bankModalOpen}
            account={editingBank}
            saving={bankSaving}
            onClose={() => {
              setBankModalOpen(false);
              setEditingBank(null);
            }}
            onSave={saveBankAccount}
          />

          <Card>
            <div className="ct" style={{ marginBottom: 5 }}>
              Role Delegation — PIN Generation
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 13 }}>
              Control which roles may <strong>trigger</strong> PIN generation against a confirmed client order. Executing
              generation stays with the AI/ML Lead; downloading the print package stays with CEO and Operations.
            </div>
            <div
              className="twrap"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                padding: '12px 14px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                marginBottom: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="tlbl">CEO — trigger PIN generation</div>
                <div className="tdesc">Always enabled. The Managing Director / CEO can trigger any PIN generation.</div>
              </div>
              <div className="toggle on" style={{ opacity: 0.6, cursor: 'not-allowed' }} title="Always on for CEO" />
            </div>
            <div
              className="twrap"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                padding: '12px 14px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                marginBottom: 10,
                opacity: 0.65,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="tlbl">Operations Manager — trigger PIN generation</div>
                <div className="tdesc">Enabled when an Operations Manager is on the team.</div>
              </div>
              <div className="toggle on" style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Ops Manager role" />
            </div>
            <div
              className="twrap"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                padding: '12px 14px',
                background: 'var(--ab)',
                border: '1.5px solid var(--amber)',
                borderRadius: 9,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="tlbl">🤖 Delegate to AI/ML Lead</div>
                <div className="tdesc">
                  Let the AI/ML Lead also <strong>trigger</strong> PIN generation — useful while there is no Operations
                  Manager. Revoke when Ops is hired.
                </div>
              </div>
              <div
                className={`toggle ${generalForm.aimlCanTriggerPin ? 'on' : ''}`}
                role="switch"
                aria-checked={generalForm.aimlCanTriggerPin}
                tabIndex={0}
                title="CEO-only setting"
                onClick={() => {
                  const next = !generalForm.aimlCanTriggerPin;
                  setGeneralForm((f) => ({ ...f, aimlCanTriggerPin: next }));
                  saveSettings(
                    { aimlCanTriggerPin: next },
                    next ? 'AI/ML PIN trigger delegation enabled.' : 'AI/ML PIN trigger delegation revoked.',
                  );
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
              🔒 Only the MD/CEO can change this setting. Changes are recorded in the audit log.
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
          <div className="warn-banner">
            ⚠ NAFDAC regulatory portal is a Sprint 3 deliverable. It is gated on the signed MOU with NAFDAC PPMD. The
            /api/regulatory/ namespace is scaffolded — no live endpoints until MOU is in place.
          </div>
          <Card>
            <div className="ct" style={{ marginBottom: 11 }}>
              NAFDAC Portal Status
            </div>
            <div className="stat-row">
              <span>MOU Status</span>
              <Badge variant={settings?.nafdacMouSigned ? 'bg' : 'br'}>
                {settings?.nafdacMouSigned ? 'Signed' : 'Not Signed'}
              </Badge>
            </div>
            <div className="stat-row">
              <span>API Namespace</span>
              <Badge variant="bg">Scaffolded — /api/regulatory/</Badge>
            </div>
            <div className="stat-row">
              <span>NAFDAC Auth Middleware</span>
              <Badge variant="bg">Built — Returns 403</Badge>
            </div>
            <div className="stat-row">
              <span>Regulatory Portal URL</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                {settings?.nafdacPortalUrl || 'regulatory.sartor.ng'} (not live)
              </span>
            </div>
            <div className="stat-row">
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
          <div className="stat-row">
            <span>API Version</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>
              {settings?.apiVersion ?? apiForm.apiVersion}
            </span>
          </div>
          <div className="stat-row">
            <span>Rate Limit</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>
              {(settings?.rateLimitPerMinute ?? apiForm.rateLimitPerMinute).toLocaleString()} req/min per client
            </span>
          </div>
          <div className="stat-row">
            <span>Authentication</span>
            <Badge variant="bb">JWT Bearer</Badge>
          </div>
          <div className="stat-row">
            <span>Webhook Retries</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>
              {settings?.webhookRetryCount ?? apiForm.webhookRetryCount} × exponential backoff
            </span>
          </div>
        </Card>
      )}
    </>
  );
}
