import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { platformApi } from '../api/platform';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const [sessionState, setSessionState] = useState<'checking' | 'valid' | 'invalid'>(
    token ? 'checking' : 'invalid',
  );
  const [expiredRedirect, setExpiredRedirect] = useState(false);

  useEffect(() => {
    if (!token) {
      setSessionState('invalid');
      setExpiredRedirect(false);
      return;
    }

    let cancelled = false;
    setSessionState('checking');
    setExpiredRedirect(false);

    platformApi
      .overview()
      .then(() => {
        if (!cancelled) setSessionState('valid');
      })
      .catch(() => {
        if (cancelled) return;
        logout();
        setExpiredRedirect(true);
        setSessionState('invalid');
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  if (!token || sessionState === 'invalid') {
    return (
      <Navigate
        to={expiredRedirect ? '/login?session=expired' : '/login'}
        replace
      />
    );
  }

  if (sessionState === 'checking') {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
        Verifying session…
      </div>
    );
  }

  return <Outlet />;
}
