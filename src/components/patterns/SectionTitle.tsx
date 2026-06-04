import type { ReactNode } from 'react';

export function SectionTitle({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="sdiv" style={style}>
      {children}
    </div>
  );
}
