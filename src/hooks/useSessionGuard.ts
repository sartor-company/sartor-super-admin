import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { notifySessionExpired } from '../utils/appFeedback';

/** Idle timeout — auto logout after no interaction */
const IDLE_MS = 3 * 60 * 60 * 1000; // 3 hours
/** Absolute max session length from login (matches server SESSION_MAX_AGE_HOURS) */
const ABSOLUTE_MS = 24 * 60 * 60 * 1000; // 24 hours
/** How often to persist activity to storage (avoid write spam on scroll) */
const PERSIST_EVERY_MS = 30 * 1000;
/** Periodic check so logout fires even without any events (e.g. idle tab) */
const CHECK_EVERY_MS = 60 * 1000;

/**
 * Logs the super admin out after 3h of inactivity or 24h absolute session age.
 * Activity is persisted, so closing the tab does not reset the idle clock.
 * Complements server-side session expiry (middleware.protects).
 */
export function useSessionGuard() {
  const token = useAuthStore((s) => s.token);
  const loggedInAt = useAuthStore((s) => s.loggedInAt);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());
  const lastPersistRef = useRef(0);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (!token) return;

    // Seed from persisted activity so a reload doesn't reset the idle clock
    const persisted = useAuthStore.getState().lastActivityAt;
    if (persisted) lastActivityRef.current = persisted;

    const forceLogout = () => {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      notifySessionExpired('Your session has expired due to inactivity. Please sign in again.');
      logout();
      window.setTimeout(() => {
        navigate('/login?session=expired', { replace: true });
      }, 1200);
    };

    const expired = () => {
      // Legacy sessions without loggedInAt: force re-login once
      if (!loggedInAt) return true;
      if (Date.now() - loggedInAt >= ABSOLUTE_MS) return true;
      return Date.now() - lastActivityRef.current >= IDLE_MS;
    };

    if (expired()) {
      forceLogout();
      return;
    }

    const onActivity = () => {
      if (expired()) {
        forceLogout();
        return;
      }
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastPersistRef.current >= PERSIST_EVERY_MS) {
        lastPersistRef.current = now;
        useAuthStore.getState().touchActivity();
      }
    };

    const onWake = () => {
      // Returning to the tab: expire if idle limit passed while away
      if (expired()) forceLogout();
    };

    const interval = setInterval(() => {
      if (expired()) forceLogout();
    }, CHECK_EVERY_MS);

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    onActivity();

    return () => {
      clearInterval(interval);
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [token, loggedInAt, logout, navigate]);
}
