import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const IDLE_MS = Number(import.meta.env.VITE_SESSION_IDLE_MS) || 3 * 60 * 60 * 1000;

/** Log out after idle period; complements server-side session expiry. */
export function useSessionGuard() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
        navigate('/login?session=expired', { replace: true });
      }, IDLE_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [logout, navigate]);
}
