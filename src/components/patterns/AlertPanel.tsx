import type { ReactNode } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

type AlertTone = 'critical' | 'attention' | 'setup';

const TONE_STYLES: Record<AlertTone, { bg: string; title: string; body: string }> = {
  critical: { bg: 'var(--rb)', title: 'var(--rt)', body: 'var(--rt)' },
  attention: { bg: 'var(--ab)', title: 'var(--at)', body: 'var(--at)' },
  setup: { bg: 'var(--bb)', title: 'var(--bt)', body: 'var(--bt)' },
};

export function AlertPanel({
  tone,
  title,
  badge,
  badgeVariant,
  description,
  action,
}: {
  tone: AlertTone;
  title: string;
  badge: string;
  badgeVariant: 'br' | 'ba' | 'bb';
  description: string;
  action?: ReactNode;
}) {
  const s = TONE_STYLES[tone];
  return (
    <div style={{ padding: 9, background: s.bg, borderRadius: 7, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <strong style={{ color: s.title }}>{title}</strong>
        <Badge variant={badgeVariant}>{badge}</Badge>
      </div>
      <div style={{ color: s.body }}>{description}</div>
      {action != null && <div style={{ marginTop: 5 }}>{action}</div>}
    </div>
  );
}

export function AlertPanelButton({
  tone,
  title,
  badge,
  badgeVariant,
  description,
  buttonLabel,
  buttonVariant = 'secondary',
  onClick,
}: {
  tone: AlertTone;
  title: string;
  badge: string;
  badgeVariant: 'br' | 'ba' | 'bb';
  description: string;
  buttonLabel: string;
  buttonVariant?: 'secondary' | 'danger' | 'accent';
  onClick: () => void;
}) {
  const btnClass = buttonVariant === 'accent' ? 'bacc' : buttonVariant === 'danger' ? 'bdng' : 'bsec';
  return (
    <AlertPanel
      tone={tone}
      title={title}
      badge={badge}
      badgeVariant={badgeVariant}
      description={description}
      action={
        <Button className={btnClass} size="sm" onClick={onClick}>
          {buttonLabel}
        </Button>
      }
    />
  );
}
