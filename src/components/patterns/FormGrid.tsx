import type { CSSProperties, ReactNode } from 'react';

export function FormRow2({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="fr2" style={style}>
      {children}
    </div>
  );
}

export function FormRow3({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="fr3" style={style}>
      {children}
    </div>
  );
}
