import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { usePlatform } from '../../context/PlatformContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

export function NotifPanel() {
  const navigate = useNavigate();
  const { notifOpen, setNotifOpen, clearNotifDot } = useApp();
  const { showToast } = useToast();
  const { notifications, loading, markNotificationsRead } = usePlatform();

  const openItem = async (href?: string, id?: string) => {
    if (id && !id.startsWith('inv-') && !id.startsWith('pin-') && !id.startsWith('onb-')) {
      try {
        await markNotificationsRead(id);
      } catch {
        /* ignore */
      }
    }
    if (href) {
      navigate(href);
      setNotifOpen(false);
    }
  };

  return (
    <div className={`notif-panel ${notifOpen ? 'open' : ''}`} id="notif-panel">
      <div className="notif-hd">
        <div style={{ fontSize: 14, fontWeight: 600 }}>Notifications</div>
        <button type="button" className="mclose" onClick={() => setNotifOpen(false)}>
          ✕
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && notifications.length === 0 ? (
          <p style={{ padding: 16, color: 'var(--text3)', fontSize: 13 }}>Loading…</p>
        ) : notifications.length === 0 ? (
          <p style={{ padding: 16, color: 'var(--text3)', fontSize: 13 }}>No notifications right now.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="nitem"
              role={n.href ? 'button' : undefined}
              tabIndex={n.href ? 0 : undefined}
              style={n.href ? { cursor: 'pointer' } : undefined}
              onClick={() => openItem(n.href, n.id)}
              onKeyDown={(e) => e.key === 'Enter' && openItem(n.href, n.id)}
            >
              <div style={{ display: 'flex', gap: 9 }}>
                <span className="ndotc" style={{ background: n.color }} />
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: n.titleColor,
                      marginBottom: 2,
                    }}
                  >
                    {n.title}
                    {n.read === false ? (
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--bt)' }}>NEW</span>
                    ) : null}
                  </div>
                  <div style={{ color: 'var(--text2)' }}>{n.body}</div>
                  <div style={{ color: 'var(--text3)', marginTop: 3 }}>{n.time}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
        <Button
          variant="secondary"
          size="sm"
          style={{ width: '100%' }}
          onClick={async () => {
            try {
              await markNotificationsRead();
            } catch {
              /* ignore */
            }
            clearNotifDot();
            showToast('All notifications marked as read.', 'success');
            setNotifOpen(false);
          }}
        >
          Mark all as read
        </Button>
      </div>
    </div>
  );
}
