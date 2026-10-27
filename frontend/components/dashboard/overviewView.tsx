"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import Image from "next/image";
import {
    ArrowDownToLine,
    CalendarDays,
    Flame,
    Hammer,
    Recycle,
    ScanLine,
    Sprout,
    Trophy,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";
import NearbyBankMap from "@/components/dashboard/Nearbybankmap";
import { api, firstError } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

interface Transaction {
    id: number;
    type: string;
    points: number;
    description: string;
    created_at: string;
}

interface Summary {
    points_balance: number;
    total_kg: number;
    deposit_count: number;
    waste_scan_count: number;
    diy_submission_count: number;
    last_deposit: {
        id: number;
        waste_bank_name: string;
        total_kg: number;
        total_points: number;
        created_at: string;
    } | null;
    recent_transactions: Transaction[];
}

// ── Level system ──────────────────────────────────────────────────────────

const LEVELS = [
    { name: "Pemula",    min: 0,    next: 300 },
    { name: "Penjelajah", min: 300,  next: 700 },
    { name: "Visionary", min: 700,  next: 1500 },
    { name: "Builder",   min: 1500, next: 3000 },
    { name: "Champion",  min: 3000, next: 6000 },
    { name: "Legend",    min: 6000, next: Infinity },
] as const;

function getLevel(points: number) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].min) return LEVELS[i];
    }
    return LEVELS[0];
}

// ── Activity feed helpers ─────────────────────────────────────────────────

const TX_TYPE_CONFIG: Record<string, { Icon: LucideIcon; tone: string; label: string }> = {
    deposit:    { Icon: Recycle,          tone: "bg-forest text-mint",  label: "Setor ke bank sampah" },
    diy_approved: { Icon: Hammer,         tone: "bg-sun text-sun-ink",  label: "Karya DIY disetujui" },
    redeem:     { Icon: Trophy,           tone: "bg-mist text-leaf",    label: "Tukar poin reward" },
    adjustment: { Icon: TrendingUp,       tone: "bg-mist text-leaf",    label: "Penyesuaian poin" },
};

function txConfig(type: string) {
    return TX_TYPE_CONFIG[type] ?? { Icon: TrendingUp, tone: "bg-mist text-leaf", label: type };
}

