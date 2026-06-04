interface ProductPillProps {
  variant: string;
  children: React.ReactNode;
}

export function ProductPill({ variant, children }: ProductPillProps) {
  return <span className={`ppill pp-${variant}`}>{children}</span>;
}
