import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { matchPageMeta } from '../../constants/routes';
import { useApp } from '../../context/AppContext';
import { usePlatform } from '../../context/PlatformContext';
import { useAuthStore } from '../../store/authStore';
import { ClientAvatar } from '../ui/ClientAvatar';
import { NotifPanel } from './NotifPanel';

export function TopToolbar() {
  const { pathname } = useLocation();
  const meta = matchPageMeta(pathname);
  const navigate = useNavigate();
  const { openSidebar, notifOpen, setNotifOpen, notifDot, clearNotifDot } = useApp();
  const { clients } = usePlatform();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState('');
  const [showResults, setShowResults] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results =
    q.trim().length > 0
      ? clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.code.toLowerCase().includes(q.toLowerCase()) ||
            c.rc.toLowerCase().includes(q.toLowerCase()),
        )
      : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <>
      <div className="tbar">
        <button type="button" className="ham" onClick={openSidebar} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
        <div>
          <div className="ttitle">{meta.title}</div>
          <div className="tsub">{meta.subtitle}</div>
        </div>
        <div className="tright">
          <div className="nav-search-wrap" style={{ position: 'relative' }} ref={wrapRef}>
            <input
              className="srch"
              placeholder="Search clients..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShowResults(!!e.target.value.trim());
              }}
              onFocus={() => q.trim() && setShowResults(true)}
              autoComplete="off"
            />
            {showResults && (
              <div
                id="sres"
                style={{
                  display: 'block',
                  position: 'absolute',
                  top: 36,
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,.1)',
                  zIndex: 50,
                  fontSize: 13,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {results.length === 0 ? (
                  <div style={{ padding: '10px 14px', color: 'var(--text3)', fontSize: 12 }}>
                    No clients found
                  </div>
                ) : (
                  results.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        cursor: 'pointer',
                        border: 'none',
                        borderBottom: '1px solid var(--bg2)',
                        background: 'transparent',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                      onClick={() => {
                        setQ('');
                        setShowResults(false);
                        navigate(`/clients/${c.code}`);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <ClientAvatar initials={c.ini} color={c.av} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                            {c.code} · {c.rc}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className="nbell"
            id="nbell"
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) clearNotifDot();
            }}
            aria-label="Notifications"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1a5 5 0 015 5v3l1 2H2l1-2V6a5 5 0 015-5zM6.5 13a1.5 1.5 0 003 0"
                stroke="#4A5580"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {notifDot && <div className="ndot" id="ndot" />}
          </button>
          {user && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Log out
            </button>
          )}
        </div>
      </div>
      <NotifPanel />
    </>
  );
}
