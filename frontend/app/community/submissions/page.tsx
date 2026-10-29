'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CheckSquare, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Check, 
  X, 
  AlertCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { api, firstError } from '@/lib/api';

// ── Types dari API Backend ────────────────────────────────────────────────────

interface ApiUser {
  id: number;
  name: string;
  email: string;
}

interface ApiWasteCategory {
  id: number;
  name: string;
}

interface ApiDiyGuide {
  id: number;
  title: string;
  reward_points: number;
  waste_category?: ApiWasteCategory;
}

interface ApiSubmission {
  id: number;
  user: ApiUser;
  diy_guide: ApiDiyGuide;
  proof_image: string;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
  points_awarded: number;
  created_at: string;
  reviewed_at: string | null;
  reviewer?: ApiUser | null;
  // relasi snake_case dari Laravel eager load
  diyGuide?: ApiDiyGuide;
}

interface ApiPaginatedResponse {
  data: ApiSubmission[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

// ── Helper: format tanggal ISO → "12 Okt 2026, 14:20 WIB" ───────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }) + ' WIB';
  } catch {
    return iso;
  }
}

// ── Helper: inisial nama ─────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Helper: resolve relasi diy_guide (bisa 'diy_guide' atau 'diyGuide') ──────

function getGuide(s: ApiSubmission): ApiDiyGuide | null {
  return s.diy_guide ?? s.diyGuide ?? null;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SubmissionsValidationPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<ApiSubmission | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Data state
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action loading state
  const [isActionLoading, setIsActionLoading] = useState(false);

  // ── Fetch data dari backend ─────────────────────────────────────────────

  const fetchSubmissions = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await api.get<ApiPaginatedResponse>('/admin/diy-submissions?per_page=100');
      setSubmissions(res.data);
    } catch (err) {
      setError(firstError(err, 'Gagal memuat data pengajuan karya.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // ── Auto-polling tiap 30 detik ─────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSubmissions(true);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchSubmissions]);

  // ── Handler Approve ─────────────────────────────────────────────────────

  const handleApprove = async (id: number) => {
    setIsActionLoading(true);
    try {
      await api.patch(`/admin/diy-submissions/${id}/review`, { status: 'approved' });
      await fetchSubmissions(true);
      setSelectedSubmission(null);
    } catch (err) {
      alert(firstError(err, 'Gagal menyetujui karya.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // ── Handler Reject ──────────────────────────────────────────────────────

  const handleReject = async (id: number) => {
    if (!rejectReasonInput.trim()) {
      alert('Mohon masukkan alasan penolakan karya.');
      return;
    }

    setIsActionLoading(true);
    try {
      await api.patch(`/admin/diy-submissions/${id}/review`, {
        status: 'rejected',
        review_note: rejectReasonInput.trim(),
      });
      await fetchSubmissions(true);
      setRejectReasonInput('');
      setIsRejecting(false);
      setSelectedSubmission(null);
    } catch (err) {
      alert(firstError(err, 'Gagal menolak karya.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // ── Filter lokal ────────────────────────────────────────────────────────

  const filteredSubmissions = submissions.filter(item => {
    const guide = getGuide(item);
    const matchesTab = selectedTab === 'all' || item.status === selectedTab;
    const matchesQuery =
      item.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const countPending  = submissions.filter(s => s.status === 'pending').length;
  const countApproved = submissions.filter(s => s.status === 'approved').length;
  const countRejected = submissions.filter(s => s.status === 'rejected').length;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 font-sans text-[#1d3b2f]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#1f8a5b] tracking-widest uppercase flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> MODUL VALIDASI KARYA
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1d3b2f] mt-0.5">
            Validasi Pengajuan Karya Warga
          </h1>
          <p className="text-xs text-[#6b8279] mt-1">
            Periksa foto bukti kreasi warga, setujui untuk mendistribusikan poin, atau berikan alasan jika karya belum memenuhi kriteria.
          </p>
        </div>

        {/* Tombol Refresh Manual */}
        <button
          onClick={() => fetchSubmissions(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#f5faf7] border border-[#d7e6dd] rounded-xl text-xs font-bold text-[#0b4d36] hover:bg-[#e1f3e9] transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Memperbarui...' : 'Refresh'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Gagal memuat data</p>
            <p className="text-xs mt-0.5">{error}</p>
            <button
              onClick={() => fetchSubmissions()}
              className="mt-2 text-xs underline font-bold cursor-pointer"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#d7e6dd] flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTab === 'all'
                ? 'bg-[#0b4d36] text-white shadow-xs'
                : 'bg-[#f5faf7] text-[#6b8279] hover:bg-[#e1f3e9] hover:text-[#0b4d36]'
            }`}
          >
            Semua ({submissions.length})
          </button>

          <button
            onClick={() => setSelectedTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'pending'
                ? 'bg-[#8a5a00] text-white shadow-xs'
                : 'bg-[#fdecc4]/60 text-[#8a5a00] hover:bg-[#fdecc4]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Pending ({countPending})
          </button>

          <button
            onClick={() => setSelectedTab('approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'approved'
                ? 'bg-[#1f8a5b] text-white shadow-xs'
                : 'bg-[#cfeedd]/60 text-[#0b4d36] hover:bg-[#cfeedd]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted ({countApproved})
          </button>

          <button
            onClick={() => setSelectedTab('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" /> Rejected ({countRejected})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6b8279]" />
          <input
            type="text"
            placeholder="Cari nama user / tutorial..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-[#d7e6dd] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs text-[#1d3b2f]">
            <thead className="bg-[#f5faf7] text-[#6b8279] font-bold uppercase tracking-wider border-b border-[#d7e6dd]">
              <tr>
                <th className="px-4 sm:px-6 py-3.5">User</th>
                <th className="px-4 sm:px-6 py-3.5">Tutorial DIY</th>
                <th className="px-4 sm:px-6 py-3.5">Kategori</th>
                <th className="px-4 sm:px-6 py-3.5">Potensi Poin</th>
                <th className="px-4 sm:px-6 py-3.5">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-right">Aksi Kurasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d7e6dd]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#6b8279]">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1f8a5b]" />
                      <span className="text-sm">Memuat data pengajuan karya...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSubmissions.length > 0 ? (
                filteredSubmissions.map(item => {
                  const guide = getGuide(item);
                  const categoryName = guide?.waste_category?.name ?? '-';
                  const rewardPoints = guide?.reward_points ?? 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#f5faf7]/60 transition-all">
                      {/* User */}
                      <td className="px-4 sm:px-6 py-4 font-bold">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#e1f3e9] text-[#0b4d36] font-bold text-xs flex items-center justify-center border border-[#d7e6dd] shrink-0">
                            {getInitials(item.user?.name ?? '?')}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1d3b2f]">{item.user?.name ?? '-'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Tutorial Title */}
                      <td className="px-4 sm:px-6 py-4 font-medium max-w-xs">
                        <p className="truncate font-semibold text-[#1d3b2f]">{guide?.title ?? '-'}</p>
                        <p className="text-[10px] text-[#6b8279] mt-0.5">{formatDate(item.created_at)}</p>
                      </td>

                      {/* Category */}
                      <td className="px-4 sm:px-6 py-4">
                        <span className="bg-[#e1f3e9] text-[#0b4d36] font-bold text-[10px] px-2.5 py-1 rounded-md">
                          {categoryName}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="px-4 sm:px-6 py-4 font-extrabold text-[#1f8a5b]">
                        {item.status === 'approved'
                          ? `+${item.points_awarded} Pts`
                          : `+${rewardPoints} Pts`}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 sm:px-6 py-4">
                        {item.status === 'pending' && (
                          <span className="bg-[#fdecc4] text-[#8a5a00] font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="bg-[#cfeedd] text-[#0b4d36] font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Accepted
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubmission(item);
                              setIsRejecting(false);
                              setRejectReasonInput('');
                            }}
                            className="px-3 py-1.5 bg-[#0b4d36] hover:bg-[#0a3f2d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Tinjau</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6b8279]">
                    {error
                      ? 'Terjadi kesalahan saat memuat data.'
                      : 'Tidak ada data pengajuan karya pada kategori ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tinjau Karya */}
      {selectedSubmission && (() => {
        const guide = getGuide(selectedSubmission);
        const categoryName = guide?.waste_category?.name ?? '-';
        const rewardPoints = guide?.reward_points ?? 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#d7e6dd] max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-[#d7e6dd] pb-3 sm:pb-4 gap-2">
                <div className="space-y-1 pr-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-[#e1f3e9] text-[#0b4d36] text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                      {categoryName}
                    </span>
                    <span className="text-xs text-[#1f8a5b] font-bold">
                      {selectedSubmission.status === 'approved'
                        ? `Poin diberikan: +${selectedSubmission.points_awarded} Pts`
                        : `Est. Reward: +${rewardPoints} Pts`}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-[#1d3b2f]">
                    {guide?.title ?? '-'}
                  </h2>
                  <p className="text-xs text-[#6b8279]">
                    Oleh: <strong className="text-[#1d3b2f]">{selectedSubmission.user?.name ?? '-'}</strong> &middot; Diunggah {formatDate(selectedSubmission.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1.5 text-[#6b8279] hover:bg-[#f5faf7] rounded-xl cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Foto Bukti Karya */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1d3b2f]">Foto Bukti Karya User:</label>
                <div className="relative h-48 sm:h-64 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#e1f3e9] border border-[#d7e6dd]">
                  {selectedSubmission.proof_image ? (
                    <img
                      src={selectedSubmission.proof_image}
                      alt="Foto Bukti Karya"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6b8279] text-xs">
                      Tidak ada foto bukti
                    </div>
                  )}
                </div>
              </div>

              {/* Alasan Penolakan jika sudah rejected */}
              {selectedSubmission.status === 'rejected' && selectedSubmission.review_note && (
                <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Alasan Penolakan:
                  </span>
                  <p className="text-red-600">{selectedSubmission.review_note}</p>
                </div>
              )}

              {/* Info reviewer jika sudah diproses */}
              {selectedSubmission.status !== 'pending' && selectedSubmission.reviewer && (
                <div className="p-3 bg-[#f5faf7] rounded-xl border border-[#d7e6dd] text-xs text-[#6b8279]">
                  <span>Diproses oleh: </span>
                  <strong className="text-[#1d3b2f]">{selectedSubmission.reviewer.name}</strong>
                  <span> pada {formatDate(selectedSubmission.reviewed_at)}</span>
                </div>
              )}

              {/* Form Penolakan */}
              {isRejecting && (
                <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl space-y-2 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-red-700">
                    Tuliskan Alasan Penolakan (akan dikirimkan ke user):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Foto karya buram, atau tidak sesuai dengan tutorial yang dipilih."
                    value={rejectReasonInput}
                    onChange={e => setRejectReasonInput(e.target.value)}
                    className="w-full bg-white border border-red-200 rounded-xl p-3 text-xs text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsRejecting(false)}
                      disabled={isActionLoading}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer text-center disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleReject(selectedSubmission.id)}
                      disabled={isActionLoading}
                      className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Konfirmasi Tolak
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-3 sm:pt-4 border-t border-[#d7e6dd] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <span className="text-xs text-[#6b8279]">
                  Status saat ini:{' '}
                  <strong className="uppercase text-[#0b4d36]">{selectedSubmission.status}</strong>
                </span>

                {selectedSubmission.status === 'pending' && !isRejecting && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsRejecting(true)}
                      disabled={isActionLoading}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Tolak Karya
                    </button>
                    <button
                      onClick={() => handleApprove(selectedSubmission.id)}
                      disabled={isActionLoading}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0b4d36] hover:bg-[#0a3f2d] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isActionLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Check className="w-4 h-4" />}
                      Setujui (+{rewardPoints} Pts)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}