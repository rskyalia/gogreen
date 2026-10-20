'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, CheckCircle, Activity,
  ArrowRight, Tag, BookOpen, Image, Gift,
  Clock, AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  PageHeader, StatCard, Card, CardHeader,
  StatusBadge, SkeletonStatCard,
} from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

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
}

const MENU_ITEMS: MenuItem[] = [
  { href: '/admin/waste-banks',     label: 'Verifikasi Mitra',  desc: 'Tinjau dan setujui pendaftaran bank sampah baru',  icon: CheckCircle },
  { href: '/admin/users',           label: 'Pengguna',          desc: 'Kelola akun warga, komunitas, dan petugas',        icon: Users       },
  { href: '/admin/categories',      label: 'Kategori Sampah',   desc: 'Atur kategori dan nilai poin per kg',              icon: Tag         },
  { href: '/admin/diy-guides',      label: 'Panduan DIY',       desc: 'Kelola panduan daur ulang untuk komunitas',        icon: BookOpen    },
  { href: '/admin/diy-submissions', label: 'Validasi Karya',    desc: 'Tinjau kiriman karya daur ulang pengguna',         icon: Image       },
  { href: '/admin/rewards',         label: 'Katalog Reward',    desc: 'Atur hadiah yang bisa ditukar dengan poin',        icon: Gift        },
  { href: '/admin/ml-status',       label: 'Pantau API ML',     desc: 'Monitor log dan performa model AI scan sampah',    icon: Activity    },
];

// ── Page ──────────────────────────────────────────────────────────────────

export default function DeveloperDashboardPage() {
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

  const statCards = stats ? [
    {
      icon: Building2,
      label: 'Bank Sampah Aktif',
      value: stats.users_by_role.waste_bank ?? 0,
      unit: 'mitra',
      iconClass: 'text-leaf',
    },
    {
      icon: CheckCircle,
      label: 'Menunggu Verifikasi',
      value: stats.pending_waste_banks,
      unit: 'pending',
      iconClass: 'text-sun-ink',
    },
    {
      icon: Users,
      label: 'Total Pengguna',
      value: stats.total_users,
      unit: 'akun',
      iconClass: 'text-forest',
    },
    {
      icon: Activity,
      label: 'API ML (24 jam)',
      value: stats.ml_summary_24h.total_calls,
      unit: 'panggilan',
      iconClass: 'text-muted',
      trend: stats.ml_summary_24h.success_rate != null
        ? `${stats.ml_summary_24h.success_rate}% sukses`
        : undefined,
    },
  ] : [];

  const pendingItems = stats ? [
    {
      href: '/admin/waste-banks?status=pending',
      label: 'Bank Sampah Pending',
      count: stats.pending_waste_banks,
      icon: Building2,
    },
    {
      href: '/admin/diy-submissions?status=pending',
      label: 'Karya DIY Pending',
      count: stats.pending_diy_submissions,
      icon: Clock,
    },
  ] : [];

  const mlAlert = stats?.ml_summary_24h.success_rate != null &&
    stats.ml_summary_24h.success_rate < 90;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ringkasan"
        description="Panel kendali platform GO GREEN"
      />

      {/* ML warning banner */}
      {mlAlert && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <p className="text-sm text-danger">
            <span className="font-semibold">Peringatan ML:</span>{' '}
            Success rate API ML berada di{' '}
            {stats!.ml_summary_24h.success_rate}% — di bawah ambang 90%.{' '}
            <Link href="/admin/ml-status" className="underline">Lihat detail</Link>
          </p>
        </div>
      )}

      {/* Stat cards */}
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
                iconClass={s.iconClass}
                trend={s.trend}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Menu grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Manajemen Platform"
              description="Akses cepat ke semua fitur administrasi"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-lg border border-line
                               bg-paper px-4 py-3 transition-colors hover:border-leaf hover:bg-mist"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center
                                 rounded-lg bg-mist text-leaf group-hover:bg-mint"
                      aria-hidden="true"
                    >
                      <Icon size={16} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{item.label}</p>
                      <p className="truncate text-xs text-muted">{item.desc}</p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-line transition-colors group-hover:text-leaf"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Antrian pending */}
        <div>
          <Card>
            <CardHeader title="Antrian" description="Item yang butuh perhatian" />
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-line" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-lg border
                                 border-line bg-paper px-3 py-2.5 text-sm hover:bg-mist transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-muted" aria-hidden="true" />
                        <span className="font-medium text-ink">{item.label}</span>
                      </div>
                      {item.count > 0 ? (
                        <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-semibold text-sun-ink">
                          {item.count}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Kosong</span>
                      )}
                    </Link>
                  );
                })}

                {/* Stats tambahan */}
                {stats && (
                  <div className="mt-4 border-t border-line pt-4 space-y-1.5 text-xs text-muted">
                    <div className="flex justify-between">
                      <span>Total scan</span>
                      <span className="font-semibold text-ink">
                        {stats.total_scans.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total setoran</span>
                      <span className="font-semibold text-ink">
                        {stats.total_deposits.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pengguna per role</span>
                      <div className="flex gap-1">
                        {Object.entries(stats.users_by_role)
                          .filter(([, v]) => v > 0)
                          .map(([role, count]) => (
                            <StatusBadge key={role} status={role} label={`${role}: ${count}`} />
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        GO GREEN Developer Panel — akses terbatas untuk role developer
      </p>
    </div>
  );
}
