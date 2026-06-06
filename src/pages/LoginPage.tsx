import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformApi } from '../api/platform';
import { useAuthStore } from '../store/authStore';
import { ROLES } from '../constants/roles';
import type { RoleId } from '../types';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">Sartor</div>
        <div className="login-title">Platform Console</div>
        <p className="login-sub">Sign in with your Sartor Ltd account</p>
        {error && <div className="login-error">{error}</div>}
        <label className="login-label">
          Email
          <input
            className="inp"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="login-label">
          Password
          <input
            className="inp"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
