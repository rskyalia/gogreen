'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, useToast } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { ArrowLeft, Scale, Coins, CalendarDays, Building2 } from 'lucide-react';

interface DepositDetail {
  id: number;
  waste_bank_name: string;
  total_weight_kg: number;
  total_points: number;
  notes: string | null;
  items: Array<{
    id: number;
    waste_category: { id: number; name: string };
    weight_kg: number;
    points: number;
  }>;
  created_at: string;
}

export default function DepositDetailClient({ id }: { id: string }) {
  const router    = useRouter();
  const { toast } = useToast();

  const [deposit, setDeposit] = useState<DepositDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: DepositDetail }>(`/user/deposits/${id}`)
      .then((res) => setDeposit(res.data))
      .catch((err) => {
        toast(firstError(err), 'error');
        router.replace('/deposits');
      })
      .finally(() => setLoading(false));
  }, [id, router, toast]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="h-7 w-32 animate-pulse rounded bg-line" />
        <div className="h-60 animate-pulse rounded-2xl bg-line" />
      </div>
    );
  }

  if (!deposit) return null;

  const date = new Date(deposit.created_at);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link
        href="/deposits"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Riwayat Setoran
      </Link>

      <h1 className="font-serif text-2xl font-medium text-forest">Detail Setoran</h1>

      <Card>
        <dl className="grid grid-cols-2 gap-4">
          <InfoItem icon={Building2}    label="Bank Sampah" value={deposit.waste_bank_name} />
          <InfoItem
            icon={CalendarDays}
            label="Tanggal"
            value={date.toLocaleDateString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          />
          <InfoItem icon={Scale} label="Total Berat" value={`${Number(deposit.total_weight_kg).toFixed(2)} kg`} />
          <InfoItem
            icon={Coins}
            label="Poin Diperoleh"
            value={`+${deposit.total_points.toLocaleString('id-ID')}`}
            valueClass="font-semibold text-forest"
          />
        </dl>
        {deposit.notes && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-medium text-muted">Catatan</p>
            <p className="mt-1 text-sm text-ink">{deposit.notes}</p>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">Rincian Item</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="pb-2 text-xs font-medium text-muted">Kategori</th>
              <th className="pb-2 text-right text-xs font-medium text-muted">Berat</th>
              <th className="pb-2 text-right text-xs font-medium text-muted">Poin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {deposit.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 text-ink">{item.waste_category.name}</td>
                <td className="py-2.5 text-right text-muted">{Number(item.weight_kg).toFixed(2)} kg</td>
                <td className="py-2.5 text-right font-medium text-forest">+{item.points.toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line font-semibold">
              <td className="pt-3 text-ink">Total</td>
              <td className="pt-3 text-right text-muted">{Number(deposit.total_weight_kg).toFixed(2)} kg</td>
              <td className="pt-3 text-right text-forest">+{deposit.total_points.toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  valueClass = 'text-ink',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Icon size={12} aria-hidden="true" />
        {label}
      </dt>
      <dd className={`text-sm ${valueClass}`}>{value}</dd>
    </div>
  );
}
