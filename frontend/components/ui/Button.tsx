import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  icon?:     LucideIcon;
  children?: React.ReactNode;
}

/* ─── Style maps ─────────────────────────────────────────────────────────── */

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-forest text-white hover:bg-forest-deep active:bg-forest-deep ' +
    'focus-visible:ring-2 focus-visible:ring-forest/50',
  secondary:
    'bg-mist text-forest border border-line hover:bg-mint active:bg-mint ' +
    'focus-visible:ring-2 focus-visible:ring-leaf/40',
  ghost:
    'bg-transparent text-muted hover:bg-mist active:bg-mist ' +
    'focus-visible:ring-2 focus-visible:ring-leaf/40',
  danger:
    'bg-danger text-white hover:bg-danger/90 active:bg-danger/90 ' +
    'focus-visible:ring-2 focus-visible:ring-danger/40',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8  px-3   text-xs  gap-1.5',
  md: 'h-10 px-4   text-sm  gap-2',
};

const ICON_SIZE: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant  = 'primary',
    size     = 'md',
    loading  = false,
    icon: Icon,
    children,
    disabled,
    className = '',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      {...props}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-colors duration-150 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
    >
      {loading ? (
        <Loader2 size={ICON_SIZE[size]} className="animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={ICON_SIZE[size]} className="shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
});
