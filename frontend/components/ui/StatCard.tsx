import type { LucideIcon } from 'lucide-react';

/* ─── StatCard ───────────────────────────────────────────────────────────── */

interface StatCardProps {
  icon:         LucideIcon;
  label:        string;
  value:        string | number;
  /** Satuan kecil setelah angka, mis. "kg", "orang" */
  unit?:        string;
  /** Teks perubahan opsional, mis. "+12% dari kemarin" */
  trend?:       string;
  /** Warna ikon — gunakan kelas Tailwind token (default text-leaf) */
  iconClass?:   string;
  className?:   string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  iconClass   = 'text-leaf',
  className   = '',
}: StatCardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-line bg-white p-5 shadow-sm',
        className,
      ].join(' ')}
    >
      {/* Ikon */}
      <div
        className={[
          'mb-3 inline-flex h-10 w-10 items-center justify-center',
          'rounded-xl bg-mist',
          iconClass,
        ].join(' ')}
        aria-hidden="true"
      >
        <Icon size={20} strokeWidth={1.75} />
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
        {label}
      </p>

      {/* Angka — font-serif besar sesuai spesifikasi */}
      <p className="font-serif text-3xl font-semibold text-ink leading-none">
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        {unit && (
          <span className="ml-1.5 text-base font-sans font-normal text-muted">
            {unit}
          </span>
        )}
      </p>

      {/* Trend opsional */}
      {trend && (
        <p className="mt-2 text-xs text-muted">{trend}</p>
      )}
    </div>
  );
}
