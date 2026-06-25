import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', loading, icon, children, className, disabled, ...rest }: ButtonProps) {
  const cls = { primary: 'btn-primary', ghost: 'btn-ghost', danger: 'btn-danger' }[variant];
  return (
    <button className={clsx(cls, className)} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
