import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/patterns';
import { OnboardingTable } from '../components/tables/OnboardingTable';
import { usePlatform } from '../context/PlatformContext';
import { useRoleGates } from '../hooks/useRoleGates';
import { useModal } from '../context/ModalContext';

const AUTH_STEPS = [
  { title: '1. Account', detail: 'Company + admin login created' },
  { title: '2. SKU Setup', detail: 'Products registered' },
  { title: '3. DORA Images', detail: 'Reference images uploaded' },
  { title: '4. Sticker Design', detail: 'Design finalized & signed off per SKU' },
  { title: '5. Activation', detail: 'Account activated & live' },
];

export function OnboardingPage() {
  const { openModal } = useModal();
  const { can } = useRoleGates();
  const { onboarding, loading } = usePlatform();

  return (
    <>
      <PageHeader
        title="Client Onboarding Pipeline"
        subtitle="Track setup progress for all new clients — incl. sticker design sign-off"
        actions={
          can('onboard') ? (
            <Button className="bacc" size="sm" onClick={() => openModal('onboard')}>
              + Start Onboarding
            </Button>
          ) : undefined
        }
      />

      <Card style={{ marginBottom: 12 }}>
        <div className="ch">
          <div className="ct">Onboarding Steps</div>
        </div>
        <div className="process-steps">
          {AUTH_STEPS.map((s, i) => (
            <div
              key={s.title}
              style={{
                textAlign: 'center',
                padding: '10px 6px',
                borderRight: i < AUTH_STEPS.length - 1 ? '1px solid var(--border)' : undefined,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 11 }}>{s.title}</div>
              <div style={{ color: 'var(--text3)', marginTop: 2, fontSize: 11 }}>{s.detail}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text3)',
            marginTop: 8,
            padding: '8px 10px',
            background: 'var(--bb)',
            borderRadius: 6,
          }}
        >
          ℹ Sticker design sign-off (Step 4) applies to <strong>Sartor-Chain & DORA AI</strong> and{' '}
          <strong>CRM 360</strong> clients only. CRM Field/Depot clients follow a 3-step path without sticker
          design.
        </div>
      </Card>

      {loading && !onboarding.length ? (
        <p className="pgsub">Loading pipeline…</p>
      ) : (
        <OnboardingTable rows={onboarding} />
      )}
    </>
  );
}
