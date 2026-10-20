import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?:       string;
  description?: string;
  icon?:        LucideIcon;
  action?:      React.ReactNode;
  className?:   string;
}

export function EmptyState({
  title       = 'Tidak ada data',
  description = 'Belum ada item yang tersedia saat ini.',
  icon: Icon  = Inbox,
  action,
  className   = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      ].join(' ')}
      aria-live="polite"
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-muted"
        aria-hidden="true"
      >
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <p className="font-serif text-base font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
