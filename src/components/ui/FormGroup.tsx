import type { ReactNode } from 'react';

export function FormGroup({
  label,
  children,
  hint,
}: {
  label?: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="fg">
      {label && <label className="fi">{label}</label>}
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{hint}</div>
      )}
    </div>
  );
}
