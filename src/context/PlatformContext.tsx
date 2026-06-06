import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { platformApi } from '../api/platform';
import type { Client } from '../data/clients';
import type { InvestigationRow } from '../data/investigations';
import type { OnboardingRow } from '../data/onboarding';

type PlatformState = {
  clients: Client[];
  onboarding: OnboardingRow[];
  investigations: InvestigationRow[];
  overview: Record<string, unknown> | null;
  invoices: Record<string, unknown>[];
  tickets: Record<string, unknown>[];
  doraQueue: Record<string, unknown>[];
  doraStats: Record<string, unknown> | null;
  staff: Record<string, unknown>[];
  settings: Record<string, unknown> | null;
  financeSummary: Record<string, unknown> | null;
  reports: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshClients: () => Promise<void>;
};

const PlatformContext = createContext<PlatformState | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingRow[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationRow[]>([]);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
  const [doraQueue, setDoraQueue] = useState<Record<string, unknown>[]>([]);
  const [doraStats, setDoraStats] = useState<Record<string, unknown> | null>(null);
  const [staff, setStaff] = useState<Record<string, unknown>[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [financeSummary, setFinanceSummary] = useState<Record<string, unknown> | null>(null);
  const [reports, setReports] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshClients = useCallback(async () => {
    const res = await platformApi.clients();
    setClients(res.data || []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, cl, ob, inv, invList, tix, dq, ds, st, set, fin, rep] =
        await Promise.all([
          platformApi.overview(),
          platformApi.clients(),
          platformApi.onboarding(),
          platformApi.investigations(),
          platformApi.invoices(),
          platformApi.tickets(),
          platformApi.doraQueue(),
          platformApi.doraStats(),
          platformApi.staff(),
          platformApi.settings(),
          platformApi.financeSummary(),
          platformApi.reports(),
        ]);
      setOverview(ov as Record<string, unknown>);
      setClients(cl.data || []);
      setOnboarding(ob.data || []);
      setInvestigations(inv.data || []);
      setInvoices((invList as { data?: Record<string, unknown>[] }).data || []);
      setTickets((tix as { data?: Record<string, unknown>[] }).data || []);
      setDoraQueue((dq as { data?: Record<string, unknown>[] }).data || []);
      setDoraStats(ds as Record<string, unknown>);
      setStaff((st as { data?: Record<string, unknown>[] }).data || []);
      setSettings(set as Record<string, unknown>);
      setFinanceSummary(fin as Record<string, unknown>);
      setReports(rep as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load platform data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      clients,
      onboarding,
      investigations,
      overview,
      invoices,
      tickets,
      doraQueue,
      doraStats,
      staff,
      settings,
      financeSummary,
      reports,
      loading,
      error,
      refresh,
      refreshClients,
    }),
    [
      clients,
      onboarding,
      investigations,
      overview,
      invoices,
      tickets,
      doraQueue,
      doraStats,
      staff,
      settings,
      financeSummary,
      reports,
      loading,
      error,
      refresh,
      refreshClients,
    ],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
