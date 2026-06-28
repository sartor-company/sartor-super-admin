import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { platformApi } from '../api/platform';
import { useAuthStore } from '../store/authStore';
import { ROLES } from '../constants/roles';
import type { RoleId } from '../types';

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionExpired) {
      useAuthStore.getState().logout();
    }
  }, [sessionExpired]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = (await platformApi.login(email, password)) as {
        accountType: string;
        platformRole?: RoleId;
        _id: string;
        fullName: string;
        email: string;
        token: string;
      };
      if (data.accountType !== 'sartor') {
        setError('Use a Sartor platform account (not a client CRM login).');
        return;
      }
      const role = (data.platformRole || 'super') as RoleId;
      setAuth({
        _id: data._id,
        fullName: data.fullName,
        email: data.email,
        token: data.token,
        accountType: data.accountType,
        platformRole: role,
      });
      navigate(ROLES[role]?.defaultPath || '/');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Login failed. Check email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-hero" aria-hidden="true">
        <img className="login-hero-img" src="/login-hero.png" alt="" />
        <div className="login-hero-overlay" />
        <div className="login-hero-content">
          <div className="login-hero-brand">
            <img className="login-hero-mark brand-logo" src="/sartor-logo.jpg" alt="Sartor Health logo" width={36} height={36} />
            <span>SARTOR</span>
          </div>
          <h1 className="login-hero-title">
            Operate Smart.
            <br />
            Scale Confidently.
          </h1>
          <p className="login-hero-sub">
            The internal console for Sartor Ltd — manage clients, onboarding, DORA AI, and platform
            operations in one place.
          </p>
          <div className="login-hero-pills">
            <span>Multi-tenant CRM</span>
            <span>DORA AI Pipeline</span>
            <span>Platform Ops</span>
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <p className="login-panel-kicker">SARTOR PLATFORM</p>
          <h2 className="login-panel-title">Welcome back</h2>
          <p className="login-panel-sub">Sign in to continue to the internal console</p>

          {sessionExpired && (
            <div className="login-error">
              Your session expired or is invalid for this server. Sign in again, then retry onboarding.
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          <label className="login-field">
            <span>Email</span>
            <input
              className="login-inp"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-pw-wrap">
              <input
                className="login-inp"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          <div className="login-row">
            <label className="login-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="login-link" disabled>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="login-footer">
            Internal access only. Contact your administrator for an account.
          </p>
        </form>
      </main>
    </div>
  );
}
