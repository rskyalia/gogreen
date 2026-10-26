"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  PackagePlus,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Recycle,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

// Helper sinkronisasi tanggal aman dari SSR & Cascading Render
const subscribe = () => () => { };
const getClientSnapshot = () =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
const getServerSnapshot = () => "";

export default function DIYCommunityDashboardPage() {
  const currentDate = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  // Mock Data Submission Karya User
  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      user: "Budi Santoso",
      guide: "Pot Bunga Botol Plastik",
      category: "Plastik",
      status: "pending",
      points: 50,
      time: "10 menit lalu",
    },
    {
      id: 2,
      user: "Siti Aminah",
      guide: "Tas Belanja dari Sedotan",
      category: "Plastik",
      status: "pending",
      points: 100,
      time: "25 menit lalu",
    },
    {
      id: 3,
      user: "Eko Prasetyo",
      guide: "Tempat Pensil Kaleng",
      category: "Logam",
      status: "approved",
      points: 75,
      time: "2 jam lalu",
    },
    {
      id: 4,
      user: "Rina Wijaya",
      guide: "Prakarya Kardus Bekas",
      category: "Kertas",
      status: "rejected",
      points: 0,
      time: "Kemarin",
    },
  ]);

  // Algoritma Hitung Status Karya
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter(
    (s) => s.status === "approved",
  ).length;
  const rejectedCount = submissions.filter(
    (s) => s.status === "rejected",
  ).length;

  const handleAction = (id: number, newStatus: "approved" | "rejected") => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans text-[#1d3b2f]">
      {/* Header Salam & Tanggal Dinamis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1f8a5b] tracking-widest uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> DASHBOARD KOMUNITAS DIY
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d3b2f] mt-0.5">
            Halo, Tim Komunitas! 🌿
          </h1>
          <p className="text-xs text-[#6b8279] mt-1">
            Kelola katalog kreasi, atur skema poin, dan lakukan kurasi karya
            daur ulang warga.
          </p>
        </div>

        {/* Indikator Tanggal Real-time */}
        <div className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#d7e6dd] text-xs font-medium text-[#1d3b2f] shadow-2xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-[#1f8a5b]" />
          <span className="capitalize">
            {currentDate || "Memuat tanggal..."}
          </span>
        </div>
      </div>

      {/* Banner Ringkasan Tugas */}
      <div className="bg-[#cfeedd] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#d7e6dd] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-[10px] font-bold tracking-widest text-[#0b4d36] uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> PUSAT KURASI & EDUKASI DAUR
            ULANG
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-[#1d3b2f] leading-snug">
            Ada {pendingCount} karya warga yang butuh validasimu hari ini!
          </h2>
          <p className="text-xs text-[#1d3b2f]/80 leading-relaxed">
            Pastikan setiap bukti karya yang diunggah sesuai dengan panduan agar
            poin terdistribusi secara tepat.
          </p>
        </div>

        <a
          href="/community/submissions"
          className="bg-[#0b4d36] hover:bg-[#0a3f2d] text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#0b4d36]/10 shrink-0 w-full sm:w-auto"
        >
          <span>Mulai Kurasi Karya</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Grid Stat Status Algoritma (Accepted, Pending, Rejected, Request Bahan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#d7e6dd] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6b8279]">
              Menunggu Validasi
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-[#8a5a00] mt-1">
              {pendingCount} Karya
            </h3>
            <p className="text-[10px] text-[#8a5a00] mt-1 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" /> Status: Pending
            </p>
          </div>
          <div className="p-2.5 sm:p-3 bg-[#fdecc4] rounded-xl text-[#8a5a00] shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#d7e6dd] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6b8279]">
              Karya Disetujui
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0b4d36] mt-1">
              {approvedCount} Karya
            </h3>
            <p className="text-[10px] text-[#1f8a5b] mt-1 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Status: Accepted
            </p>
          </div>
          <div className="p-2.5 sm:p-3 bg-[#cfeedd] rounded-xl text-[#0b4d36] shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#d7e6dd] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6b8279]">
              Karya Ditolak
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
              {rejectedCount} Karya
            </h3>
            <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Status: Rejected
            </p>
          </div>
          <div className="p-2.5 sm:p-3 bg-red-50 rounded-xl text-red-600 shrink-0">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#d7e6dd] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6b8279]">
              Request Bahan
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0b4d36] mt-1">
              3 Permintaan
            </h3>
            <p className="text-[10px] text-[#1f8a5b] mt-1 font-semibold flex items-center gap-1">
              <PackagePlus className="w-3 h-3" /> Bahan Daur Ulang
            </p>
          </div>
          <div className="p-2.5 sm:p-3 bg-[#e1f3e9] rounded-xl text-[#0b4d36] shrink-0">
            <PackagePlus className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Skema Poin & Kategori */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#d7e6dd] space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#d7e6dd] pb-3 sm:pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1d3b2f]">
              Skema Standar Poin Daur Ulang Komunitas
            </h3>
            <p className="text-xs text-[#6b8279]">
              Penentuan alokasi poin yang akan diterima pengguna berdasarkan
              tindakan daur ulang.
            </p>
          </div>
          <span className="text-[10px] sm:text-[11px] bg-[#cfeedd] text-[#0b4d36] font-bold px-3 py-1 rounded-full border border-[#d7e6dd] shrink-0">
            Poin Otomatis Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border border-[#d7e6dd] bg-[#f5faf7] space-y-2">
            <div className="flex items-center gap-2 text-[#0b4d36] font-bold text-xs">
              <Sparkles className="w-4 h-4 text-[#1f8a5b] shrink-0" />
              <span>Dibuat Karya DIY (Accepted)</span>
            </div>
            <p className="text-[11px] text-[#6b8279]">
              User mengunggah bukti kreasi karya daur ulang yang valid sesuai
              tutorial.
            </p>
            <div className="pt-2 text-base sm:text-lg font-serif font-extrabold text-[#0b4d36]">
              +50 s/d +150{" "}
              <span className="text-xs font-sans font-normal text-[#6b8279]">
                Poin / Karya
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#d7e6dd] bg-[#f5faf7] space-y-2">
            <div className="flex items-center gap-2 text-[#0b4d36] font-bold text-xs">
              <Recycle className="w-4 h-4 text-[#1f8a5b] shrink-0" />
              <span>Pemilahan Sampah (Tanpa Karya)</span>
            </div>
            <p className="text-[11px] text-[#6b8279]">
              Sampah dipilah berdasarkan kategori dan disetor tanpa dibuat karya
              kreasi.
            </p>
            <div className="pt-2 text-base sm:text-lg font-serif font-extrabold text-[#1f8a5b]">
              +10 s/d +20{" "}
              <span className="text-xs font-sans font-normal text-[#6b8279]">
                Poin / Kg
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#d7e6dd] bg-[#f5faf7] space-y-2">
            <div className="flex items-center gap-2 text-[#6b8279] font-bold text-xs">
              <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
              <span>Dibuang / Tidak Valid (Rejected)</span>
            </div>
            <p className="text-[11px] text-[#6b8279]">
              Foto buram, karya tidak sesuai tutorial, atau sampah dibuang
              sembarangan.
            </p>
            <div className="pt-2 text-base sm:text-lg font-serif font-extrabold text-[#6b8279]">
              0{" "}
              <span className="text-xs font-sans font-normal text-[#6b8279]">
                Poin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Kurasi Cepat */}
      <div className="bg-white rounded-2xl border border-[#d7e6dd] overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-[#d7e6dd] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1d3b2f]">
              Kurasi Karya Terbaru
            </h3>
            <p className="text-xs text-[#6b8279]">
              Setujui atau tolak pengajuan karya warga secara langsung.
            </p>
          </div>
          <a
            href="/community/submissions"
            className="text-xs font-bold text-[#1f8a5b] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Lihat Semua Submissions <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs text-[#1d3b2f]">
            <thead className="bg-[#f5faf7] text-[#6b8279] font-bold uppercase tracking-wider border-b border-[#d7e6dd]">
              <tr>
                <th className="px-4 sm:px-6 py-3.5">Nama User</th>
                <th className="px-4 sm:px-6 py-3.5">Panduan DIY</th>
                <th className="px-4 sm:px-6 py-3.5">Kategori</th>
                <th className="px-4 sm:px-6 py-3.5">Est. Poin</th>
                <th className="px-4 sm:px-6 py-3.5">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-right">Aksi Kurasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d7e6dd]">
              {submissions.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#f5faf7]/60 transition-all"
                >
                  <td className="px-4 sm:px-6 py-4 font-bold text-[#1d3b2f]">
                    {item.user}
                  </td>
                  <td className="px-4 sm:px-6 py-4 font-medium">{item.guide}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="bg-[#e1f3e9] text-[#0b4d36] font-semibold text-[10px] px-2.5 py-1 rounded-md">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 font-bold text-[#1f8a5b]">
                    +{item.points} Pts
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    {item.status === "pending" && (
                      <span className="bg-[#fdecc4] text-[#8a5a00] font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {item.status === "approved" && (
                      <span className="bg-[#cfeedd] text-[#0b4d36] font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Accepted
                      </span>
                    )}
                    {item.status === "rejected" && (
                      <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    {item.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(item.id, "approved")}
                          className="bg-[#0b4d36] hover:bg-[#0a3f2d] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(item.id, "rejected")}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-200 cursor-pointer transition-all shrink-0"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#6b8279] italic">
                        Selesai dikurasi
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
