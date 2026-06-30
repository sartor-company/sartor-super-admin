import type { CSSProperties, ReactNode } from 'react';

export function InfoBanner({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="info-b" style={style}>
      {children}
    </div>
  );
}

export function WarnBanner({ children }: { children: ReactNode }) {
  return <div className="warn-b">{children}</div>;
}
