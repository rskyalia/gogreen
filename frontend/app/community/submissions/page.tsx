'use client';

import { useState } from 'react';
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
  FileText 
} from 'lucide-react';

interface Submission {
  id: number;
  userName: string;
  userAvatar: string;
  guideTitle: string;
  category: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  points: number;
  proofImage: string;
  userNote: string;
  rejectionReason?: string;
}

export default function SubmissionsValidationPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Mock Data Pengajuan Karya dari User
  const [submissions, setSubmissions] = useState<Submission[]>([
    {
      id: 1,
      userName: 'Budi Santoso',
      userAvatar: 'BS',
      guideTitle: 'Pot Bunga Estetik dari Botol Plastik Bekas',
      category: 'Plastik',
      submittedAt: '12 Okt 2026, 14:20 WIB',
      status: 'pending',
      points: 50,
      proofImage: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=600',
      userNote: 'Saya membuat pot tanaman ini menggunakan botol bekas minuman soda 1.5L dan dicat warna putih hijau.'
    },
    {
      id: 2,
      userName: 'Siti Aminah',
      userAvatar: 'SA',
      guideTitle: 'Totebag Ramah Lingkungan dari Pakaian Bekas',
      category: 'Kain',
      submittedAt: '12 Okt 2026, 11:05 WIB',
      status: 'pending',
      points: 75,
      proofImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
      userNote: 'Totebag dari kaos bekas sesuai panduan, dijahit rapi bagian bawahnya.'
    },
    {
      id: 3,
      userName: 'Eko Prasetyo',
      userAvatar: 'EP',
      guideTitle: 'Tempat Pensil Meja dari Kaleng Minuman',
      category: 'Logam',
      submittedAt: '11 Okt 2026, 16:45 WIB',
      status: 'approved',
      points: 75,
      proofImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600',
      userNote: 'Selesai melilitkan tali rami di kaleng soda bekas.'
    },
    {
      id: 4,
      userName: 'Rina Wijaya',
      userAvatar: 'RW',
      guideTitle: 'Kotak Penyimpanan Serbaguna dari Kardus Bekas',
      category: 'Kertas & Kardus',
      submittedAt: '10 Okt 2026, 09:30 WIB',
      status: 'rejected',
      points: 0,
      proofImage: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
      userNote: 'Kardus bekas dilapisi kertas koran.',
      rejectionReason: 'Foto bukti karya terlalu buram dan bentuk kardus belum selesai dikerjakan.'
    }
  ]);

  // Handler Approve Karya
  const handleApprove = (id: number) => {
    setSubmissions(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'approved' } : item
      )
    );
    setSelectedSubmission(null);
  };

  // Handler Reject Karya
  const handleReject = (id: number) => {
    if (!rejectReasonInput.trim()) {
      alert('Mohon masukkan alasan penolakan karya.');
      return;
    }

    setSubmissions(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: 'rejected', points: 0, rejectionReason: rejectReasonInput }
          : item
      )
    );
    setRejectReasonInput('');
    setIsRejecting(false);
    setSelectedSubmission(null);
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter(item => {
    const matchesTab = selectedTab === 'all' || item.status === selectedTab;
    const matchesQuery =
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guideTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const countPending = submissions.filter(s => s.status === 'pending').length;
  const countApproved = submissions.filter(s => s.status === 'approved').length;
  const countRejected = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div className="space-y-8 font-sans text-[#1d3b2f]">
      {/* Header Utama */}
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
      </div>

      {/* Tabs Filter Status & Bar Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-[#d7e6dd] flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xs">
        {/* Tab Buttons */}
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

        {/* Input Pencarian */}
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

      {/* Tabel Validasi Submission */}
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
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map(item => (
                  <tr key={item.id} className="hover:bg-[#f5faf7]/60 transition-all">
                    {/* User */}
                    <td className="px-4 sm:px-6 py-4 font-bold">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#e1f3e9] text-[#0b4d36] font-bold text-xs flex items-center justify-center border border-[#d7e6dd] shrink-0">
                          {item.userAvatar}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1d3b2f]">{item.userName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Tutorial Title */}
                    <td className="px-4 sm:px-6 py-4 font-medium max-w-xs">
                      <p className="truncate font-semibold text-[#1d3b2f]">{item.guideTitle}</p>
                    </td>

                    {/* Category */}
                    <td className="px-4 sm:px-6 py-4">
                      <span className="bg-[#e1f3e9] text-[#0b4d36] font-bold text-[10px] px-2.5 py-1 rounded-md">
                        {item.category}
                      </span>
                    </td>

                    {/* Points */}
                    <td className="px-4 sm:px-6 py-4 font-extrabold text-[#1f8a5b]">
                      +{item.points} Pts
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

                    {/* Action Buttons */}
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(item);
                            setIsRejecting(false);
                          }}
                          className="px-3 py-1.5 bg-[#0b4d36] hover:bg-[#0a3f2d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tinjau</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#6b8279]">
                    Tidak ada data pengajuan karya pada kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup Tinjau Karya & Foto Bukti */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#d7e6dd] max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#d7e6dd] pb-3 sm:pb-4 gap-2">
              <div className="space-y-1 pr-2">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-[#e1f3e9] text-[#0b4d36] text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                    {selectedSubmission.category}
                  </span>
                  <span className="text-xs text-[#1f8a5b] font-bold">
                    Est. Reward: +{selectedSubmission.points} Pts
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#1d3b2f]">
                  {selectedSubmission.guideTitle}
                </h2>
                <p className="text-xs text-[#6b8279]">
                  Oleh: <strong className="text-[#1d3b2f]">{selectedSubmission.userName}</strong> &middot; Diunggah {selectedSubmission.submittedAt}
                </p>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 text-[#6b8279] hover:bg-[#f5faf7] rounded-xl cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Foto Bukti Karya */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1d3b2f]">Foto Bukti Karya User:</label>
              <div className="relative h-48 sm:h-64 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#e1f3e9] border border-[#d7e6dd]">
                <img
                  src={selectedSubmission.proofImage}
                  alt="Foto Bukti Karya"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Catatan User */}
            <div className="p-3.5 sm:p-4 bg-[#f5faf7] rounded-xl sm:rounded-2xl border border-[#d7e6dd] space-y-1">
              <span className="text-[10px] font-bold text-[#6b8279] uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3" /> Catatan dari Pengunggah:
              </span>
              <p className="text-xs text-[#1d3b2f] leading-relaxed">
                &ldquo;{selectedSubmission.userNote}&rdquo;
              </p>
            </div>

            {/* Status Info / Form Alasan Penolakan */}
            {selectedSubmission.status === 'rejected' && selectedSubmission.rejectionReason && (
              <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl text-xs space-y-1">
                <span className="font-bold text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Alasan Penolakan Sebelumnya:
                </span>
                <p className="text-red-600">{selectedSubmission.rejectionReason}</p>
              </div>
            )}

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
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleReject(selectedSubmission.id)}
                    className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer text-center"
                  >
                    Konfirmasi Tolak
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 sm:pt-4 border-t border-[#d7e6dd] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <span className="text-xs text-[#6b8279]">
                Status saat ini:{' '}
                <strong className="uppercase text-[#0b4d36]">{selectedSubmission.status}</strong>
              </span>

              {selectedSubmission.status === 'pending' && !isRejecting && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Tolak Karya
                  </button>
                  <button
                    onClick={() => handleApprove(selectedSubmission.id)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0b4d36] hover:bg-[#0a3f2d] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Setujui (+{selectedSubmission.points} Pts)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}