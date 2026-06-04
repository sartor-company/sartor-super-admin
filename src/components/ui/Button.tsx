import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger' | 'success';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bpri',
  accent: 'bacc',
  secondary: 'bsec',
  danger: 'bdng',
  success: 'bsuc',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = ['btn', variantClass[variant], size === 'sm' ? 'bsm' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