function timeAgo(isoString: string): string {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60)  return "Baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 86400 * 2) return "Kemarin";
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} hari lalu`;
    return new Date(isoString).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// ── TodayChip ─────────────────────────────────────────────────────────────

const noopSubscribe = () => () => {};
const formatToday = () =>
    new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

function TodayChip() {
    const today = useSyncExternalStore(noopSubscribe, formatToday, () => "");
    return (
        <div className="flex min-w-[14rem] items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink/75">
            <CalendarDays className="size-4 shrink-0 text-forest" aria-hidden />
            <span>{today || "\u00A0"}</span>
        </div>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
                <div className="size-11 animate-pulse rounded-2xl bg-mist" />
                <div className="h-5 w-24 animate-pulse rounded-full bg-mist" />
            </div>
            <div className="mt-5 h-9 w-16 animate-pulse rounded-lg bg-mist" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded bg-mist" />
        </div>
    );
}

function JourneyCardSkeleton() {
    return (
        <div className="flex flex-col rounded-xl border border-line bg-white p-6">
            <div className="h-5 w-40 animate-pulse rounded bg-mist" />
            <div className="mt-5 flex items-center gap-4">
                <div className="size-16 animate-pulse rounded-full bg-mist" />
                <div className="space-y-2">
                    <div className="h-6 w-24 animate-pulse rounded bg-mist" />
                    <div className="h-3 w-20 animate-pulse rounded bg-mist" />
                </div>
            </div>
            <div className="mb-5 mt-5 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-mist" />
                <div className="h-2.5 w-full animate-pulse rounded-full bg-mist" />
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function OverviewView({ name, onScan }: { name: string; onScan: () => void }) {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading]  = useState(true);

    const loadSummary = useCallback(async () => {
        try {
            const res = await api.get<{ data: Summary }>("/user/summary");
            setSummary(res.data);
        } catch {
            // gagal silently — halaman tetap render dengan state kosong
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const points    = summary?.points_balance ?? 0;
    const level     = getLevel(points);
    const nextLevel = level.next === Infinity ? null : level.next;
    const percent   = nextLevel ? Math.min(100, Math.round(((points - level.min) / (nextLevel - level.min)) * 100)) : 100;
    const poinLeft  = nextLevel ? nextLevel - points : 0;

    const stats = [
        {
            label: "Sampah di-scan",
            value: loading ? null : String(summary?.waste_scan_count ?? 0),
            Icon: ScanLine,
            tone: "bg-mint text-forest",
        },
        {
            label: "Karya dibuat",
            value: loading ? null : String(summary?.diy_submission_count ?? 0),
            Icon: Hammer,
            tone: "bg-sun text-sun-ink",
        },
        {
            label: "Sampah disetor",
            value: loading ? null : `${(summary?.total_kg ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg`,
            Icon: Recycle,
            tone: "bg-forest text-mint",
        },
    ];

    const transactions = summary?.recent_transactions ?? [];
    const weekPoints   = transactions
        .filter((tx) => {
            const diff = (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 86400);
            return diff <= 7;
        })
        .reduce((s, tx) => s + tx.points, 0);

    return (
        <div className="space-y-5">
            {/* Header */}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
                        Ringkasan hari ini
                    </p>
                    <h1 className="mt-2 font-serif text-3xl font-medium text-forest sm:text-4xl">
                        Halo, {name}!
                    </h1>
                    {!loading && (
                        <p className="mt-2 text-sm text-muted">
                            {nextLevel
                                ? `${poinLeft.toLocaleString("id-ID")} poin lagi menuju ${LEVELS[LEVELS.findIndex((l) => l.name === level.name) + 1]?.name ?? "puncak"}.`
                                : `Selamat, kamu sudah mencapai level tertinggi!`}
                        </p>
                    )}
                </div>
                <TodayChip />
            </header>

            {/* Hero + Journey */}
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Hero banner */}
                <section className="grid overflow-hidden rounded-xl bg-mint md:grid-cols-[1.1fr_1fr] lg:col-span-2">
                    <div className="p-7 sm:p-8">
                        <p className="font-serif italic text-leaf">Dream It. Build It. Change It.</p>
                        <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-forest">
                            Foto sampahmu, lalu cari tahu bisa jadi apa
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-ink/75">
                            Upload foto, lihat jenis dan skor daur ulangnya, lalu pilih ide yang mau kamu buat.
                        </p>
                        <button
                            type="button"
                            onClick={onScan}
                            className="mt-6 flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                        >
                            <ScanLine className="size-4" aria-hidden />
                            Scan sampah
                        </button>
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

                {/* Journey card */}
                {loading ? (
                    <JourneyCardSkeleton />
                ) : (
                    <section className="flex flex-col rounded-xl border border-line bg-white p-6">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm font-semibold text-ink">Perjalanan hijaumu</h2>
                            <span className="flex items-center gap-1 rounded-full bg-sun px-3 py-1 text-xs font-semibold text-sun-ink">
                                <Flame className="size-3.5" aria-hidden />
                                {summary?.deposit_count ?? 0} setoran
                            </span>
                        </div>

                        <div className="mt-5 flex items-center gap-4">
                            <span className="grid size-16 shrink-0 place-items-center rounded-full border border-dashed border-forest/40 bg-mint text-forest">
                                <Sprout className="size-7" aria-hidden />
                            </span>
                            <div>
                                <p className="font-serif text-2xl font-medium text-forest">{level.name}</p>
                                <p className="text-xs text-muted">Level sekarang</p>
                            </div>
                        </div>

                        <div className="mb-5 mt-5">
                            <div className="flex justify-between text-xs">
                                <span className="text-ink">
                                    <b className="tabular-nums">{points.toLocaleString("id-ID")}</b>
                                    {nextLevel ? ` / ${nextLevel.toLocaleString("id-ID")} poin` : " poin"}
                                </span>
                                {nextLevel && (
                                    <span className="font-semibold text-forest">
                                        {LEVELS[LEVELS.findIndex((l) => l.name === level.name) + 1]?.name}
                                    </span>
                                )}
                            </div>
                            <div
                                className="mt-2 h-2.5 rounded-full bg-mist"
                                role="progressbar"
                                aria-valuenow={percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Progres menuju level ${nextLevel ? "berikutnya" : "tertinggi"}`}
                            >
                                <div className="h-full rounded-full bg-leaf transition-all duration-700" style={{ width: `${percent}%` }} />
                            </div>
                            {nextLevel && (
                                <p className="mt-2 text-xs text-muted">
                                    {poinLeft.toLocaleString("id-ID")} poin lagi
                                </p>
                            )}
                        </div>

                        {/* Setoran terakhir */}
                        {summary?.last_deposit ? (
                            <p className="mt-auto flex items-center gap-2 border-t border-line pt-4 text-sm text-muted">
                                <ArrowDownToLine className="size-4 text-forest" aria-hidden />
                                Terakhir: {summary.last_deposit.waste_bank_name} ·{" "}
                                <span className="font-semibold text-forest">
                                    +{summary.last_deposit.total_points.toLocaleString("id-ID")} poin
                                </span>
                            </p>
                        ) : (
                            <p className="mt-auto flex items-center gap-2 border-t border-line pt-4 text-sm text-muted">
                                <Trophy className="size-4 text-forest" aria-hidden />
                                Belum ada setoran
                            </p>
                        )}
                    </section>
                )}
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {loading
                    ? [0, 1, 2].map((i) => <StatCardSkeleton key={i} />)
                    : stats.map(({ label, value, Icon, tone }) => (
                          <div
                              key={label}
                              className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-md hover:shadow-forest/5"
                          >
                              <div className="flex items-center justify-between gap-3">
                                  <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
                                      <Icon className="size-5" aria-hidden />
                                  </span>
                                  <span className="flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-leaf">
                                      <TrendingUp className="size-3.5" aria-hidden />
                                      Real-time
                                  </span>
                              </div>
                              <p className="mt-5 font-serif text-4xl font-medium leading-none text-forest">
                                  {value ?? "—"}
                              </p>
                              <p className="mt-2 text-sm text-muted">{label}</p>
                          </div>
                      ))}
            </div>

            <NearbyBankMap />

            {/* Aktivitas terbaru */}
            <section className="rounded-xl border border-line bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-serif text-xl font-medium text-forest">Aktivitas terbaru</h2>
                    {weekPoints > 0 && (
                        <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">
                            +{weekPoints.toLocaleString("id-ID")} poin minggu ini
                        </span>
                    )}
                </div>

                {loading ? (
                    <ul className="mt-5 space-y-4">
                        {[0, 1, 2].map((i) => (
                            <li key={i} className="flex items-center gap-4">
                                <div className="size-10 animate-pulse rounded-full bg-mist" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-48 animate-pulse rounded bg-mist" />
                                    <div className="h-3 w-24 animate-pulse rounded bg-mist" />
                                </div>
                                <div className="h-6 w-16 animate-pulse rounded-full bg-mist" />
                            </li>
                        ))}
                    </ul>
                ) : transactions.length === 0 ? (
                    <p className="mt-6 text-center text-sm text-muted">
                        Belum ada aktivitas. Mulai dengan scan sampah!
                    </p>
                ) : (
                    <ul className="relative mt-5 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-line">
                        {transactions.map((tx) => {
                            const { Icon, tone, label } = txConfig(tx.type);
                            return (
                                <li key={tx.id} className="relative flex items-center gap-4 py-3">
                                    <span className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-white ${tone}`}>
                                        <Icon className="size-[18px]" aria-hidden />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium text-ink">
                                            {tx.description || label}
                                        </span>
                                        <span className="block text-xs text-muted">
                                            {timeAgo(tx.created_at)}
                                        </span>
                                    </span>
                                    <span className="rounded-full bg-mist px-3 py-1 text-sm font-semibold tabular-nums text-leaf">
                                        +{tx.points.toLocaleString("id-ID")}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
