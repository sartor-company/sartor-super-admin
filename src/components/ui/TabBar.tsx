interface Tab {
  id: string;
  label: string;
}

export function TabBar<T extends string = string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tab-bar">
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tab"
          tabIndex={0}
          aria-selected={active === t.id}
          className={`tab ${active === t.id ? 'on' : ''}`}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange(t.id);
            }
          }}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}
