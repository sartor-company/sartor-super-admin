import type { CSSProperties, ReactNode } from 'react';

export function FormGroup({
  label,
  children,
  hint,
  style,
}: {
  label?: string;
  children: ReactNode;
  hint?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="fg" style={style}>
      {label && <label className="fi">{label}</label>}
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{hint}</div>
      )}
    </div>
  );
}
