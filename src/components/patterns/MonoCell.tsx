import type { ReactNode } from 'react';

export function MonoCell({ children, bold, color }: { children: ReactNode; bold?: boolean; color?: string }) {
  return (
    <td
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        fontWeight: bold ? 700 : undefined,
        color,
      }}
    >
      {children}
    </td>
  );
}
