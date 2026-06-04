import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

const ITEMS = [
  { color: 'var(--red)', title: 'P1 — NaturalKing Batch Mismatch', body: 'BATCH-NK-019 flagged. INV-2026-112 open.', time: '2 hours ago', titleColor: 'var(--rt)' },
  { color: 'var(--amber)', title: 'NaturalKing PIN Credits at 8%', body: '~800 credits remaining. 4 days to exhaustion.', time: '4 hours ago', titleColor: 'var(--at)' },
  { color: 'var(--amber)', title: 'DORA SLA Breach — BATCH-DP-042', body: 'DankePharma batch at 6 days — SLA breached.', time: '6 hours ago', titleColor: 'var(--at)' },
  { color: 'var(--blue)', title: 'DankePharma Invoice Overdue', body: 'INV-2026-044 (₦200,000) 3 days overdue.', time: 'Yesterday', titleColor: undefined },
  { color: 'var(--green)', title: 'New Client — FreshNow Consumer', body: 'Pilot activated. ₦3,500,000 fee received.', time: 'Apr 19, 2026', titleColor: 'var(--gt)' },
];

export function NotifPanel() {
  const { notifOpen, setNotifOpen } = useApp();
  const { showToast } = useToast();

  return (
    <div className={`notif-panel ${notifOpen ? 'open' : ''}`} id="notif-panel">
      <div className="notif-hd">
        <div style={{ fontSize: 14, fontWeight: 600 }}>Notifications</div>
        <button type="button" className="mclose" onClick={() => setNotifOpen(false)}>
          ✕
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {ITEMS.map((n) => (
          <div key={n.title} className="nitem">
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
                </div>
                <div style={{ color: 'var(--text2)' }}>{n.body}</div>
                <div style={{ color: 'var(--text3)', marginTop: 3 }}>{n.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
        <Button
          variant="secondary"
          size="sm"
          style={{ width: '100%' }}
          onClick={() => {
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
