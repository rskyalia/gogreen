export type BadgeVariant = 'success' | 'pending' | 'danger' | 'neutral';

interface BadgeProps {
  variant?:  BadgeVariant;
  children:  React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-mist  text-forest border-mint',
  pending: 'bg-sun   text-sun-ink border-sun',
  danger:  'bg-danger-soft text-danger border-danger-soft',
  neutral: 'bg-mist  text-muted  border-line',
};

export function Badge({
  variant   = 'neutral',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
        'text-xs font-medium leading-none',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/* ─── Convenience helpers ────────────────────────────────────────────────── */

/** Pilih varian Badge berdasarkan string status umum. */
export function statusVariant(status: string): BadgeVariant {
  if (['verified', 'active', 'completed', 'delivered', 'received'].includes(status)) {
    return 'success';
  }
  if (['pending', 'offered', 'open'].includes(status)) {
    return 'pending';
  }
  if (['rejected', 'banned', 'danger'].includes(status)) {
    return 'danger';
  }
  return 'neutral';
}
