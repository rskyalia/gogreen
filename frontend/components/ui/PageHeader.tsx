/* ─── PageHeader ─────────────────────────────────────────────────────────── */

interface PageHeaderProps {
  title:        string;
  description?: string;
  /** Konten di sebelah kanan — biasanya tombol aksi */
  action?:      React.ReactNode;
  className?:   string;
}

export function PageHeader({
  title,
  description,
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={[
        'flex items-start justify-between gap-4 flex-wrap',
        className,
      ].join(' ')}
    >
      <div>
        {/* Judul memakai font-serif sesuai spesifikasi desain */}
        <h1 className="font-serif text-2xl font-semibold text-ink leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2 shrink-0">{action}</div>
      )}
    </div>
  );
}
