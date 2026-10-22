'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Users, 
  Award, 
  Trash2, 
  X, 
  Recycle, 
  Layers, 
  Eye, 
  CheckCircle2, 
  ListOrdered, 
  Scissors,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface Step {
  title: string;
  description: string;
}

interface Guide {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  duration: string;
  inspiredCount: number;
  status: string;
  image: string;
  materials: string[];
  steps: Step[];
}

export default function DIYGuidesPage() {
  const wasteCategories = [
    { id: 'Semua', label: 'Semua Sampah', icon: '♻️' },
    { id: 'Plastik', label: 'Plastik', icon: '🥤' },
    { id: 'Kertas & Kardus', label: 'Kertas & Kardus', icon: '📦' },
    { id: 'Kain', label: 'Kain & Tekstil', icon: '👕' },
    { id: 'Logam', label: 'Logam & Kaleng', icon: '🥫' },
    { id: 'Kaca', label: 'Kaca & Botol', icon: '🍾' },
    { id: 'Organik', label: 'Sampah Organik', icon: '🍂' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetailGuide, setSelectedDetailGuide] = useState<Guide | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const [guides, setGuides] = useState<Guide[]>([
    {
      id: 1,
      title: 'Pot Bunga Estetik dari Botol Plastik Bekas',
      category: 'Plastik',
      difficulty: 'Easy',
      points: 50,
      duration: '20 menit',
      inspiredCount: 128,
      status: 'Published',
      image: '/panduan-diy/pot.jpg',
      materials: [
        '1 Botol plastik bekas ukuran 1.5 Liter',
        'Gunting / Cutter tajam',
        'Cat akrilik & Kuas',
        'Tanah hara & Bibit tanaman kecil',
        'Paku untuk lubang drainase'
      ],
      steps: [
        { title: 'Pembersihan Botol', description: 'Cuci bersih bagian dalam dan luar botol hingga bebas sisa minuman, lalu keringkan.' },
        { title: 'Pemotongan Botol', description: 'Gunakan cutter untuk memotong botol menjadi dua bagian. Ambil bagian bawah botol sebagai pot.' },
        { title: 'Pembuatan Drainase', description: 'Lubangi bagian bawah botol dengan paku yang dipanaskan agar air siraman tanaman mengalir.' },
        { title: 'Pengecatan & Dekorasi', description: 'Lapiskan cat akrilik pada bagian luar botol. Buat pola hias sesuai kreativitasmu.' },
        { title: 'Penanaman', description: 'Isi botol dengan tanah subur hingga 3/4 bagian, masukkan bibit tanaman, lalu siram sedikit air.' }
      ]
    },
    {
      id: 2,
      title: 'Kotak Penyimpanan Serbaguna dari Kardus Bekas',
      category: 'Kertas & Kardus',
      difficulty: 'Easy',
      points: 50,
      duration: '25 menit',
      inspiredCount: 84,
      status: 'Published',
      image: '/panduan-diy/storagekardus.jpg',
      materials: [
        '1 Kardus bekas sepatu atau kardus mi instan',
        'Kertas kado bekas / Kertas koran',
        'Lem kertas & Lem tembak',
        'Penggaris & Cutter'
      ],
      steps: [
        { title: 'Pengukuran Kardus', description: 'Potong bagian penutup atas kardus yang tidak terpakai menggunakan cutter.' },
        { title: 'Pembersihan Permukaan', description: 'Pastikan kardus bersih dari debu atau sisa selotip lama.' },
        { title: 'Pelapisan Kertas Kado', description: 'Oleskan lem secara merata di seluruh sisi luar kardus, lalu rekatkan kertas kado dengan rapi.' },
        { title: 'Penyekatan Dalam', description: 'Potong sisa kardus menjadi sekat bagian dalam untuk memisahkan barang-barang kecil.' }
      ]
    },
    {
      id: 3,
      title: 'Totebag Ramah Lingkungan dari Pakaian Bekas',
      category: 'Kain',
      difficulty: 'Medium',
      points: 75,
      duration: '45 menit',
      inspiredCount: 62,
      status: 'Published',
      image: '/panduan-diy/totebag.jpg',
      materials: [
        '1 Kaos bekas berbahan tebal',
        'Gunting kain khusus',
        'Jarum jahit & Benang',
        'Kapur jahit / Pensil acuan'
      ],
      steps: [
        { title: 'Pemotongan Lengan', description: 'Gunting kedua bagian lengan kaos bekas tepat pada garis jahitan bahu.' },
        { title: 'Pemotongan Kerah', description: 'Gunting melingkar di bagian kerah kaos untuk membuat bukaan atas totebag.' },
        { title: 'Penjahitan Dasar', description: 'Balik kaos ke posisi dalam. Jahit bagian bawah kaos hingga tertutup rapat.' },
        { title: 'Finishing', description: 'Balikkan kembali kaos ke posisi semula. Totebag ramah lingkungan siap digunakan!' }
      ]
    },
    {
      id: 4,
      title: 'Tempat Pensil Meja dari Kaleng Minuman',
      category: 'Logam',
      difficulty: 'Medium',
      points: 75,
      duration: '30 menit',
      inspiredCount: 96,
      status: 'Published',
      image: '/panduan-diy/tempatpensil.jpg',
      materials: [
        '1 Kaleng bekas minuman aluminium',
        'Pembuka kaleng & Amplas halus',
        'Tali rami / Benang wol',
        'Lem tembak'
      ],
      steps: [
        { title: 'Mereset Pinggiran Tajam', description: 'Buka tutup atas kaleng dengan pembuka kaleng, lalu amplas pinggirannya agar tidak tajam.' },
        { title: 'Pembersihan Kaleng', description: 'Cuci bersih kaleng bagian dalam dan keringkan sepenuhnya.' },
        { title: 'Penggulungan Tali Rami', description: 'Beri lem tembak di dasar kaleng, lalu lilitkan tali rami melingkar rapat ke arah atas.' },
        { title: 'Penambahan Aksesoris', description: 'Tambahkan pita atau hiasan kancing di bagian tengah kaleng.' }
      ]
    },
    {
      id: 5,
      title: 'Ubah Sisa Dapur Menjadi Kompos Organik Subur',
      category: 'Organik',
      difficulty: 'Easy',
      points: 50,
      duration: '15 menit',
      inspiredCount: 214,
      status: 'Published',
      image: '/panduan-diy/pupukorganik.jpg',
      materials: [
        'Sampah organik dapur (kulit buah, sisa sayur)',
        'Dedaunan kering / Serbuk gergaji',
        'Wadah komposter / Ember berlubang',
        'Air secukupnya & Bioaktivator EM4'
      ],
      steps: [
        { title: 'Pencacahan Sampah Organik', description: 'Cacah sisa sayuran dan kulit buah menjadi potongan kecil agar cepat terurai.' },
        { title: 'Penyusunan Lapisan', description: 'Masukkan lapisan daun kering di dasar ember, diikuti lapisan sampah dapur.' },
        { title: 'Penyiraman Aktivator', description: 'Cipratkan larutan EM4 yang telah dicampur air untuk mempercepat fermentasi.' },
        { title: 'Penutupan & Pengadukan', description: 'Tutup rapat komposter dan aduk seminggu sekali. Kompos siap pakai dalam 3-4 minggu.' }
      ]
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Plastik',
    difficulty: 'Easy',
    points: 50,
    duration: '20 menit',
    imagePath: '',
    materialsText: '',
    stepsText: '',
  });

  // Pencocokan Kategori yang Fleksibel
  const isCategoryMatch = (guideCategory: string, targetCategory: string) => {
    if (targetCategory === 'Semua') return true;
    const gCat = guideCategory.toLowerCase().trim();
    const tCat = targetCategory.toLowerCase().trim();

    if (gCat === tCat) return true;
    if (tCat.includes('kertas') && (gCat.includes('kertas') || gCat.includes('kardus'))) return true;
    if (tCat.includes('kain') && (gCat.includes('kain') || gCat.includes('tekstil'))) return true;
    if (tCat.includes('logam') && (gCat.includes('logam') || gCat.includes('kaleng'))) return true;
    if (tCat.includes('kaca') && (gCat.includes('kaca') || gCat.includes('botol'))) return true;

    return false;
  };

  const filteredGuides = guides.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = isCategoryMatch(g.category, selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleOpenDetailModal = (guide: Guide) => {
    setSelectedDetailGuide(guide);
    setActiveStepIndex(0);
  };

  const handleCreateGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const parsedMaterials = formData.materialsText
      ? formData.materialsText.split('\n').filter(m => m.trim() !== '')
      : ['Bahan daur ulang utama', 'Gunting / Cutter', 'Perekat / Lem'];

    const parsedSteps = formData.stepsText
      ? formData.stepsText.split('\n').filter(s => s.trim() !== '').map((s, index) => ({
          title: `Langkah ${index + 1}`,
          description: s.trim()
        }))
      : [
          { title: 'Langkah 1: Persiapan', description: 'Siapkan alat dan bahan sampah yang akan diolah.' },
          { title: 'Langkah 2: Pengerjaan', description: 'Ikuti alur pembentukan karya sesuai panduan.' },
          { title: 'Langkah 3: Finishing', description: 'Rapikan karya dan periksa ketahanannya.' }
        ];

    const finalImage = formData.imagePath.trim() !== '' 
      ? formData.imagePath.trim() 
      : '/panduan-diy/pot.jpg';

    const newGuide: Guide = {
      id: Date.now(),
      title: formData.title,
      category: formData.category,
      difficulty: formData.difficulty,
      points: Number(formData.points),
      duration: formData.duration,
      inspiredCount: 0,
      status: 'Published',
      image: finalImage,
      materials: parsedMaterials,
      steps: parsedSteps,
    };

    setGuides([newGuide, ...guides]);
    setIsCreateModalOpen(false);
    setFormData({
      title: '',
      category: 'Plastik',
      difficulty: 'Easy',
      points: 50,
      duration: '20 menit',
      imagePath: '',
      materialsText: '',
      stepsText: '',
    });
  };

  const handleDeleteGuide = (id: number) => {
    if (confirm('Apakah kamu yakin ingin menghapus tutorial ini?')) {
      setGuides(guides.filter((g) => g.id !== id));
      if (selectedDetailGuide?.id === id) {
        setSelectedDetailGuide(null);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#1d3b2f]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1f8a5b] tracking-widest uppercase flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> KATALOG KREATIF KOMUNITAS
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1d3b2f] mt-0.5">
            Panduan & Tutorial DIY
          </h1>
          <p className="text-xs text-[#6b8279] mt-1 max-w-xl">
            Klik kategori sampah di bawah untuk memfilter tutorial, lihat langkah pengerjaan, atau buat tutorial baru.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormData({
              ...formData,
              category: selectedCategory !== 'Semua' ? selectedCategory : 'Plastik',
            });
            setIsCreateModalOpen(true);
          }}
          className="bg-[#0b4d36] hover:bg-[#0a3f2d] text-white text-xs font-bold px-4 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tutorial DIY</span>
        </button>
      </div>

      {/* Filter Kategori Sampah */}
      <div className="bg-white p-5 rounded-2xl border border-[#d7e6dd] space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Recycle className="w-4 h-4 text-[#1f8a5b]" />
            <h2 className="text-xs font-bold text-[#1d3b2f] uppercase tracking-wider">
              Filter Jenis Sampah:
            </h2>
          </div>
          <span className="text-[10px] text-[#6b8279]">
            Klik salah satu kotak untuk memfilter
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {wasteCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = guides.filter((g) => isCategoryMatch(g.category, cat.id)).length;

            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#0b4d36] border-[#0b4d36] text-white shadow-md'
                    : 'bg-[#f5faf7] border-[#d7e6dd] text-[#1d3b2f] hover:bg-[#e1f3e9] hover:border-[#1f8a5b]'
                }`}
              >
                <div className="text-xl mb-1">{cat.icon}</div>
                <div>
                  <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-[#1d3b2f]'}`}>
                    {cat.label}
                  </p>
                  <p className={`text-[10px] mt-1 font-semibold ${isSelected ? 'text-[#cfeedd]' : 'text-[#6b8279]'}`}>
                    {count} Tutorial
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bar Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-[#d7e6dd] flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#6b8279]" />
          <input
            type="text"
            placeholder="Cari nama tutorial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
          />
        </div>

        <div className="text-xs text-[#6b8279] font-medium flex items-center gap-2 self-start sm:self-auto">
          <Layers className="w-4 h-4 text-[#1f8a5b]" />
          <span>
            Menampilkan <strong className="text-[#0b4d36]">{filteredGuides.length}</strong> tutorial
            {selectedCategory !== 'Semua' && (
              <> untuk jenis <strong className="text-[#0b4d36]">{selectedCategory}</strong></>
            )}
          </span>
          {selectedCategory !== 'Semua' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('Semua')}
              className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold hover:bg-red-100 cursor-pointer ml-1"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Grid Tutorial DIY */}
      {filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredGuides.map((guide) => (
            <div
              key={guide.id}
              className="bg-white rounded-2xl border border-[#d7e6dd] overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
            >
              <div>
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#e1f3e9]">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/panduan-diy/pot.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-white/95 text-[#0b4d36] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                      {guide.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 bg-[#0b4d36] text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 text-[#fdecc4]" />
                    <span>+{guide.points} Pts</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <h3 className="font-serif font-bold text-sm text-[#1d3b2f] line-clamp-2 leading-snug">
                    {guide.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[10px] text-[#6b8279] pt-1 border-t border-[#f5faf7]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#1f8a5b]" /> {guide.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[#1f8a5b]" /> {guide.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#1f8a5b]" /> {guide.inspiredCount} warga
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 border-t border-[#d7e6dd] bg-[#f5faf7] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(guide)}
                  className="flex-1 bg-[#0b4d36] hover:bg-[#0a3f2d] text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Step-by-Step</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteGuide(guide.id)}
                  className="p-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Hapus Tutorial"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#d7e6dd] p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-[#e1f3e9] text-[#0b4d36] rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#1d3b2f]">
            Belum Ada Tutorial DIY untuk Kategori &quot;{selectedCategory}&quot;
          </h3>
          <p className="text-xs text-[#6b8279] max-w-md mx-auto">
            Kamu dapat membuat tutorial baru untuk mengolah sampah jenis <strong>{selectedCategory}</strong> agar menjadi ide karya warga.
          </p>
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                category: selectedCategory !== 'Semua' ? selectedCategory : 'Plastik',
              });
              setIsCreateModalOpen(true);
            }}
            className="bg-[#0b4d36] hover:bg-[#0a3f2d] text-white text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tutorial Sekarang</span>
          </button>
        </div>
      )}

      {/* Modal Detail Step-by-Step */}
      {selectedDetailGuide && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#d7e6dd] max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#d7e6dd] pb-3 sm:pb-4 gap-2">
              <div className="space-y-1 pr-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#cfeedd] text-[#0b4d36] text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                    {selectedDetailGuide.category}
                  </span>
                  <span className="text-xs text-[#6b8279] font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#1f8a5b]" /> {selectedDetailGuide.duration}
                  </span>
                  <span className="text-xs text-[#1f8a5b] font-bold">
                    +{selectedDetailGuide.points} Poin Reward
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1d3b2f]">
                  {selectedDetailGuide.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailGuide(null)}
                className="p-1.5 text-[#6b8279] hover:bg-[#f5faf7] rounded-xl cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Foto Sampul Tutorial */}
            {selectedDetailGuide.image && (
              <div className="relative h-44 sm:h-56 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#e1f3e9] border border-[#d7e6dd] shadow-2xs">
                <img
                  src={selectedDetailGuide.image}
                  alt={selectedDetailGuide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/panduan-diy/pot.jpg';
                  }}
                />
                <div className="absolute top-3 left-3 bg-[#0b4d36]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                  {selectedDetailGuide.category}
                </div>
                <div className="absolute top-3 right-3 bg-white/95 text-[#0b4d36] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                  +{selectedDetailGuide.points} Pts Reward
                </div>
              </div>
            )}

            {/* Alat & Bahan */}
            <div className="space-y-3 bg-[#f5faf7] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#d7e6dd]">
              <h3 className="text-xs font-bold text-[#0b4d36] uppercase tracking-wider flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Alat & Bahan Yang Dibutuhkan:
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1d3b2f]">
                {selectedDetailGuide.materials.map((mat, idx) => (
                  <li key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#d7e6dd]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1f8a5b] shrink-0" />
                    <span>{mat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stepper Interaktif */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-[#0b4d36] uppercase tracking-wider flex items-center gap-2">
                  <ListOrdered className="w-4 h-4" /> Langkah Pengerjaan ({selectedDetailGuide.steps.length} Step):
                </h3>
                <span className="text-xs text-[#6b8279] font-medium">
                  Langkah {activeStepIndex + 1} dari {selectedDetailGuide.steps.length}
                </span>
              </div>

              {/* Progress Bar Step */}
              <div className="flex gap-1.5">
                {selectedDetailGuide.steps.map((_, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
                      idx === activeStepIndex
                        ? 'bg-[#0b4d36]'
                        : idx < activeStepIndex
                        ? 'bg-[#1f8a5b]'
                        : 'bg-[#d7e6dd]'
                    }`}
                  />
                ))}
              </div>

              {/* Detail Step Aktif */}
              <div className="p-4 bg-[#f5faf7] rounded-2xl border border-[#1f8a5b]/30 space-y-2">
                <div className="flex items-center gap-2 text-[#0b4d36] font-bold text-xs">
                  <span className="w-6 h-6 rounded-full bg-[#0b4d36] text-white flex items-center justify-center text-[10px]">
                    {activeStepIndex + 1}
                  </span>
                  <span>{selectedDetailGuide.steps[activeStepIndex]?.title}</span>
                </div>
                <p className="text-xs text-[#1d3b2f] leading-relaxed pl-8">
                  {selectedDetailGuide.steps[activeStepIndex]?.description}
                </p>
              </div>

              {/* Navigation Button Step */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded-xl border border-[#d7e6dd] text-xs font-bold text-[#1d3b2f] hover:bg-[#f5faf7] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelum
                </button>

                <button
                  type="button"
                  disabled={activeStepIndex === selectedDetailGuide.steps.length - 1}
                  onClick={() => setActiveStepIndex((prev) => Math.min(selectedDetailGuide.steps.length - 1, prev + 1))}
                  className="px-3 py-1.5 rounded-xl bg-[#0b4d36] hover:bg-[#0a3f2d] text-white text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  Lanjut <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#d7e6dd] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailGuide(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0b4d36] hover:bg-[#0a3f2d] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Tutup Tutorial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah Tutorial */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#d7e6dd] max-w-lg w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#d7e6dd] pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#1d3b2f]">
                  Tambah Tutorial DIY Baru
                </h2>
                <p className="text-xs text-[#6b8279]">
                  Isi judul, kategori jenis sampah, alat bahan, serta langkah pengerjaannya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#6b8279] hover:bg-[#f5faf7] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGuide} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Judul Tutorial</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lampu Hias Estetik dari Botol Kaca Bekas"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Path/URL Gambar Sampul (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: /panduan-diy/pot.jpg atau https://..."
                  value={formData.imagePath}
                  onChange={(e) => setFormData({ ...formData, imagePath: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Kategori Jenis Sampah</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  >
                    <option value="Plastik">Plastik</option>
                    <option value="Kertas & Kardus">Kertas & Kardus</option>
                    <option value="Kain">Kain & Tekstil</option>
                    <option value="Logam">Logam & Kaleng</option>
                    <option value="Kaca">Kaca & Botol</option>
                    <option value="Organik">Organik</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Tingkat Kesulitan</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => {
                      const diff = e.target.value;
                      let pts = 50;
                      if (diff === 'Medium') pts = 75;
                      if (diff === 'Hard') pts = 150;
                      setFormData({ ...formData, difficulty: diff, points: pts });
                    }}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  >
                    <option value="Easy">Easy (+50 Poin)</option>
                    <option value="Medium">Medium (+75 Poin)</option>
                    <option value="Hard">Hard (+150 Poin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Poin Reward (Pts)</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1d3b2f] mb-1">Est. Durasi Pembuatan</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2.5 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Daftar Alat & Bahan (1 per baris)</label>
                <textarea
                  rows={3}
                  placeholder="Botol plastik bekas&#10;Gunting&#10;Cat akrilik"
                  value={formData.materialsText}
                  onChange={(e) => setFormData({ ...formData, materialsText: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1d3b2f] mb-1">Langkah Pembuatan (1 per baris)</label>
                <textarea
                  rows={3}
                  placeholder="Bersihkan botol plastik bekas hingga kering.&#10;Potong bagian tengah botol.&#10;Cat bagian luar dan isi dengan tanah."
                  value={formData.stepsText}
                  onChange={(e) => setFormData({ ...formData, stepsText: e.target.value })}
                  className="w-full bg-[#f5faf7] border border-[#d7e6dd] rounded-xl px-3.5 py-2 text-[#1d3b2f] focus:outline-none focus:ring-2 focus:ring-[#1f8a5b]"
                />
              </div>

              <div className="pt-3 border-t border-[#d7e6dd] flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#d7e6dd] text-[#6b8279] hover:bg-[#f5faf7] font-bold cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0b4d36] hover:bg-[#0a3f2d] text-white font-bold transition-all shadow-md cursor-pointer text-center"
                >
                  Simpan & Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}