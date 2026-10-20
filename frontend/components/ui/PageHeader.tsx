/* ─── PageHeader ─────────────────────────────────────────────────────────── */

interface PageHeaderProps {
  title:        string;
  description?: string;
  /** Micro-label uppercase di atas judul, mis. "Ringkasan hari ini" */
  eyebrow?:     string;
  /** Konten di sebelah kanan — biasanya tombol aksi */
  action?:      React.ReactNode;
  className?:   string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
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
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
            {eyebrow}
          </p>
        )}
        {/* Judul memakai font-serif warna forest sesuai spesifikasi desain */}
        <h1
          className={[
            'font-serif text-2xl sm:text-3xl font-medium leading-tight text-forest',
            eyebrow ? 'mt-2' : '',
          ].join(' ')}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted">{description}</p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2 shrink-0">{action}</div>
      )}
    </div>
  );
}
