export function ProgressBar({
  percent,
  color,
  width,
}: {
  percent: number;
  color?: string;
  width?: number | string;
}) {
  return (
    <div className="pbar" style={width != null ? { width } : undefined}>
      <div
        className="pfill"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          background: color,
        }}
      />
    </div>
  );
}

export function ProgressCell({
  percent,
  color,
  barWidth = 70,
  showLabel = true,
}: {
  percent: number;
  color?: string;
  barWidth?: number;
  showLabel?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <ProgressBar percent={percent} color={color} width={barWidth} />
      {showLabel && <span style={{ fontSize: 11 }}>{percent}%</span>}
    </div>
  );
}

export function OnboardingProgress({ percent, color }: { percent: number; color?: string }) {
  return (
    <div style={{ width: 80 }}>
      <ProgressBar percent={percent} color={color} />
    </div>
  );
}
