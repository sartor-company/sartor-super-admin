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
import { registerToast, unregisterToast } from '../utils/appFeedback';

type ToastType = 'success' | 'error' | 'warn';

interface ToastContextValue {
  showToast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    msg: string;
    type: ToastType;
    visible: boolean;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type, visible: true });
    timerRef.current = setTimeout(() => {
      setToast((t) => (t ? { ...t, visible: false } : null));
    }, 3400);
  }, []);

  useEffect(() => {
    registerToast(showToast);
    return () => unregisterToast(showToast);
  }, [showToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const className =
    toast?.type === 'error' ? 'error' : toast?.type === 'warn' ? 'warn' : 'success';

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        id="toast"
        className={`toast ${toast?.visible ? 'show' : ''} ${toast?.visible ? className : ''}`}
      >
        {toast?.msg}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
