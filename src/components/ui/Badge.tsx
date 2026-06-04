import type { BadgeVariant } from '../../types';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ variant = 'bg', children, className = '', style }: BadgeProps) {
  const v = variant === 'bn' ? 'bgold' : variant;
  return (
    <span className={`badge ${v} ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}
