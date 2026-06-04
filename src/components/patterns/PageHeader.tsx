import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="pghead">
      <div>
        <div className="pgtitle">{title}</div>
        {subtitle != null && <div className="pgsub">{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}
