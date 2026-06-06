import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/patterns';
import { OnboardingTable } from '../components/tables/OnboardingTable';
import { usePlatform } from '../context/PlatformContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { exportReport } from '../utils/exportReport';

export function OnboardingPage() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const { onboarding, loading } = usePlatform();

  return (
    <>
      <PageHeader
        title="Client Onboarding Pipeline"
        subtitle="Track setup progress for all new clients"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => exportReport(showToast, 'Onboarding Pipeline')}>
              ↓ Export
            </Button>
            <Button className="bacc" size="sm" onClick={() => openModal('onboard')}>
              + Start Onboarding
            </Button>
          </div>
        }
      />
      {loading && !onboarding.length ? (
        <p className="pgsub">Loading pipeline…</p>
      ) : (
        <OnboardingTable rows={onboarding} />
      )}
    </>
  );
}
