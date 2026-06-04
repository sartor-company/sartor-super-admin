import type { ReactNode } from 'react';

export function KCard({
  label,
  value,
  trend,
  trendClass = 'neu',
  trendType,
  accent,
  onClick,
  valueStyle,
  progressPercent,
  progressColor,
}: {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  trendClass?: 'up' | 'dn' | 'neu';
  trendType?: 'up' | 'dn' | 'neu';
  accent?: boolean;
  onClick?: () => void;
  valueStyle?: React.CSSProperties;
  progressPercent?: number;
  progressColor?: string;
}) {
  const trendCls = trendType ?? trendClass;
  return (
    <div
      className={`kcard ${accent ? 'kcard-accent' : ''}`}
      style={onClick ? { cursor: 'pointer' } : undefined}
      onClick={onClick}
      onKeyDown={onClick ? undefined : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="klbl">{label}</div>
      <div className="kval" style={valueStyle}>
        {value}
      </div>
      {trend != null && <div className={`ktrend ${trendCls}`}>{trend}</div>}
      {progressPercent != null && (
        <div className="pbar" style={{ marginTop: 5 }}>
          <div
            className="pfill"
            style={{
              width: `${progressPercent}%`,
              background: progressColor ?? 'var(--navy)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export function KCardGrid({
  cols = 4,
  columns,
  children,
}: {
  cols?: 3 | 4 | 5;
  columns?: 3 | 4 | 5;
  children: ReactNode;
}) {
  const c = columns ?? cols;
  const cls = c === 5 ? 'kgrid5' : c === 3 ? 'kgrid3' : 'kgrid';
  return <div className={cls}>{children}</div>;
}
