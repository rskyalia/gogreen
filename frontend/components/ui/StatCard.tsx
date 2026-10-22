import type { LucideIcon } from 'lucide-react';

/* ─── StatCard ───────────────────────────────────────────────────────────── */

export type StatCardTone = 'mint' | 'sun' | 'forest' | 'mist';

export const TONE_CHIP: Record<StatCardTone, string> = {
  mint:   'bg-mint text-forest',
  sun:    'bg-sun text-sun-ink',
  forest: 'bg-forest text-mint',
  mist:   'bg-mist text-leaf',
};

interface StatCardProps {
  icon:         LucideIcon;
  label:        string;
  value:        string | number;
  /** Satuan kecil setelah angka, mis. "kg", "orang" */
  unit?:        string;
  /** Teks perubahan opsional — ditampilkan sebagai pill badge */
  trend?:       string;
  /** Warna chip ikon (bg + text). Jika kosong, gunakan bg-mist + iconClass */
  tone?:        StatCardTone;
  /** Warna ikon fallback — gunakan kelas Tailwind token (default text-leaf) */
  iconClass?:   string;
  className?:   string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  tone,
  iconClass   = 'text-leaf',
  className   = '',
}: StatCardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-line bg-white p-5',
        'transition-shadow hover:shadow-md hover:shadow-forest/5',
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Chip ikon bernuansa — meniru kartu statistik user dashboard */}
        <span
          className={[
            'grid size-11 shrink-0 place-items-center rounded-2xl',
            tone ? TONE_CHIP[tone] : `bg-mist ${iconClass}`,
          ].join(' ')}
          aria-hidden="true"
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>

        {/* Trend opsional sebagai pill badge */}
        {trend && (
          <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-leaf">
            {trend}
          </span>
        )}
      </div>

      {/* Angka — font-serif besar warna forest */}
      <p className="mt-5 font-serif text-4xl font-medium leading-none text-forest">
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        {unit && (
          <span className="ml-1.5 text-base font-sans font-normal text-muted">
            {unit}
          </span>
        )}
      </p>

      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  );
}
