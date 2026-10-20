'use client';

/**
 * DataTable — tabel generik dengan paginasi, filter slot, dan search.
 *
 * Penggunaan:
 *   const columns: Column<MyRow>[] = [
 *     { key: 'name',   header: 'Nama' },
 *     { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
 *   ];
 *   <DataTable columns={columns} rows={data} meta={meta} onPageChange={setPage} />
 */

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { SkeletonTable } from './LoadingSkeleton';
import { EmptyState }    from './EmptyState';

// ── Types ─────────────────────────────────────────────────────────────────

export interface Column<T> {
  key:        string;
  header:     string;
  /** Custom render — jika tidak ada, nilai diambil dari row[key] */
  render?:    (row: T) => React.ReactNode;
  /** Kelas tambahan untuk <td> dan <th> */
  className?: string;
  /** Lebar kolom, mis. 'w-32' */
  width?:     string;
}

export interface PaginationMeta {
  current_page: number;
  last_page:    number;
  total:        number;
  per_page?:    number;
}

interface DataTableProps<T> {
  columns:       Column<T>[];
  rows:          T[];
  keyExtractor:  (row: T) => string | number;
  meta?:         PaginationMeta;
  loading?:      boolean;
  /** Callback dipanggil 400 ms setelah user berhenti mengetik */
  onSearch?:     (q: string) => void;
  searchPlaceholder?: string;
  /** Slot filter tambahan (mis. date range, select status) */
  filters?:      React.ReactNode;
  /** Slot aksi (mis. tombol export / tambah) */
  actions?:      React.ReactNode;
  onPageChange?: (page: number) => void;
  emptyTitle?:   string;
  emptyDescription?: string;
  className?:    string;
}

// ── Component ─────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  meta,
  loading           = false,
  onSearch,
  searchPlaceholder = 'Cari...',
  filters,
  actions,
  onPageChange,
  emptyTitle,
  emptyDescription,
  className = '',
}: DataTableProps<T>) {
  const [query, setQuery]   = useState('');
  const debounceRef         = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (!onSearch) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  const colCount = columns.length;

  return (
    <div className={['space-y-3', className].join(' ')}>

      {/* ── Toolbar ── */}
      {(onSearch || filters || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {onSearch && (
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="field-base h-9 pl-8 pr-3 w-56 text-xs"
                  aria-label={searchPlaceholder}
                />
              </div>
            )}
            {filters}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-paper">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={[
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted',
                    col.width ?? '',
                    col.className ?? '',
                  ].join(' ')}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {loading ? (
              <SkeletonTable rows={8} cols={colCount} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    className="py-12"
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-paper transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        'px-4 py-3 text-ink',
                        col.className ?? '',
                      ].join(' ')}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {meta && meta.last_page > 1 && (
        <Pagination meta={meta} onPageChange={onPageChange} />
      )}
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────

function Pagination({
  meta,
  onPageChange,
}: {
  meta:           PaginationMeta;
  onPageChange?:  (page: number) => void;
}) {
  const { current_page: cur, last_page: last, total } = meta;

  // Tampilkan maksimal 7 halaman sekaligus
  const pages = buildPageRange(cur, last);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted"
      aria-label="Paginasi"
    >
      <span>
        Total <strong className="text-ink">{total.toLocaleString('id')}</strong> data
      </span>

      <div className="flex items-center gap-1">
        <PageBtn
          label="Sebelumnya"
          disabled={cur === 1}
          onClick={() => onPageChange?.(cur - 1)}
          aria-label="Halaman sebelumnya"
        />

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-muted select-none">
              ...
            </span>
          ) : (
            <PageBtn
              key={p}
              label={String(p)}
              active={p === cur}
              onClick={() => onPageChange?.(p as number)}
              aria-label={`Halaman ${p}`}
              aria-current={p === cur ? 'page' : undefined}
            />
          ),
        )}

        <PageBtn
          label="Berikutnya"
          disabled={cur === last}
          onClick={() => onPageChange?.(cur + 1)}
          aria-label="Halaman berikutnya"
        />
      </div>
    </nav>
  );
}

function PageBtn({
  label,
  active   = false,
  disabled = false,
  onClick,
  ...ariaProps
}: {
  label:     string;
  active?:   boolean;
  disabled?: boolean;
  onClick:   () => void;
} & React.AriaAttributes) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'h-7 min-w-[1.75rem] rounded-md px-2 font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        active
          ? 'bg-forest text-white'
          : 'bg-white border border-line text-muted hover:bg-mist hover:text-forest',
      ].join(' ')}
      {...ariaProps}
    >
      {label}
    </button>
  );
}

/** Buat array nomor halaman dengan ellipsis jika perlu. */
function buildPageRange(cur: number, last: number): Array<number | '...'> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages: Array<number | '...'> = [1];

  if (cur > 3) pages.push('...');

  const start = Math.max(2, cur - 1);
  const end   = Math.min(last - 1, cur + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (cur < last - 2) pages.push('...');
  pages.push(last);

  return pages;
}
