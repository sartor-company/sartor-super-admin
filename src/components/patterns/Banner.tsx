import type { ReactNode } from 'react';

export function InfoBanner({ children }: { children: ReactNode }) {
  return <div className="info-b">{children}</div>;
}

export function WarnBanner({ children }: { children: ReactNode }) {
  return <div className="warn-b">{children}</div>;
}
