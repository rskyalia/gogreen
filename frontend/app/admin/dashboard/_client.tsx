'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, CheckCircle, Activity,
  ArrowRight, Tag, BookOpen, ImageIcon, Gift,
  Clock, AlertTriangle, TrendingUp, Recycle,
  ShieldCheck, Zap, BarChart3, Layers,
  ChevronRight, Sparkles, Circle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatCard, SkeletonStatCard, TONE_CHIP } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────

interface AdminStats {
  users_by_role: Record<string, number>;
  total_users: number;
  total_scans: number;
  total_deposits: number;
  pending_diy_submissions: number;
  pending_waste_banks: number;
  ml_summary_24h: {
    total_calls: number;
    success_count: number;
    success_rate: number | null;
    avg_response_ms: number | null;
  };
}

interface MenuItem {
  href:  string;
  label: string;
  desc:  string;
  icon:  LucideIcon;
  tone:  'mint' | 'sun' | 'forest' | 'mist';
}

// ── Konstanta ─────────────────────────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
  { href: '/admin/waste-banks',     label: 'Verifikasi Mitra',   desc: 'Tinjau dan setujui pendaftaran bank sampah', icon: Building2,  tone: 'mint'   },
  { href: '/admin/users',           label: 'Kelola Pengguna',    desc: 'Akun warga, komunitas, dan petugas',         icon: Users,      tone: 'forest' },
  { href: '/admin/categories',      label: 'Kategori Sampah',    desc: 'Atur kategori & nilai poin per kg',          icon: Tag,        tone: 'sun'    },
  { href: '/admin/diy-guides',      label: 'Panduan DIY',        desc: 'Kelola panduan daur ulang komunitas',        icon: BookOpen,   tone: 'mist'   },
  { href: '/admin/diy-submissions', label: 'Validasi Karya',     desc: 'Tinjau kiriman karya pengguna',              icon: ImageIcon,  tone: 'sun'    },
  { href: '/admin/rewards',         label: 'Katalog Reward',     desc: 'Hadiah yang bisa ditukar poin',              icon: Gift,       tone: 'mint'   },
  { href: '/admin/ml-status',       label: 'Pantau API ML',      desc: 'Performa model AI scan sampah',              icon: Activity,   tone: 'forest' },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function MiniMetric({
  icon: Icon,
  label,
  value,
  warn = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/10">
        <Icon size={14} className="text-mint" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[11px] text-white/50">{label}</p>
        <p className={`text-sm font-semibold ${warn ? 'text-yellow-300' : 'text-white'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function HeroBanner({
  stats,
  loading,
}: {
  stats: AdminStats | null;
  loading: boolean;
}) {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Selamat pagi' :
    hour < 17 ? 'Selamat siang' :
    'Selamat malam';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-forest px-7 py-8 sm:px-10 sm:py-10">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-72 rounded-full bg-leaf/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-8 size-48 rounded-full bg-mint/15 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-6 right-[40%] size-32 rounded-full bg-sun/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative grid gap-8 md:grid-cols-[1fr_auto]">
        {/* Text block */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1">
            <Sparkles size={11} className="text-mint" aria-hidden="true" />
            <span className="text-xs font-medium text-mint">Developer Panel</span>
          </div>

          <h1 className="font-serif text-3xl font-medium leading-snug text-white sm:text-4xl">
            {greeting},{' '}
            <span className="text-mint">{user?.name?.split(' ')[0] ?? 'Developer'}</span>
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/65">
            Kawasi seluruh ekosistem GO GREEN dari satu panel —
            verifikasi mitra, kelola reward, dan pantau AI.
          </p>

          {/* Quick actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/admin/waste-banks?status=pending"
              className="flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-xs
                         font-semibold text-forest transition-colors hover:bg-white"
            >
              <CheckCircle size={13} aria-hidden="true" />
              Verifikasi mitra
            </Link>
            <Link
              href="/admin/ml-status"
              className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2
                         text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              <BarChart3 size={13} aria-hidden="true" />
              Monitor API ML
            </Link>
          </div>
        </div>

        {/* Mini metric strip — desktop only */}
        <div className="hidden flex-col justify-center gap-4 border-l border-white/10 pl-8 md:flex">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-32 animate-pulse rounded-lg bg-white/10" />
              ))}
            </div>
          ) : stats ? (
            <>
              <MiniMetric icon={Recycle}   label="Total Scan"      value={stats.total_scans.toLocaleString('id-ID')} />
              <MiniMetric icon={Layers}    label="Setoran"          value={stats.total_deposits.toLocaleString('id-ID')} />
              <MiniMetric
                icon={Zap}
                label="ML Sukses 24h"
                value={stats.ml_summary_24h.success_rate != null ? `${stats.ml_summary_24h.success_rate}%` : '—'}
                warn={stats.ml_summary_24h.success_rate != null && stats.ml_summary_24h.success_rate < 90}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function MenuCard({ item, badge }: { item: MenuItem; badge?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border
                 border-line bg-white p-5 transition-all duration-200
                 hover:-translate-y-0.5 hover:border-leaf/40 hover:shadow-lg hover:shadow-forest/5"
    >
      {badge != null && badge > 0 && (
        <span
          className="absolute right-4 top-4 rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold text-sun-ink"
          aria-label={`${badge} item menunggu`}
        >
          {badge}
        </span>
      )}
      <span
        className={`grid size-12 place-items-center rounded-2xl ${TONE_CHIP[item.tone]}`}
        aria-hidden="true"
      >
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-ink">{item.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.desc}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-leaf opacity-0 transition-opacity group-hover:opacity-100">
        Buka <ChevronRight size={13} aria-hidden="true" />
      </div>
    </Link>
  );
}

function QueueCard({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  const items = stats
    ? [
        { href: '/admin/waste-banks?status=pending',    label: 'Bank Sampah', count: stats.pending_waste_banks,     icon: Building2, tone: 'mint' as const },
        { href: '/admin/diy-submissions?status=pending', label: 'Karya DIY',  count: stats.pending_diy_submissions, icon: ImageIcon, tone: 'sun'  as const },
      ]
    : [];

  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-ink">Antrian</p>
          <p className="text-xs text-muted">Perlu tindakan segera</p>
        </div>
        <Clock size={16} className="text-muted" aria-hidden="true" />
      </div>
      <div className="divide-y divide-line">
        {loading
          ? [1, 2].map((i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-5 w-3/4 animate-pulse rounded-md bg-line" />
              </div>
            ))
          : items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-mist"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-xl ${TONE_CHIP[item.tone]}`}
                      aria-hidden="true"
                    >
                      <Icon size={14} />
                    </span>
                    <span className="text-sm font-medium text-ink">{item.label}</span>
                  </div>
                  {item.count > 0 ? (
                    <span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold text-sun-ink">
                      {item.count}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Circle size={6} className="fill-leaf text-leaf" />
                      Kosong
                    </div>
                  )}
                </Link>
              );
            })}
      </div>
    </div>
  );
}

