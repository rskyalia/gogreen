'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { useToast } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { ArrowLeft, MapPin, Phone, Clock, Navigation, Tag, Info } from 'lucide-react';

interface BankDetail {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  description: string | null;
  is_open: boolean;
  is_open_now: boolean;
  today_hours: string | null;
  opening_hours: Record<string, string>;
  accepted_categories: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    points_per_kg: number;
  }>;
}

const DAY_LABELS: Record<string, string> = {
  senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis',
  jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu',
};
const DAY_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

export default function WasteBankDetailClient({ id }: { id: string }) {
  const router    = useRouter();
  const { toast } = useToast();

  const [bank, setBank]       = useState<BankDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: BankDetail }>(`/user/waste-banks/${id}`)
      .then((res) => setBank(res.data))
      .catch((err) => {
        toast(firstError(err), 'error');
        router.replace('/waste-banks');
      })
      .finally(() => setLoading(false));
  }, [id, router, toast]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="h-7 w-36 animate-pulse rounded bg-line" />
        <div className="h-48 animate-pulse rounded-2xl bg-line" />
        <div className="h-32 animate-pulse rounded-2xl bg-line" />
      </div>
    );
  }

  if (!bank) return null;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${bank.latitude},${bank.longitude}`;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/waste-banks" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft size={14} aria-hidden="true" />
        Daftar Bank Sampah
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-medium text-forest">{bank.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', bank.is_open_now ? 'bg-mist text-forest' : 'bg-stone-100 text-muted'].join(' ')}>
              <span className={['h-1.5 w-1.5 rounded-full', bank.is_open_now ? 'bg-leaf' : 'bg-stone-400'].join(' ')} aria-hidden="true" />
              {bank.is_open_now ? 'Sedang buka' : 'Sedang tutup'}
            </span>
            {bank.today_hours && <span className="text-xs text-muted">{bank.today_hours}</span>}
          </div>
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-deep"
          aria-label={`Buka navigasi ke ${bank.name} di Google Maps`}>
          <Navigation size={13} aria-hidden="true" />
          Navigasi
        </a>
      </div>

      <Card>
        <div className="space-y-3">
          <InfoRow icon={MapPin} label="Alamat"   value={bank.address} />
          {bank.phone       && <InfoRow icon={Phone} label="Telepon"  value={bank.phone} />}
          {bank.description && <InfoRow icon={Info}  label="Tentang"  value={bank.description} />}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Clock size={16} className="text-forest" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">Jam Operasional</h2>
        </div>
        <dl className="space-y-1.5">
          {DAY_ORDER.map((key) => {
            const val = bank.opening_hours[key] ?? '-';
            const isTutup = val.toLowerCase() === 'tutup' || val === '-';
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <dt className="text-muted">{DAY_LABELS[key]}</dt>
                <dd className={isTutup ? 'text-muted' : 'text-ink'}>{val}</dd>
              </div>
            );
          })}
        </dl>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Tag size={16} className="text-forest" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-ink">Kategori Diterima</h2>
        </div>
        {bank.accepted_categories.length === 0 ? (
          <p className="text-sm text-muted">Belum ada kategori yang ditambahkan.</p>
        ) : (
          <ul className="space-y-2" role="list">
            {bank.accepted_categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between rounded-lg bg-paper px-3 py-2">
                <span className="text-sm text-ink">{cat.name}</span>
                <span className="text-xs font-medium text-forest">{cat.points_per_kg} poin/kg</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-0.5 text-sm text-ink">{value}</p>
      </div>
    </div>
  );
}
