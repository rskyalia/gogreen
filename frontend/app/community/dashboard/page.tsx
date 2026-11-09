"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  PackagePlus,
  Recycle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useCommunityDashboard } from "@/lib/useCommunityDashboard";
import { reviewSubmission } from "@/lib/communityApi";
import { timeAgo } from "@/lib/timeAgo";

// ── Tanggal client-safe ────────────────────────────────────────────────────

const subscribe        = () => () => {};
const getClientDate    = () => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
const getServerDate    = () => "";

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  chipClass,
  valueClass,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  chipClass: string;
  valueClass: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className={`mt-1 font-serif text-2xl font-bold ${valueClass}`}>
          {loading
            ? <span className="inline-block h-7 w-16 animate-pulse rounded-lg bg-mist" />
            : value
          }
        </p>
        <p className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${valueClass}`}>
          <Icon className="size-3" aria-hidden />
          {sub}
        </p>
      </div>
      <span className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${chipClass}`}>
        <Icon className="size-5 sm:size-6" aria-hidden />
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CommunityDashboardPage() {
  const currentDate = useSyncExternalStore(subscribe, getClientDate, getServerDate);
  const { data, loading, error, refresh } = useCommunityDashboard(15_000);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const handleAction = async (id: number, status: "approved" | "rejected") => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await reviewSubmission(id, status);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengkurasi karya.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const stats       = data?.stats ?? { pending: 0, approved: 0, rejected: 0, open_material_requests: 0 };
  const submissions = data?.submissions ?? [];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-leaf">
            <ShieldCheck className="size-3.5" aria-hidden /> Dashboard Komunitas DIY
          </p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-forest sm:text-3xl">
            {loading
              ? <span className="inline-block h-7 w-40 animate-pulse rounded-lg bg-mist align-middle" />
              : <>Halo, {data?.user?.name ?? "Tim Komunitas"}! </>
            }
          </h1>
          <p className="mt-1 text-xs text-muted">
            Kelola katalog kreasi, atur skema poin, dan lakukan kurasi karya daur ulang warga.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs text-ink/75 sm:w-auto">
          <CalendarDays className="size-4 shrink-0 text-forest" aria-hidden />
          <span className="capitalize">{currentDate || "Memuat tanggal…"}</span>
        </div>
      </header>

      {/* ── Hero banner ── */}
      <section className="flex flex-col gap-4 rounded-2xl bg-mint p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-forest">
            <Sparkles className="size-3.5" aria-hidden /> Pusat Kurasi &amp; Edukasi Daur Ulang
          </p>
          <h2 className="font-serif text-xl font-medium leading-snug text-forest sm:text-2xl">
            {loading
              ? <span className="inline-block h-7 w-56 animate-pulse rounded-lg bg-forest/10" />
              : <>Ada {stats.pending} karya warga yang butuh validasimu hari ini!</>
            }
          </h2>
          <p className="max-w-md text-xs leading-relaxed text-ink/80">
            Pastikan setiap bukti karya yang diunggah sesuai panduan agar poin terdistribusi secara tepat.
          </p>
        </div>
        <Link
          href="/community/submissions"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep sm:w-auto sm:shrink-0"
        >
          Mulai Kurasi
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-danger-soft bg-danger-soft px-4 py-3">
          <div className="flex items-center gap-3 text-danger">
            <AlertCircle className="size-5 shrink-0" aria-hidden />
            <p className="text-xs font-semibold">{error}</p>
          </div>
          <button type="button" onClick={refresh} className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-danger transition-colors hover:opacity-75">
            <RefreshCw className="size-4" aria-hidden /> Coba Lagi
          </button>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <StatCard label="Menunggu Validasi" value={`${stats.pending} Karya`}   sub="Status: Pending"  icon={Clock}         chipClass="bg-sun text-sun-ink"    valueClass="text-sun-ink"  loading={loading} />
        <StatCard label="Karya Disetujui"   value={`${stats.approved} Karya`}  sub="Status: Accepted" icon={CheckCircle2}  chipClass="bg-mint text-forest"   valueClass="text-forest"   loading={loading} />
        <StatCard label="Karya Ditolak"     value={`${stats.rejected} Karya`}  sub="Status: Rejected" icon={XCircle}       chipClass="bg-danger-soft text-danger" valueClass="text-danger" loading={loading} />
        <StatCard label="Request Bahan"     value={`${stats.open_material_requests} Permintaan`} sub="Bahan Daur Ulang" icon={PackagePlus} chipClass="bg-mist text-leaf" valueClass="text-forest" loading={loading} />
      </div>

      {/* ── Skema poin ── */}
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-base font-medium text-forest sm:text-lg">Skema Standar Poin Daur Ulang</h2>
            <p className="mt-0.5 text-xs text-muted">Alokasi poin berdasarkan tindakan daur ulang pengguna.</p>
          </div>
          <span className="w-fit rounded-full border border-line bg-mint px-3 py-1 text-[10px] font-bold text-forest">
            Poin Otomatis Aktif
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: Sparkles, label: "Karya DIY (Accepted)", desc: "User mengunggah bukti kreasi yang valid sesuai tutorial.", value: "+50 s/d +150", unit: "Poin / Karya", color: "text-forest" },
            { icon: Recycle,  label: "Pemilahan Sampah",     desc: "Sampah dipilah dan disetor tanpa membuat karya kreasi.",   value: "+10 s/d +20",  unit: "Poin / Kg",   color: "text-leaf"   },
            { icon: Trash2,   label: "Rejected / Tidak Valid", desc: "Foto buram, karya tidak sesuai tutorial, atau sampah dibuang sembarangan.", value: "0", unit: "Poin", color: "text-muted" },
          ].map(({ icon: Icon, label, desc, value, unit, color }) => (
            <div key={label} className="space-y-2 rounded-xl border border-line bg-paper p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <Icon className="size-4 text-leaf shrink-0" aria-hidden />
                {label}
              </div>
              <p className="text-[11px] leading-relaxed text-muted">{desc}</p>
              <p className={`font-serif text-lg font-bold ${color}`}>
                {value} <span className="font-sans text-xs font-normal text-muted">{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tabel kurasi ── */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-serif text-base font-medium text-forest sm:text-lg">Kurasi Karya Terbaru</h2>
            <p className="text-xs text-muted">Setujui atau tolak pengajuan karya warga secara langsung.</p>
          </div>
          <Link href="/community/submissions" className="flex items-center gap-1 text-xs font-bold text-leaf hover:underline self-start sm:self-auto">
            Lihat Semua <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs text-ink">
            <thead className="border-b border-line bg-paper text-[10px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 sm:px-5">Nama User</th>
                <th className="px-4 py-3 sm:px-5">Panduan DIY</th>
                <th className="px-4 py-3 sm:px-5">Kategori</th>
                <th className="px-4 py-3 sm:px-5">Poin</th>
                <th className="px-4 py-3 sm:px-5">Dikirim</th>
                <th className="px-4 py-3 sm:px-5">Status</th>
                <th className="px-4 py-3 sm:px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">

              {/* Loading skeleton */}
              {loading && submissions.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4 sm:px-5">
                        <span className="inline-block h-4 w-full animate-pulse rounded-md bg-mist" />
                      </td>
                    ))}
                  </tr>
                ))
              }

              {/* Empty state */}
              {!loading && submissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">
                    Tidak ada karya yang perlu dikurasi saat ini.
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {submissions.map((item) => {
                const acting = !!actionLoading[item.id];
                return (
                  <tr key={item.id} className="transition-colors hover:bg-paper/60">
                    <td className="px-4 py-3.5 font-semibold sm:px-5">{item.user}</td>
                    <td className="px-4 py-3.5 sm:px-5 max-w-[160px]">
                      <span className="line-clamp-2">{item.guide}</span>
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <span className="rounded-md bg-mist px-2.5 py-1 text-[10px] font-semibold text-forest">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-leaf sm:px-5">+{item.points}</td>
                    <td className="px-4 py-3.5 text-muted sm:px-5">{timeAgo(item.created_at)}</td>
                    <td className="px-4 py-3.5 sm:px-5">
                      {item.status === "pending" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sun px-2.5 py-0.5 text-[10px] font-bold text-sun-ink">
                          <Clock className="size-3" aria-hidden /> Pending
                        </span>
                      )}
                      {item.status === "approved" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-bold text-forest">
                          <CheckCircle2 className="size-3" aria-hidden /> Disetujui
                        </span>
                      )}
                      {item.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-[10px] font-bold text-danger">
                          <XCircle className="size-3" aria-hidden /> Ditolak
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-5">
                      {item.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => handleAction(item.id, "approved")}
                            className="flex items-center gap-1 rounded-lg bg-forest px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {acting ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => handleAction(item.id, "rejected")}
                            className="flex items-center gap-1 rounded-lg border border-danger-soft bg-danger-soft px-2.5 py-1.5 text-[10px] font-bold text-danger transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {acting ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-muted">Selesai</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
