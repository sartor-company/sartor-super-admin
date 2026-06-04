const DEFAULT_ITEMS = [
  { color: 'var(--navy)', label: 'SKU Licences', pct: '55%' },
  { color: 'var(--accent)', label: 'Credit Bundles', pct: '22%' },
  { color: 'var(--green)', label: 'CRM Subscriptions', pct: '12%' },
  { color: 'var(--gold)', label: 'Onboarding Fees', pct: '11%' },
];

export function DonutLegend({
  items = DEFAULT_ITEMS,
  gap = 3,
  marginTop = 8,
}: {
  items?: { color: string; label: string; pct: string }[];
  gap?: number;
  marginTop?: number;
}) {
  return (
    <div style={{ display: 'grid', gap, marginTop, fontSize: 11 }}>
      {items.map((i) => (
        <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: i.color,
                display: 'inline-block',
              }}
            />
            {i.label}
          </span>
          <strong>{i.pct}</strong>
        </div>
      ))}
    </div>
  );
}
