'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  PageHeader, StatCard, Card, CardHeader,
  StatusBadge, Button, SkeletonStatCard,
} from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Scale, Users, ArrowDownToLine,
  CircleAlert, ArrowRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────

interface StatsData {
  deposits_today:    number;
  total_kg_today:    number;
  unique_depositors: number;
  per_category: Array<{
    category_id:   number;
    category_name: string;
    category_slug: string;
    total_kg:      number;
    total_points:  number;
  }>;
  range_days: number;
}

const CHART_COLORS = [
  '#1f8a5b', '#059669', '#10b981', '#34d399',
  '#6ee7b7', '#a7f3d0', '#0891b2', '#0ea5e9',
];

// ── Page ──────────────────────────────────────────────────────────────────

export default function WasteBankDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router  = useRouter();
  const wb      = user?.waste_bank;

  const [stats, setStats]       = useState<StatsData | null>(null);
  const [range, setRange]       = useState<7 | 30>(7);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async (r: 7 | 30) => {
    setLoadingStats(true);
    try {
      const { data } = await api.get<{ data: StatsData }>(
        `/waste-bank/stats?range=${r}`
      );
      setStats(data);
    } catch {
      /* stats gagal — dashboard tetap tampil tanpa angka */
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (wb?.verification_status === 'verified') {
      loadStats(range);
    } else {
      setLoadingStats(false);
    }
  }, [wb?.verification_status, range, loadStats]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-line" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Ringkasan"
        description={wb?.name ?? 'Bank Sampah'}
        action={
          <Button
            icon={ArrowDownToLine} size="sm"
            onClick={() => router.push('/waste-bank/deposits/new')}
          >
            Input Setoran
          </Button>
        }
      />

      {/* Banner verifikasi */}
      {wb && wb.verification_status !== 'verified' && (
        <div className="flex items-start gap-3 rounded-xl border border-sun bg-sun px-4 py-3">
          <CircleAlert size={16} className="mt-0.5 shrink-0 text-sun-ink" aria-hidden="true" />
          <p className="text-sm text-sun-ink">
            <span className="font-semibold">Akun belum diverifikasi.</span>{' '}
            {wb.verification_status === 'pending'
              ? 'Permintaan Anda sedang ditinjau oleh developer.'
              : 'Pendaftaran Anda ditolak — hubungi administrator.'}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loadingStats ? (
          <><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></>
        ) : (
          <>
            <StatCard
              icon={ArrowDownToLine}
              label="Setoran Hari Ini"
              value={stats?.deposits_today ?? 0}
              unit="setoran"
            />
            <StatCard
              icon={Scale}
              label="Total Berat Hari Ini"
              value={stats ? Number(stats.total_kg_today).toFixed(1) : '0'}
              unit="kg"
              iconClass="text-forest"
            />
            <StatCard
              icon={Users}
              label="Penyetor Unik"
              value={stats?.unique_depositors ?? 0}
              unit="orang"
              iconClass="text-sun-ink"
            />
          </>
        )}
      </div>

      {/* Grafik per kategori */}
      {wb?.verification_status === 'verified' && (
        <Card>
          <CardHeader
            title="Berat per Kategori"
            description={`${range} hari terakhir`}
            action={
              <div className="flex gap-1">
                {([7, 30] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={[
                      'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                      range === r
                        ? 'bg-forest text-white'
                        : 'bg-mist text-muted hover:bg-mint',
                    ].join(' ')}
                  >
                    {r}h
                  </button>
                ))}
              </div>
            }
          />

          {loadingStats ? (
            <div className="h-48 animate-pulse rounded-xl bg-line" />
          ) : !stats?.per_category.length ? (
            <p className="py-12 text-center text-sm text-muted">
              Belum ada data setoran dalam {range} hari terakhir.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats.per_category}
                margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e6dd" />
                <XAxis
                  dataKey="category_name"
                  tick={{ fontSize: 11, fill: '#6b8279' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b8279' }}
                  tickLine={false}
                  axisLine={false}
                  unit=" kg"
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${Number(v ?? 0).toFixed(2)} kg`, 'Berat']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="total_kg" radius={[4, 4, 0, 0]}>
                  {stats.per_category.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {/* Info bank sampah */}
      {wb && (
        <Card>
          <CardHeader
            title="Informasi Bank Sampah"
            action={
              <Button
                variant="ghost" size="sm" icon={ArrowRight}
                onClick={() => router.push('/waste-bank/profile')}
              >
                Edit Profil
              </Button>
            }
          />
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <InfoRow label="Status verifikasi">
              <StatusBadge status={wb.verification_status} />
            </InfoRow>
            <InfoRow label="Status operasional">
              <StatusBadge
                status={wb.is_open ? 'open' : 'closed'}
                label={wb.is_open ? 'Buka' : 'Tutup'}
                variant={wb.is_open ? 'success' : 'neutral'}
              />
            </InfoRow>
            <InfoRow label="Alamat">
              <span className="text-ink">{wb.address}</span>
            </InfoRow>
            <InfoRow label="Telepon">
              <span className="text-ink">{wb.phone}</span>
            </InfoRow>
          </dl>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickLink
          href="/waste-bank/deposits/new"
          label="Input Setoran Baru"
          description="Catat setoran sampah dari anggota"
          icon={ArrowDownToLine}
        />
        <QuickLink
          href="/waste-bank/deposits"
          label="Lihat Rekapan"
          description="Riwayat semua setoran"
          icon={Scale}
        />
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function QuickLink({
  href, label, description, icon: Icon,
}: {
  href: string; label: string; description: string; icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-line bg-white
                 p-4 transition-colors hover:border-leaf hover:bg-mist"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center
                   rounded-xl bg-mist text-leaf group-hover:bg-mint"
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <ArrowRight
        size={16}
        className="ml-auto shrink-0 text-line transition-colors group-hover:text-leaf"
        aria-hidden="true"
      />
    </Link>
  );
}
