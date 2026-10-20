/* ─── Card ───────────────────────────────────────────────────────────────── */

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  /** Tambah padding standar secara otomatis (default true) */
  padded?:    boolean;
}

export function Card({ children, className = '', padded = true }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-line bg-white shadow-sm',
        padded ? 'p-5' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* ─── Card.Header ────────────────────────────────────────────────────────── */

interface CardHeaderProps {
  title:       string;
  description?: string;
  action?:      React.ReactNode;
  className?:   string;
}

export function CardHeader({
  title,
  description,
  action,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={['flex items-start justify-between gap-4 mb-5', className].join(' ')}>
      <div>
        <h2 className="font-serif text-lg font-medium text-forest leading-snug">{title}</h2>
        {description && (
          <p className="text-sm text-muted mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─── Card.Divider ───────────────────────────────────────────────────────── */

export function CardDivider({ className = '' }: { className?: string }) {
  return <hr className={['border-line', className].join(' ')} />;
}
