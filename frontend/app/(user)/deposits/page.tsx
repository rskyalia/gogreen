'use client';

/**
 * /deposits  — riwayat setoran user (paginasi)
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, Button } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';
import { ChevronLeft, ChevronRight, ArrowDownToLine, ArrowRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

interface DepositRow {
  id: number;
  waste_bank_name: string;
  total_weight_kg: number;
  total_points: number;
  created_at: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function UserDepositsPage() {
  const { toast } = useToast();

  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [meta, setMeta]         = useState<Meta | null>(null);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: DepositRow[]; meta: Meta }>(
        `/user/deposits?page=${p}`
      );
      setDeposits(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Riwayat Setoran"
        description="Semua setoran sampah yang pernah kamu catat"
        eyebrow="Akun Saya"
      />

      <Card padded={false}>
        {loading ? (
          <DepositListSkeleton />
        ) : deposits.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <ArrowDownToLine size={32} className="text-line" aria-hidden="true" />
            <p className="text-sm text-muted">Belum ada setoran.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line" role="list">
            {deposits.map((dep) => (
              <li key={dep.id}>
                <Link
                  href={`/deposits/${dep.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4
                             hover:bg-mist/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">
                      {dep.waste_bank_name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(dep.created_at).toLocaleDateString('id-ID', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {' · '}{Number(dep.total_weight_kg).toFixed(2)} kg
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-forest text-sm">
                      +{dep.total_points.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-muted">poin</span>
                    <ArrowRight size={14} className="text-line" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <p className="text-xs text-muted">
              Halaman {meta.current_page} dari {meta.last_page} · {meta.total} setoran
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

function DepositListSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-label="Memuat setoran..." role="list">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-44 animate-pulse rounded bg-line" />
            <div className="h-3 w-28 animate-pulse rounded bg-line" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-line" />
        </li>
      ))}
    </ul>
  );
}
