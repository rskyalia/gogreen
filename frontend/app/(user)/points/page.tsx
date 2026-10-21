'use client';

/**
 * /points  — ledger poin user (paginasi, filter per type)
 */

import { useCallback, useEffect, useState } from 'react';
import { PageHeader, Card, Badge } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';
import { ChevronLeft, ChevronRight, Coins } from 'lucide-react';
import type { BadgeVariant } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────

interface PointTx {
  id: number;
  type: string;
  points: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

type TxType = '' | 'deposit' | 'redeem' | 'adjustment';

// ── Helpers ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  deposit:    'Setoran',
  redeem:     'Penukaran',
  adjustment: 'Penyesuaian',
};

const TYPE_VARIANT: Record<string, BadgeVariant> = {
  deposit:    'success',
  redeem:     'pending',
  adjustment: 'neutral',
};

function pointSign(type: string, points: number): string {
  const plus  = type === 'deposit' || type === 'adjustment' && points > 0;
  const minus = type === 'redeem'  || type === 'adjustment' && points < 0;
  if (plus)  return `+${Math.abs(points).toLocaleString('id-ID')}`;
  if (minus) return `−${Math.abs(points).toLocaleString('id-ID')}`;
  return `${points.toLocaleString('id-ID')}`;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PointsPage() {
  const { toast } = useToast();

  const [txs, setTxs]           = useState<PointTx[]>([]);
  const [meta, setMeta]         = useState<Meta | null>(null);
  const [page, setPage]         = useState(1);
  const [filter, setFilter]     = useState<TxType>('');
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async (p: number, t: TxType) => {
    setLoading(true);
    const qs = t ? `?type=${t}&page=${p}` : `?page=${p}`;
    try {
      const res = await api.get<{ data: PointTx[]; meta: Meta }>(`/user/points${qs}`);
      setTxs(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(page, filter); }, [page, filter, load]);

  function handleFilter(t: TxType) {
    setFilter(t);
    setPage(1);
  }

  const FILTERS: { label: string; value: TxType }[] = [
    { label: 'Semua',       value: '' },
    { label: 'Setoran',     value: 'deposit' },
    { label: 'Penukaran',   value: 'redeem' },
    { label: 'Penyesuaian', value: 'adjustment' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Riwayat Poin"
        description="Semua transaksi poin akun kamu"
        eyebrow="Akun Saya"
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter jenis transaksi">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFilter(f.value)}
            className={[
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              filter === f.value
                ? 'bg-forest text-white'
                : 'bg-mist text-muted hover:bg-mint hover:text-forest',
            ].join(' ')}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card padded={false}>
        {loading ? (
          <PointListSkeleton />
        ) : txs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Coins size={32} className="text-line" aria-hidden="true" />
            <p className="text-sm text-muted">Belum ada transaksi poin.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line" role="list">
            {txs.map((tx) => (
              <li key={tx.id} className="flex items-center gap-4 px-5 py-4">
                {/* Badge tipe */}
                <Badge variant={TYPE_VARIANT[tx.type] ?? 'neutral'}>
                  {TYPE_LABELS[tx.type] ?? tx.type}
                </Badge>

                {/* Deskripsi */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">{tx.description}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(tx.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {' · '}saldo: {tx.balance_after.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Nilai poin */}
                <span
                  className={[
                    'shrink-0 text-sm font-semibold tabular-nums',
                    tx.type === 'redeem' ? 'text-danger' : 'text-forest',
                  ].join(' ')}
                  aria-label={`${pointSign(tx.type, tx.points)} poin`}
                >
                  {pointSign(tx.type, tx.points)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <p className="text-xs text-muted">
              Halaman {meta.current_page} dari {meta.last_page}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg
                           border border-line text-muted hover:bg-mist
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={page >= (meta.last_page ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg
                           border border-line text-muted hover:bg-mist
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function PointListSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-label="Memuat riwayat..." role="list">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-5 w-16 animate-pulse rounded-full bg-line" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-line" />
            <div className="h-3 w-28 animate-pulse rounded bg-line" />
          </div>
          <div className="h-4 w-12 animate-pulse rounded bg-line" />
        </li>
      ))}
    </ul>
  );
}
