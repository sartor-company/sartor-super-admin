type ToastType = 'success' | 'error' | 'warn';
type ToastFn = (msg: string, type?: ToastType) => void;

export type LocalAppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  kind: 'warn' | 'error' | 'info';
  href?: string;
};

const STORAGE_KEY = 'sartor-platform-local-notifs';

let toastFn: ToastFn | null = null;
const listeners = new Set<() => void>();

function readStore(): LocalAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalAppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(list: LocalAppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  listeners.forEach((cb) => cb());
}

export function registerToast(fn: ToastFn) {
  toastFn = fn;
}

export function unregisterToast(fn?: ToastFn) {
  if (!fn || toastFn === fn) toastFn = null;
}

export function appToast(msg: string, type: ToastType = 'warn') {
  if (toastFn) toastFn(msg, type);
}

export function getLocalNotifications(): LocalAppNotification[] {
  return readStore();
}

export function subscribeLocalNotifications(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function pushLocalNotification(
  input: Omit<LocalAppNotification, 'id' | 'createdAt' | 'read'> & {
    id?: string;
    createdAt?: number;
    read?: boolean;
  },
) {
  const item: LocalAppNotification = {
    id: input.id || `local-${Date.now()}`,
    title: input.title,
    body: input.body,
    kind: input.kind,
    href: input.href,
    createdAt: input.createdAt || Date.now(),
    read: input.read ?? false,
  };
  const next = [item, ...readStore().filter((n) => n.id !== item.id)];
  writeStore(next);
  return item;
}

export function markLocalNotificationsRead(id?: string) {
  const next = readStore().map((n) =>
    !id || n.id === id ? { ...n, read: true } : n,
  );
  writeStore(next);
}

/** Toast + bell notification for session expiry (safe from axios / hooks). */
export function notifySessionExpired(serverMessage?: string) {
  const msg =
    (typeof serverMessage === 'string' && serverMessage.trim()) ||
    'Your session has expired. Please sign in again.';
  appToast(msg, 'warn');
  pushLocalNotification({
    id: `session-expired-${Date.now()}`,
    title: 'Session expired',
    body: msg,
    kind: 'warn',
  });
  return msg;
}
