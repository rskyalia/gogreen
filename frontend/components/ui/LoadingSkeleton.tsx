/**
 * LoadingSkeleton — blok placeholder animasi saat data sedang dimuat.
 *
 * Gunakan <Skeleton> untuk satu blok, atau pola preset:
 *   <SkeletonText lines={3} />      — beberapa baris teks
 *   <SkeletonTable rows={5} cols={4} />  — baris tabel
 */

// ── Primitif ──────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse rounded-md bg-line', className].join(' ')}
    />
  );
}

// ── Teks ──────────────────────────────────────────────────────────────────

export function SkeletonText({
  lines     = 3,
  className = '',
}: {
  lines?:     number;
  className?: string;
}) {
  return (
    <div className={['space-y-2', className].join(' ')} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={['h-4', i === lines - 1 ? 'w-3/4' : 'w-full'].join(' ')}
        />
      ))}
    </div>
  );
}

// ── Baris tabel ───────────────────────────────────────────────────────────

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden="true">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Kartu statistik ───────────────────────────────────────────────────────

export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={[
        'rounded-2xl border border-line bg-white p-5 shadow-sm space-y-3',
        className,
      ].join(' ')}
    >
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-20" />
    </div>
  );
}