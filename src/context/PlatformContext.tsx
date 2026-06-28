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
import type { PlatformNotification, PlatformSettings, PlatformStaff } from '../types';
import type { PlatformCharts } from '../utils/chartSeries';

type PlatformState = {
  clients: Client[];
  onboarding: OnboardingRow[];
  investigations: InvestigationRow[];
  overview: Record<string, unknown> | null;
  invoices: Record<string, unknown>[];
  tickets: Record<string, unknown>[];
  doraQueue: Record<string, unknown>[];
  doraStats: Record<string, unknown> | null;
  staff: PlatformStaff[];
  settings: PlatformSettings | null;
  financeSummary: Record<string, unknown> | null;
  reports: Record<string, unknown> | null;
  charts: PlatformCharts | null;
  notifications: PlatformNotification[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshOnboarding: () => Promise<void>;
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
  const [staff, setStaff] = useState<PlatformStaff[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [financeSummary, setFinanceSummary] = useState<Record<string, unknown> | null>(null);
  const [reports, setReports] = useState<Record<string, unknown> | null>(null);
  const [charts, setCharts] = useState<PlatformCharts | null>(null);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshClients = useCallback(async () => {
    const res = await platformApi.clients();
    setClients(res.data || []);
  }, []);

  const refreshOnboarding = useCallback(async () => {
    const res = await platformApi.onboarding();
    setOnboarding(res.data || []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
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
        platformApi.charts(),
        platformApi.notifications(),
      ]);

      const val = <T,>(i: number, fallback: T): T =>
        results[i].status === 'fulfilled' ? (results[i].value as T) : fallback;

      setOverview(val(0, null));
      setClients(val(1, { data: [] }).data || []);
      setOnboarding(val(2, { data: [] }).data || []);
      setInvestigations(val(3, { data: [] }).data || []);
      setInvoices(val(4, { data: [] }).data || []);
      setTickets(val(5, { data: [] }).data || []);
      setDoraQueue(val(6, { data: [] }).data || []);
      setDoraStats(val(7, null));
      setStaff(val(8, { data: [] }).data || []);
      setSettings(val(9, null) as PlatformSettings | null);
      setFinanceSummary(val(10, null));
      setReports(val(11, null));
      setCharts(val(12, null) as PlatformCharts | null);
      setNotifications(val(13, { data: [] }).data || []);

      if (results[0].status === 'rejected') {
        const reason = results[0].reason;
        setError(reason instanceof Error ? reason.message : 'Failed to load platform overview');
      }
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
      charts,
      notifications,
      loading,
      error,
      refresh,
      refreshClients,
      refreshOnboarding,
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
      charts,
      notifications,
      loading,
      error,
      refresh,
      refreshClients,
      refreshOnboarding,
    ],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
