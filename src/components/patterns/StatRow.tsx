import type { ReactNode } from 'react';

export function StatRow({ label, value, valueColor }: { label: ReactNode; value: ReactNode; valueColor?: string }) {
  return (
    <div className="srow">
      <span>{label}</span>
      <span style={valueColor ? { color: valueColor, fontWeight: 600 } : undefined}>{value}</span>
    </div>
  );
}
