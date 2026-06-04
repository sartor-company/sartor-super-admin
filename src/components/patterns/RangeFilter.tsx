import { Button } from '../ui/Button';

const DEFAULT_RANGES = ['7 days', '30 days', '90 days', 'YTD'] as const;

export function RangeFilterBar({
  ranges = DEFAULT_RANGES,
  value,
  onChange,
  onExport,
}: {
  ranges?: readonly string[];
  value: string;
  onChange: (range: string) => void;
  onExport?: () => void;
}) {
  return (
    <div className="rpt-filter">
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Period:</span>
      {ranges.map((r) => (
        <button
          key={r}
          type="button"
          className={`rng-btn ${value === r ? 'on' : ''}`}
          onClick={() => onChange(r)}
        >
          {r}
        </button>
      ))}
      {onExport != null && (
        <Button variant="secondary" size="sm" style={{ marginLeft: 'auto' }} onClick={onExport}>
          ↓ Export CSV
        </Button>
      )}
    </div>
  );
}
