'use client';

import { useState } from 'react';
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
  Sparkles, 
  Tag 
} from 'lucide-react';

interface MaterialRequest {
  id: number;
  title: string;
  category: string;
  quantity: string;
  requester: string;
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

  // Mock Data Permintaan Bahan Daur Ulang
  const [requests, setRequests] = useState<MaterialRequest[]>([
    {
      id: 1,
      title: 'Dibutuhkan 50 Botol Plastik Bekas 1.5L',
      category: 'Plastik',
      quantity: '50 Botol',
      requester: 'Bank Sampah Melati',
      location: 'Kecamatan Sukamaju',
      urgency: 'Tinggi',
      status: 'Open',
      createdAt: '12 Okt 2026',
      description: 'Dibutuhkan untuk kegiatan workshop pembuatan pot tanaman hias warga RW 04.'
    },
    {
      id: 2,
      title: 'Dibutuhkan Kardus Tebal & Utuh 10 Kg',
      category: 'Kertas & Kardus',
      quantity: '10 Kg',
      requester: 'Sanggar Kreasi Warga',
      location: 'Kelurahan Pandanwangi',
      urgency: 'Sedang',
      status: 'In Progress',
      createdAt: '11 Okt 2026',
      description: 'Bahan dasar pembuatan maket dan kotak penyimpanan serbaguna anak-anak sekolah.'
    },
    {
      id: 3,
      title: 'Kain Perca & Baju Bekas Tidak Terpakai',
      category: 'Kain',
      quantity: '15 Kg',
      requester: 'Komunitas Ibu Kreatif',
      location: 'Kecamatan Lowokwaru',
      urgency: 'Rendah',
      status: 'Fulfilled',
      createdAt: '09 Okt 2026',
      description: 'Bahan pembuatan keset kaki dan totebag kain ramah lingkungan.'
    },
    {
      id: 4,
      title: 'Kaleng Minuman Bekas Aluminium',
      category: 'Logam',
      quantity: '100 Kaleng',
      requester: 'Bank Sampah Bersih Bersama',
      location: 'Kecamatan Blimbing',
      urgency: 'Tinggi',
      status: 'Open',
      createdAt: '08 Okt 2026',
      description: 'Diperlukan untuk kerajinan tempat pensil meja dan dekorasi unik.'
    }
  ]);

  // Form State untuk Buat Request Baru
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plastik',
    quantity: '',
    requester: 'Komunitas DIY',
    location: '',
    urgency: 'Sedang' as 'Tinggi' | 'Sedang' | 'Rendah',
    description: ''
  });

  // Handler Ubah Status Request
  const handleStatusChange = (id: number, newStatus: 'Open' | 'In Progress' | 'Fulfilled') => {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  // Handler Hapus Request
  const handleDelete = (id: number) => {
    if (confirm('Apakah kamu yakin ingin menghapus permintaan bahan ini?')) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  // Handler Submit Request Baru
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.quantity) return;

    const newReq: MaterialRequest = {
      id: Date.now(),
      title: formData.title,
      category: formData.category,
      quantity: formData.quantity,
      requester: formData.requester || 'Komunitas DIY',
      location: formData.location || 'Kota Malang',
      urgency: formData.urgency,
      status: 'Open',
      createdAt: 'Hari ini',
      description: formData.description || 'Membutuhkan bahan daur ulang untuk kegiatan kreasi.'
    };

    setRequests([newReq, ...requests]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      category: 'Plastik',
      quantity: '',
      requester: 'Komunitas DIY',
      location: '',
      urgency: 'Sedang',
      description: ''
    });
  };

  // Filter List Request
  const filteredRequests = requests.filter(r => {
    const matchesCategory = selectedCategory === 'Semua' || r.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesQuery =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesQuery;
  });

  const categories = ['Semua', 'Plastik', 'Kertas & Kardus', 'Kain', 'Logam', 'Kaca'];

  return (
    <div className="space-y-8 font-sans text-[#1d3b2f]">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#1f8a5b] tracking-widest uppercase flex items-center gap-1.5">
            <PackagePlus className="w-3.5 h-3.5" /> LOGISTIK & PASOKAN BAHAN
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1d3b2f] mt-0.5">
            Request Bahan Daur Ulang
          </h1>
          <p className="text-xs text-[#6b8279] mt-1">
            Ajukan kebutuhan bahan mentah daur ulang untuk kegiatan workshop atau salurkan bahan dari Bank Sampah.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0b4d36] hover:bg-[#0a3f2d] text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-[#0b4d36]/10 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Request Bahan Baru</span>
        </button>
      </div>

      {/* Bar Filter Status & Kategori */}
      <div className="bg-white p-4 rounded-2xl border border-[#d7e6dd] flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xs">
        {/* Status Filter Tabs */}
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
                ? 'bg-[#1f8a5b] text-white shadow-xs'
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

        {/* Input Pencarian */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6b8279]" />
          <input
            type="text"
            placeholder="Cari bahan / pemohon / lokasi..."
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
      {filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#d7e6dd] p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                {/* Header Card: Badges Status & Urgensi */}
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

                {/* Judul Request & Jumlah */}
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1d3b2f] leading-snug">
                    {item.title}
                  </h3>
                  <div className="mt-1 inline-block bg-[#f5faf7] border border-[#d7e6dd] px-2.5 py-1 rounded-lg text-xs font-extrabold text-[#1f8a5b]">
                    Target Kuantitas: {item.quantity}
                  </div>
                </div>

                {/* Deskripsi */}
                <p className="text-xs text-[#6b8279] leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Info Pemohon & Lokasi */}
                <div className="pt-2 border-t border-[#f5faf7] grid grid-cols-2 gap-2 text-[11px] text-[#6b8279]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#1f8a5b] shrink-0" />
                    <span className="truncate font-semibold text-[#1d3b2f]">{item.requester}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#1f8a5b] shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar Ubah Status & Hapus */}
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
        /* Empty State */
        <div className="bg-white rounded-2xl border border-[#d7e6dd] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-[#e1f3e9] text-[#0b4d36] rounded-full flex items-center justify-center mx-auto">
            <PackagePlus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#1d3b2f]">
            Tidak Ada Request Bahan yang Sesuai
          </h3>
          <p className="text-xs text-[#6b8279] max-w-md mx-auto">
            Belum ada permintaan bahan daur ulang untuk filter kategori ini. Kamu bisa membuat request bahan baru.
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

      {/* Modal Popup: Form Tambah Request Bahan Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#d7e6dd] max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-[#d7e6dd] pb-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1d3b2f]">
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

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Nama Permintaan Bahan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dibutuhkan 50 Botol Kaca Bekas Marjan"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Nama Pemohon / Organisasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bank Sampah Melati"
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

              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Lokasi Pengambilan / Kecamatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kecamatan Sukamaju, Kota Malang"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
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

              <div className="pt-3 border-t border-[#d7e6dd] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#d7e6dd] text-[#6b8279] hover:bg-[#f5faf7] font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0b4d36] hover:bg-[#0a3f2d] text-white font-bold transition-all shadow-md cursor-pointer"
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