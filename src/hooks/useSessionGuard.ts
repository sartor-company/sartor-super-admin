import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const IDLE_MS = 3 * 60 * 60 * 1000; // 3 hours

/** Log out after idle period; complements server-side session expiry. */
export function useSessionGuard() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!token) return;

    const forceLogout = () => {
      logout();
      navigate('/login?session=expired', { replace: true });
    };

    const enforceIdleLimit = () => {
      if (Date.now() - lastActivityRef.current >= IDLE_MS) {
        forceLogout();
        return true;
      }
      return false;
    };

    const reset = () => {
      if (enforceIdleLimit()) return;
      lastActivityRef.current = Date.now();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        forceLogout();
      }, IDLE_MS);
    };

    const handleVisibilityOrFocus = () => {
      if (enforceIdleLimit()) return;
      reset();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, reset));
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [token, logout, navigate]);
}
