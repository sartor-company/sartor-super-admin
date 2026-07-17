import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { platformApi } from '../api/platform';
import type { Client } from '../data/clients';
import type { InvestigationRow } from '../data/investigations';
import type { OnboardingRow } from '../data/onboarding';
import type { StickerOrderRow, StickerOrderSummary } from '../data/stickerOrders';
import type { PlatformNotification, PlatformSettings, PlatformStaff } from '../types';
import type { PlatformCharts } from '../utils/chartSeries';
import {
  getLocalNotifications,
  markLocalNotificationsRead,
  subscribeLocalNotifications,
  type LocalAppNotification,
} from '../utils/appFeedback';
import { useApp } from './AppContext';
import { useToast } from './ToastContext';

function formatRelativeTime(ts: number) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function mapLocalNotif(n: LocalAppNotification): PlatformNotification {
  return {
    id: n.id,
    color: n.kind === 'error' ? 'var(--rt)' : n.kind === 'warn' ? 'var(--at)' : 'var(--bt)',
    title: n.title,
    body: n.body,
    time: formatRelativeTime(n.createdAt),
    titleColor: n.kind === 'error' ? 'var(--rt)' : undefined,
    href: n.href,
    read: n.read,
    kind: n.kind,
  };
}

function mergeNotifications(server: PlatformNotification[]): PlatformNotification[] {
  const local = getLocalNotifications().map(mapLocalNotif);
  const ids = new Set(local.map((n) => n.id));
  return [...local, ...server.filter((n) => !ids.has(n.id))];
}

type PlatformState = {
  clients: Client[];
  onboarding: OnboardingRow[];
  stickerOrders: StickerOrderRow[];
  stickerSummary: StickerOrderSummary | null;
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
  unreadNotifications: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshOnboarding: () => Promise<void>;
  refreshStickerOrders: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationsRead: (id?: string) => Promise<void>;
};

const PlatformContext = createContext<PlatformState | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { setNotifDot } = useApp();
  const seenNotifIds = useRef<Set<string>>(new Set());
  const [clients, setClients] = useState<Client[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingRow[]>([]);
  const [stickerOrders, setStickerOrders] = useState<StickerOrderRow[]>([]);
  const [stickerSummary, setStickerSummary] = useState<StickerOrderSummary | null>(null);
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
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

  const refreshStickerOrders = useCallback(async () => {
    const res = await platformApi.stickerOrders();
    setStickerOrders(res.data || []);
    setStickerSummary(res.summary || null);
  }, []);

  const refreshNotifications = useCallback(async () => {
    const res = await platformApi.notifications();
    const list = mergeNotifications(res.data || []);
    const unread = list.filter((n) => n.read === false).length;
    setNotifications(list);
    setUnreadNotifications(unread);
    setNotifDot(unread > 0);

    const primed = seenNotifIds.current.size > 0;
    for (const n of list) {
      if (seenNotifIds.current.has(n.id)) continue;
      seenNotifIds.current.add(n.id);
      if (primed && (n.kind === 'success' || n.kind === 'error')) {
        showToast(n.title, n.kind === 'error' ? 'error' : 'success');
      }
    }
  }, [setNotifDot, showToast]);

  const markNotificationsRead = useCallback(
    async (id?: string) => {
      if (id?.startsWith('session-') || id?.startsWith('local-')) {
        markLocalNotificationsRead(id);
      } else {
        await platformApi.markNotificationsRead(id ? { id } : {});
        if (!id) markLocalNotificationsRead();
      }
      await refreshNotifications();
    },
    [refreshNotifications],
  );

  useEffect(() => subscribeLocalNotifications(() => {
    void refreshNotifications();
  }), [refreshNotifications]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        platformApi.overview(),
        platformApi.clients(),
        platformApi.onboarding(),
        platformApi.stickerOrders().catch(() => ({ data: [], summary: null })),
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
      const stickerRes = val(3, { data: [], summary: null });
      setStickerOrders(stickerRes.data || []);
      setStickerSummary(stickerRes.summary || null);
      setInvestigations(val(4, { data: [] }).data || []);
      setInvoices(val(5, { data: [] }).data || []);
      setTickets(val(6, { data: [] }).data || []);
      setDoraQueue(val(7, { data: [] }).data || []);
      setDoraStats(val(8, null));
      setStaff(val(9, { data: [] }).data || []);
      setSettings(val(10, null) as PlatformSettings | null);
      setFinanceSummary(val(11, null));
      setReports(val(12, null));
      setCharts(val(13, null) as PlatformCharts | null);
      const notifRes = val(14, {
        data: [] as PlatformNotification[],
        unreadCount: 0,
      });
      const list = mergeNotifications(notifRes.data || []);
      setNotifications(list);
      const unread = list.filter((n) => n.read === false).length;
      setUnreadNotifications(unread);
      setNotifDot(unread > 0);
      for (const n of list) seenNotifIds.current.add(n.id);

      if (results[0].status === 'rejected') {
        const reason = results[0].reason;
        setError(reason instanceof Error ? reason.message : 'Failed to load platform overview');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load platform data');
    } finally {
      setLoading(false);
    }
  }, [setNotifDot]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll jobs + notifications so users get alerts without waiting on the page
  useEffect(() => {
    const tick = async () => {
      try {
        await refreshNotifications();
        const generating = stickerOrders.some((o) => o.pinStatus === 'generating');
        if (generating) await refreshStickerOrders();
      } catch {
        /* ignore poll errors */
      }
    };
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [refreshNotifications, refreshStickerOrders, stickerOrders]);

  const value = useMemo(
    () => ({
      clients,
      onboarding,
      stickerOrders,
      stickerSummary,
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
      unreadNotifications,
      loading,
      error,
      refresh,
      refreshClients,
      refreshOnboarding,
      refreshStickerOrders,
      refreshNotifications,
      markNotificationsRead,
    }),
    [
      clients,
      onboarding,
      stickerOrders,
      stickerSummary,
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
      unreadNotifications,
      loading,
      error,
      refresh,
      refreshClients,
      refreshOnboarding,
      refreshStickerOrders,
      refreshNotifications,
      markNotificationsRead,
    ],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
