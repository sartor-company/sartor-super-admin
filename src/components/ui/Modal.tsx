import type { ReactNode } from 'react';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  width = 560,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  width?: number | string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="modal-bg open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className="modal" style={{ width }} role="dialog" aria-modal="true">
        {(title || subtitle) && (
          <div className="mhd">
            <div>
              {title && <div className="mtitle">{title}</div>}
              {subtitle && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {subtitle}
                </div>
              )}
            </div>
            <button type="button" className="mclose" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        )}
        {children}
        {footer}
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
      {children}
    </div>
  );
}
