'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, StatusBadge, Skeleton, useToast } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

interface DepositDetail {
  id:              number;
  total_weight_kg: number;
  total_points:    number;
  notes:           string | null;
  created_at:      string;
  member: { id: number; name: string; member_code: string } | null;
  recorded_by: { id: number; name: string } | null;
  items: Array<{
    waste_category: { id: number; name: string };
    weight_kg:      number;
    points:         number;
  }>;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function DepositDetailClient({ id }: { id: string }) {
  const { toast } = useToast();

  const [deposit, setDeposit]   = useState<DepositDetail | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get<{ data: DepositDetail }>(`/waste-bank/deposits/${id}`)
      .then(({ data }) => setDeposit(data))
      .catch((err) => toast(firstError(err), 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-danger">Setoran tidak ditemukan.</p>
        <Link href="/waste-bank/deposits" className="mt-2 inline-flex items-center gap-1.5 text-sm text-leaf hover:underline">
          <ArrowLeft size={14} /> Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/waste-bank/deposits"
          className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          Rekapan
        </Link>
      </div>

      <PageHeader
        title={`Setoran #${deposit.id}`}
        description={new Date(deposit.created_at).toLocaleString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      />

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-xs text-muted">Total Berat</p>
          <p className="font-serif text-2xl font-semibold text-ink mt-1">
            {Number(deposit.total_weight_kg).toFixed(2)}
            <span className="text-sm font-sans font-normal text-muted ml-1">kg</span>
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-muted">Total Poin</p>
          <p className="font-serif text-2xl font-semibold text-forest mt-1">
            +{deposit.total_points.toLocaleString('id-ID')}
          </p>
        </Card>
      </div>

      {/* Info member */}
      <Card>
        <h2 className="font-serif text-sm font-semibold text-ink mb-3">Informasi Member</h2>
        {deposit.member ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Nama</dt>
              <dd className="mt-0.5 font-medium text-ink">{deposit.member.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Kode Member</dt>
              <dd className="mt-0.5 font-mono text-ink">{deposit.member.member_code}</dd>
            </div>
            {deposit.recorded_by && (
              <div>
                <dt className="text-xs text-muted">Dicatat oleh</dt>
                <dd className="mt-0.5 text-ink">{deposit.recorded_by.name}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-muted">Data member tidak tersedia.</p>
        )}
      </Card>

      {/* Items */}
      <Card>
        <h2 className="font-serif text-sm font-semibold text-ink mb-3">Rincian Item</h2>
        <div className="divide-y divide-line">
          {deposit.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium text-ink">{item.waste_category.name}</span>
              <div className="flex items-center gap-4 text-right">
                <span className="text-muted">{Number(item.weight_kg).toFixed(2)} kg</span>
                <span className="text-forest font-semibold">+{item.points} poin</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Catatan */}
      {deposit.notes && (
        <Card>
          <p className="text-xs font-medium text-muted mb-1">Catatan</p>
          <p className="text-sm text-ink">{deposit.notes}</p>
        </Card>
      )}
    </div>
  );
}
