'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Scale, Users, ArrowDownToLine, CircleAlert,
  ArrowRight, ClipboardList, Sprout, Package,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardHeader, StatusBadge, Button, SkeletonStatCard } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-md hover:shadow-forest/5">
      <span className={`grid size-11 place-items-center rounded-2xl ${tone}`} aria-hidden>
        <Icon className="size-5" />
      </span>
      <p className="mt-5 font-serif text-4xl font-medium leading-none text-forest">
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        {unit && (
          <span className="ml-1.5 font-sans text-base font-normal text-muted">{unit}</span>
        )}
      </p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </div>
  );
}

// ── Quick Link ─────────────────────────────────────────────────────────────

function QuickLink({
  href, label, description, icon: Icon, tone,
}: {
  href: string; label: string; description: string;
  icon: LucideIcon; tone: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-line bg-white
                 p-4 transition-colors hover:border-leaf hover:bg-mist"
    >
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tone}`}
        aria-hidden
      >
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <ArrowRight
        size={16}
        className="ml-auto shrink-0 text-line transition-colors group-hover:text-leaf"
        aria-hidden
      />
    </Link>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function WasteBankDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const wb = user?.waste_bank;

  const [stats, setStats]             = useState<StatsData | null>(null);
  const [range, setRange]             = useState<7 | 30>(7);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async (r: 7 | 30) => {
    setLoadingStats(true);
    try {
      const { data } = await api.get<{ data: StatsData }>(`/waste-bank/stats?range=${r}`);
      setStats(data);
    } catch {
      /* tampil tanpa angka */
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (wb?.verification_status === 'verified') loadStats(range);
    else setLoadingStats(false);
  }, [wb?.verification_status, range, loadStats]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-md bg-line" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
            Bank Sampah
          </p>
          <h1 className="mt-2 flex items-center gap-3 font-serif text-3xl font-medium text-forest sm:text-4xl">
            {wb?.name ?? 'Dashboard'}
            <span className="grid size-9 rotate-12 place-items-center rounded-full bg-mint text-leaf">
              <Sprout className="size-5" aria-hidden />
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            {wb?.verification_status === 'verified'
              ? 'Pantau setoran, berat, dan penyetor hari ini.'
              : 'Akun Anda sedang menunggu verifikasi dari developer.'}
          </p>
        </div>
      </header>

      {/* ── Banner verifikasi ── */}
      {wb && wb.verification_status !== 'verified' && (
        <div className="flex items-start gap-3 rounded-xl border border-sun bg-sun px-4 py-3">
          <CircleAlert size={16} className="mt-0.5 shrink-0 text-sun-ink" aria-hidden />
          <p className="text-sm text-sun-ink">
            <span className="font-semibold">Akun belum diverifikasi.</span>{' '}
            {wb.verification_status === 'pending'
              ? 'Permintaan Anda sedang ditinjau oleh developer.'
              : 'Pendaftaran Anda ditolak — hubungi administrator.'}
          </p>
        </div>
      )}

      {/* ── Hero banner ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="grid overflow-hidden rounded-xl bg-mint md:grid-cols-[1.1fr_1fr] lg:col-span-2">
          <div className="p-7 sm:p-8">
            <p className="font-serif italic text-leaf">Dream It. Build It. Change It.</p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-forest">
              {wb?.verification_status === 'verified'
                ? `Selamat bertugas, ${wb.name}!`
                : 'Bergabunglah menjaga bumi bersama kami'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">
              Catat setoran anggota, pantau berat per kategori, dan bantu warga
              menukar sampah menjadi poin dan reward.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push('/waste-bank/deposits/new')}
                className="flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
              >
                <ArrowDownToLine className="size-4" aria-hidden />
                Input Setoran
              </button>
              <button
                type="button"
                onClick={() => router.push('/waste-bank/deposits')}
                className="rounded-xl border border-forest/30 px-5 py-3 text-sm font-semibold text-forest transition-colors hover:bg-white/60"
              >
                Lihat Rekapan
              </button>
            </div>
          </div>
          <div className="relative min-h-56">
            <Image
              src="/landing.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 280px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </section>

        {/* Info bank sampah */}
        {wb && (
          <section className="flex flex-col rounded-xl border border-line bg-white p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Profil Bank Sampah</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/waste-bank/profile')}
              >
                Edit
              </Button>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-full border border-dashed border-forest/40 bg-mint text-forest">
                <Sprout className="size-7" aria-hidden />
              </span>
              <div>
                <p className="font-serif text-xl font-medium text-forest">{wb.name}</p>
                <p className="text-xs text-muted">{wb.address}</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-y-3 text-sm">
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
              <InfoRow label="Telepon">
                <span className="text-ink">{wb.phone}</span>
              </InfoRow>
            </dl>
          </section>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loadingStats ? (
          <><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></>
        ) : (
          <>
            <StatCard icon={ArrowDownToLine} label="Setoran Hari Ini"   value={stats?.deposits_today ?? 0}                        unit="setoran" tone="bg-mint text-forest"    />
            <StatCard icon={Scale}           label="Total Berat Hari Ini" value={stats ? Number(stats.total_kg_today).toFixed(1) : '0'} unit="kg"      tone="bg-forest text-mint"   />
            <StatCard icon={Users}           label="Penyetor Unik"      value={stats?.unique_depositors ?? 0}                     unit="orang"   tone="bg-sun text-sun-ink"   />
          </>
        )}
      </div>

      {/* ── Grafik per kategori ── */}
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
                      range === r ? 'bg-forest text-white' : 'bg-mist text-muted hover:bg-mint',
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
              <BarChart data={stats.per_category} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e6dd" />
                <XAxis dataKey="category_name" tick={{ fontSize: 11, fill: '#6b8279' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b8279' }} tickLine={false} axisLine={false} unit=" kg" />
                <Tooltip
                  formatter={(v: unknown) => [`${Number(v ?? 0).toFixed(2)} kg`, 'Berat']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="total_kg" radius={[4, 4, 0, 0]}>
                  {stats.per_category.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {/* ── Quick links ── */}
      <section>
        <h2 className="mb-3 font-serif text-xl font-medium text-forest">Akses Cepat</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickLink href="/waste-bank/deposits/new"      label="Input Setoran Baru"  description="Catat setoran sampah dari anggota"   icon={ArrowDownToLine} tone="bg-mint text-forest"  />
          <QuickLink href="/waste-bank/deposits"           label="Lihat Rekapan"        description="Riwayat semua setoran"              icon={ClipboardList}   tone="bg-forest text-mint"  />
          <QuickLink href="/waste-bank/material-requests" label="Request Bahan"         description="Ajukan kebutuhan material daur ulang" icon={Package}         tone="bg-sun text-sun-ink"  />
          <QuickLink href="/waste-bank/profile"            label="Edit Profil"           description="Perbarui data bank sampah Anda"     icon={Sprout}          tone="bg-mist text-leaf"    />
        </div>
      </section>

    </div>
  );
}