function RolePillStrip({ stats }: { stats: AdminStats }) {
  const ROLE_CONFIG: Record<string, { label: string; tone: 'mint' | 'sun' | 'forest' | 'mist' }> = {
    user:       { label: 'Warga',       tone: 'mist'   },
    waste_bank: { label: 'Bank Sampah', tone: 'mint'   },
    community:  { label: 'Komunitas',   tone: 'sun'    },
    developer:  { label: 'Developer',   tone: 'forest' },
  };
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(stats.users_by_role)
        .filter(([, v]) => v > 0)
        .map(([role, count]) => {
          const cfg = ROLE_CONFIG[role] ?? { label: role, tone: 'mist' as const };
          return (
            <span
              key={role}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${TONE_CHIP[cfg.tone]}`}
            >
              {cfg.label}
              <span className="font-bold">{count}</span>
            </span>
          );
        })}
    </div>
  );
}

function SummaryRow({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <div className="flex items-center gap-2.5 text-sm text-muted">
        <Icon size={14} className="shrink-0 text-leaf" aria-hidden="true" />
        {label}
      </div>
      <span className="text-sm font-semibold text-ink">
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
      </span>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────

export default function DeveloperDashboardClient() {
  const { toast } = useToast();
  const [stats, setStats]     = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<{ data: AdminStats }>('/admin/stats');
      setStats(res.data);
    } catch (err) {
      toast(firstError(err, 'Gagal memuat statistik.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const mlAlert =
    stats?.ml_summary_24h.success_rate != null &&
    stats.ml_summary_24h.success_rate < 90;

  const pendingBanks = stats?.pending_waste_banks ?? 0;
  const pendingDiy   = stats?.pending_diy_submissions ?? 0;

  const statCards = stats
    ? [
        { icon: Building2,   label: 'Bank Sampah',          value: stats.users_by_role.waste_bank ?? 0, unit: 'mitra',    tone: 'mint'   as const },
        { icon: ShieldCheck, label: 'Menunggu Verifikasi',  value: stats.pending_waste_banks,           unit: 'pending',  tone: 'sun'    as const, trend: stats.pending_waste_banks > 0 ? 'Butuh tindakan' : 'Semua beres' },
        { icon: Users,       label: 'Total Pengguna',       value: stats.total_users,                   unit: 'akun',     tone: 'forest' as const },
        { icon: TrendingUp,  label: 'API ML (24 jam)',      value: stats.ml_summary_24h.total_calls,    unit: 'call',     tone: 'mist'   as const, trend: stats.ml_summary_24h.success_rate != null ? `${stats.ml_summary_24h.success_rate}% sukses` : undefined },
      ]
    : [];

  return (
    <div className="space-y-6 pb-8">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroBanner stats={stats} loading={loading} />

      {/* ── ML alert ─────────────────────────────────────────────────────── */}
      {mlAlert && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-danger-soft
                     bg-danger-soft/60 px-4 py-3.5"
          role="alert"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <div className="text-sm text-danger">
            <span className="font-semibold">Peringatan ML — </span>
            Success rate berada di <strong>{stats!.ml_summary_24h.success_rate}%</strong>, di bawah ambang 90%.{' '}
            <Link href="/admin/ml-status" className="underline underline-offset-2">
              Periksa sekarang →
            </Link>
          </div>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <section aria-label="Statistik ringkasan">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
            : statCards.map((s) => (
                <StatCard
                  key={s.label}
                  icon={s.icon}
                  label={s.label}
                  value={s.value}
                  unit={s.unit}
                  tone={s.tone}
                  trend={s.trend}
                />
              ))}
        </div>
      </section>

      {/* ── Menu + sidebar ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        {/* Menu grid */}
        <section aria-label="Manajemen platform">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">Manajemen Platform</h2>
              <p className="text-xs text-muted">Akses cepat ke semua fitur administrasi</p>
            </div>
            <Activity size={16} className="text-muted" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            {MENU_ITEMS.map((item) => {
              const badge =
                item.href.includes('waste-banks')       ? pendingBanks :
                item.href.includes('diy-submissions')   ? pendingDiy   :
                undefined;
              return <MenuCard key={item.href} item={item} badge={badge} />;
            })}
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="space-y-4" aria-label="Panel samping">
          <QueueCard stats={stats} loading={loading} />

          {(loading || stats) && (
            <div className="rounded-2xl border border-line bg-white px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Ringkasan Data</p>
                <Layers size={14} className="text-muted" aria-hidden="true" />
              </div>
              {loading ? (
                <div className="space-y-2.5">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-5 animate-pulse rounded-md bg-line" />
                  ))}
                </div>
              ) : stats ? (
                <div className="divide-y divide-line">
                  <SummaryRow icon={Recycle} label="Total Scan"     value={stats.total_scans} />
                  <SummaryRow icon={Layers}  label="Total Setoran"  value={stats.total_deposits} />
                </div>
              ) : null}
            </div>
          )}

          {stats && (
            <div className="rounded-2xl border border-line bg-white px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Pengguna per Role</p>
                <Users size={14} className="text-muted" aria-hidden="true" />
              </div>
              <RolePillStrip stats={stats} />
            </div>
          )}
        </aside>
      </div>

      <p className="text-center text-xs text-muted/60">
        GO GREEN Developer Panel · Akses terbatas
      </p>
    </div>
  );
}
