'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
  PackagePlus, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  Trash2, 
  X, 
  Recycle, 
  Layers,
  Loader2
} from 'lucide-react';

interface BankSampah {
  id: number;
  name: string;
  address?: string;
}

interface MaterialRequest {
  id: number;
  title: string;
  category: string;
  quantity: string;
  requester: string;
  targetBankSampah: string;
  location: string;
  urgency: 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Open' | 'In Progress' | 'Fulfilled';
  createdAt: string;
  description: string;
}

export default function MaterialRequestsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Open' | 'In Progress' | 'Fulfilled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Bank Sampah
  const [bankSampahList, setBankSampahList] = useState<BankSampah[]>([]);
  const [isLoadingBankSampah, setIsLoadingBankSampah] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    permintaan_bahan: '',
    title: '',
    category: 'Plastik',
    quantity: '',
    requester: 'Komunitas DIY',
    targetBankSampah: '',
    location: '',
    urgency: 'Sedang' as 'Tinggi' | 'Sedang' | 'Rendah',
    description: ''
  });

  // 🔄 FUNGSI FETCH BANK SAMPAH DARI BACKEND DATABASE
  const fetchWasteBanks = useCallback(async () => {
    setIsLoadingBankSampah(true);
    try {
      const res = await api.get<{ data: BankSampah[] }>('/waste-banks');
      const list = Array.isArray(res) ? res : res?.data;

      if (Array.isArray(list) && list.length > 0) {
        setBankSampahList(list);
        setFormData(prev => ({ 
          ...prev, 
          targetBankSampah: prev.targetBankSampah || list[0].name 
        }));
      } else {
        useFallbackData();
      }
    } catch (error) {
      console.warn('API Error, menggunakan data fallback:', error);
      useFallbackData();
    } finally {
      setIsLoadingBankSampah(false);
    }
  }, []);

  // Data Fallback (jika backend mati)
  function useFallbackData() {
    const fallback: BankSampah[] = [
      { id: 1, name: 'Bank Sampah Jaya', address: 'Jl. Raya Bogor No. 45, Ciracas, Jakarta Timur' },
      { id: 2, name: 'Bank Sampah Makmur', address: 'Jl. Margonda Raya No. 12, Depok, Jawa Barat' }
    ];
    setBankSampahList(fallback);
    setFormData(prev => ({ 
      ...prev, 
      targetBankSampah: prev.targetBankSampah || fallback[0].name 
    }));
  }

  // 1️⃣ Fetch saat pertama kali halaman dimuat
  useEffect(() => {
    fetchWasteBanks();
  }, [fetchWasteBanks]);

  // 2️⃣ RE-FETCH OTOMATIS SAAT MODAL DIBUKA (Agar data bank sampah yang baru di-input di DB langsung muncul)
  useEffect(() => {
    if (isModalOpen) {
      fetchWasteBanks();
    }
  }, [isModalOpen, fetchWasteBanks]);

  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const mapApiRequest = (item: any): MaterialRequest => ({
    id: Number(item.id),
    title: item.permintaan_bahan || item.title || item.notes || `Permintaan bahan daur ulang`,
    category: item.category || item.waste_category?.name || 'Lainnya',
    quantity: item.quantity || `${Number(item.quantity_needed_kg ?? 0)} kg`,
    requester: item.requester || item.community?.name || 'Komunitas DIY',
    targetBankSampah: item.target_bank_sampah || 'Bank Sampah Tujuan',
    location: item.location || 'Jakarta',
    urgency: item.urgency || 'Sedang',
    status: item.status === 'fulfilled' ? 'Fulfilled' : 'Open',
    createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) : 'Hari ini',
    description: item.description || item.notes || 'Permintaan bahan daur ulang dari komunitas.',
  });

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingRequests(true);

    try {
      const res = await api.get<{ data: any[] }>('/community/material-requests');
      const list = Array.isArray(res.data) ? res.data : [];
      setRequests(list.map(mapApiRequest));
    } catch (error) {
      console.error('Gagal memuat data material request dari database:', error);
      setRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleStatusChange = async (id: number, newStatus: 'Open' | 'In Progress' | 'Fulfilled') => {
    const statusMap: Record<'Open' | 'In Progress' | 'Fulfilled', 'open' | 'fulfilled' | 'closed'> = {
      Open: 'open',
      'In Progress': 'open',
      Fulfilled: 'fulfilled',
    };

    try {
      await api.patch(`/community/material-requests/${id}`, {
        status: statusMap[newStatus],
      });
      await fetchRequests(true);
    } catch (error) {
      console.error('Gagal memperbarui status permintaan bahan:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus permintaan bahan ini?')) {
      return;
    }

    try {
      await api.delete(`/community/material-requests/${id}`);
      await fetchRequests(true);
    } catch (error) {
      console.error('Gagal menghapus permintaan bahan:', error);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const permintaanBahan = formData.permintaan_bahan || formData.title;
    if (!permintaanBahan || !formData.quantity) return;

    try {
      await api.post('/community/material-requests', {
        permintaan_bahan: permintaanBahan,
        title: permintaanBahan,
        category: formData.category,
        quantity: formData.quantity,
        description: formData.description || 'Membutuhkan bahan daur ulang untuk kegiatan kreasi.',
        requester: formData.requester || 'Komunitas DIY',
        target_bank_sampah: formData.targetBankSampah || (bankSampahList[0]?.name ?? 'Bank Sampah Jaya'),
        location: formData.location || 'DKI Jakarta',
        urgency: formData.urgency,
      });

      await fetchRequests(true);
      setIsModalOpen(false);
      setFormData({
        permintaan_bahan: '',
        title: '',
        category: 'Plastik',
        quantity: '',
        requester: 'Komunitas DIY',
        targetBankSampah: bankSampahList[0]?.name || '',
        location: '',
        urgency: 'Sedang',
        description: ''
      });
    } catch (error) {
      console.error('Gagal membuat permintaan bahan:', error);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesCategory = selectedCategory === 'Semua' || r.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesQuery =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.targetBankSampah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesQuery;
  });

  const categories = ['Semua', 'Plastik', 'Kertas & Kardus', 'Kain', 'Logam', 'Kaca'];

  return (
    <div className="space-y-8 font-sans text-[#1d3b2f]">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1f8a5b] tracking-widest uppercase flex items-center gap-1.5">
            <PackagePlus className="w-3.5 h-3.5" /> LOGISTIK & PASOKAN BAHAN
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d3b2f] mt-0.5">
            Request Bahan Daur Ulang
          </h1>
          <p className="text-xs text-[#6b8279] mt-1 max-w-xl">
            Ajukan kebutuhan bahan mentah daur ulang untuk kegiatan workshop atau salurkan bahan dari Bank Sampah.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0b4d36] hover:bg-[#0a3f2d] text-white text-xs font-bold px-4 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#0b4d36]/10 shrink-0 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Request Bahan Baru</span>
        </button>
      </div>

      {/* Bar Filter Status & Kategori */}
      <div className="bg-white p-4 rounded-2xl border border-[#d7e6dd] flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-[#0b4d36] text-white shadow-xs'
                : 'bg-[#f5faf7] text-[#6b8279] hover:bg-[#e1f3e9] hover:text-[#0b4d36]'
            }`}
          >
            Semua ({requests.length})
          </button>

          <button
            onClick={() => setSelectedStatus('Open')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedStatus === 'Open'
                ? 'bg-[#8a5a00] text-white shadow-xs'
                : 'bg-[#fdecc4]/60 text-[#8a5a00] hover:bg-[#fdecc4]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Diperlukan ({requests.filter(r => r.status === 'Open').length})
          </button>

          <button
            onClick={() => setSelectedStatus('In Progress')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedStatus === 'In Progress'
                ? 'bg-[#1f8a5b] text-[#0b4d36] shadow-xs'
                : 'bg-[#e1f3e9] text-[#0b4d36] hover:bg-[#cfeedd]'
            }`}
          >
            <Recycle className="w-3.5 h-3.5" /> Dalam Proses ({requests.filter(r => r.status === 'In Progress').length})
          </button>

          <button
            onClick={() => setSelectedStatus('Fulfilled')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedStatus === 'Fulfilled'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-[#cfeedd] text-[#0b4d36] hover:bg-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Terpenuhi ({requests.filter(r => r.status === 'Fulfilled').length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6b8279]" />
          <input
            type="text"
            placeholder="Cari bahan / pemohon / lokasi / bank sampah..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
          />
        </div>
      </div>

      {/* Filter Chip Kategori Bahan */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-[#6b8279] shrink-0 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-[#1f8a5b]" /> Kategori:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#0b4d36] text-white shadow-xs'
                : 'bg-white text-[#6b8279] hover:bg-[#e1f3e9] hover:text-[#0b4d36] border border-[#d7e6dd]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Kartu Request Bahan */}
      {isLoadingRequests ? (
        <div className="bg-white rounded-2xl border border-[#d7e6dd] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-[#e1f3e9] text-[#0b4d36] rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#1d3b2f]">
            Memuat data request bahan...
          </h3>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#d7e6dd] p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#e1f3e9] text-[#0b4d36] font-bold text-[10px] px-2.5 py-1 rounded-md border border-[#d7e6dd]">
                      {item.category}
                    </span>

                    {item.urgency === 'Tinggi' && (
                      <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Urgensi Tinggi
                      </span>
                    )}
                    {item.urgency === 'Sedang' && (
                      <span className="bg-[#fdecc4] text-[#8a5a00] font-bold text-[10px] px-2.5 py-1 rounded-md">
                        Urgensi Sedang
                      </span>
                    )}
                  </div>

                  {item.status === 'Open' && (
                    <span className="bg-[#fdecc4] text-[#8a5a00] font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Diperlukan
                    </span>
                  )}
                  {item.status === 'In Progress' && (
                    <span className="bg-[#e1f3e9] text-[#0b4d36] font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <Recycle className="w-3 h-3" /> Dalam Proses
                    </span>
                  )}
                  {item.status === 'Fulfilled' && (
                    <span className="bg-[#cfeedd] text-[#0b4d36] font-bold text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Terpenuhi
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base text-[#1d3b2f] leading-snug">
                    {item.title}
                  </h3>
                  <div className="mt-1 inline-block bg-[#f5faf7] border border-[#d7e6dd] px-2.5 py-1 rounded-lg text-xs font-extrabold text-[#1f8a5b]">
                    Target Kuantitas: {item.quantity}
                  </div>
                </div>

                <p className="text-xs text-[#6b8279] leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                <div className="pt-2 border-t border-[#f5faf7] grid grid-cols-2 gap-2 text-[11px] text-[#6b8279]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#1f8a5b] shrink-0" />
                    <span className="truncate font-semibold text-[#1d3b2f]">{item.targetBankSampah}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#1f8a5b] shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#d7e6dd] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#6b8279] font-medium">Ubah Status:</span>
                  <select
                    value={item.status}
                    onChange={e => handleStatusChange(item.id, e.target.value as any)}
                    className="bg-[#f5faf7] border border-[#d7e6dd] text-[#1d3b2f] text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1f8a5b]"
                  >
                    <option value="Open">Diperlukan</option>
                    <option value="In Progress">Dalam Proses</option>
                    <option value="Fulfilled">Terpenuhi</option>
                  </select>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  title="Hapus Permintaan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#d7e6dd] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-[#e1f3e9] text-[#0b4d36] rounded-full flex items-center justify-center mx-auto">
            <PackagePlus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#1d3b2f]">
            Tidak Ada Request Bahan yang Sesuai
          </h3>
          <p className="text-xs text-[#6b8279] max-w-md mx-auto">
            Belum ada permintaan bahan daur ulang untuk filter kategori ini.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0b4d36] hover:bg-[#0a3f2d] text-white text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Request Bahan Sekarang</span>
          </button>
        </div>
      )}

      {/* Modal Form Tambah Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#d7e6dd] max-w-lg w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#d7e6dd] pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#1d3b2f]">
                  Buat Request Bahan Daur Ulang
                </h2>
                <p className="text-xs text-[#6b8279]">
                  Isi rincian bahan sampah yang kamu butuhkan untuk kegiatan kreasi komunitas.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#6b8279] hover:bg-[#f5faf7] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Nama Permintaan Bahan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dibutuhkan 50 Botol Kaca Bekas Marjan"
                  value={formData.permintaan_bahan || formData.title}
                  onChange={e => setFormData({ ...formData, permintaan_bahan: e.target.value, title: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Kategori Jenis Sampah</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  >
                    <option value="Plastik">Plastik</option>
                    <option value="Kertas & Kardus">Kertas & Kardus</option>
                    <option value="Kain">Kain & Tekstil</option>
                    <option value="Logam">Logam & Kaleng</option>
                    <option value="Kaca">Kaca & Botol</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Target Jumlah / Kuantitas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 50 Botol / 10 Kg"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Nama Pemohon / Organisasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Komunitas DIY"
                    value={formData.requester}
                    onChange={e => setFormData({ ...formData, requester: e.target.value })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Tingkat Urgensi</label>
                  <select
                    value={formData.urgency}
                    onChange={e => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi (Mendesak)</option>
                  </select>
                </div>
              </div>

              {/* <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Lokasi Pengambilan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kecamatan Ciracas, Jakarta Timur"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
              </div> */}
              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Alamat Pengambilan Sampah </label>
                {isLoadingBankSampah ? (
                  <div className="flex items-center gap-2 py-2.5 px-3.5 bg-[#f5faf7] border border-[#d7e6dd] rounded-xl text-[#6b8279]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1f8a5b]" />
                    <span>Memuat daftar bank sampah...</span>
                  </div>
                ) : (
                  <select
                    value={formData.targetBankSampah}
                    onChange={e => setFormData({ ...formData, targetBankSampah: e.target.value })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  >
                    {bankSampahList.map(bank => (
                      <option key={bank.id} value={bank.name}>
                        {bank.address}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dropdown Bank Sampah yang selalu terbarui otomatis saat modal dibuka */}
              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Pilih Bank Sampah Tujuan</label>
                {isLoadingBankSampah ? (
                  <div className="flex items-center gap-2 py-2.5 px-3.5 bg-[#f5faf7] border border-[#d7e6dd] rounded-xl text-[#6b8279]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1f8a5b]" />
                    <span>Memuat daftar bank sampah...</span>
                  </div>
                ) : (
                  <select
                    value={formData.targetBankSampah}
                    onChange={e => setFormData({ ...formData, targetBankSampah: e.target.value })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  >
                    {bankSampahList.map(bank => (
                      <option key={bank.id} value={bank.name}>
                        {bank.name} 
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Keterangan Tambahan / Tujuan Permintaan</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan tujuan penggunaan bahan daur ulang ini..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
              </div>

              <div className="pt-3 border-t border-[#d7e6dd] flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#d7e6dd] text-[#6b8279] hover:bg-[#f5faf7] font-bold cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0b4d36] hover:bg-[#0a3f2d] text-white font-bold transition-all shadow-md cursor-pointer text-center"
                >
                  Publikasikan Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}