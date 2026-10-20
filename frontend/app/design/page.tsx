'use client';

/**
 * /design  — halaman preview design system GO GREEN.
 * Hanya untuk development. Tampilkan seluruh palet warna dan semua komponen.
 */

import { useState } from 'react';
import {
  Leaf,
  Recycle,
  Users,
  BarChart3,
  Plus,
  Download,
  Trash2,
  ArrowRight,
  PackageCheck,
} from 'lucide-react';

import {
  Button,
  Card,
  CardHeader,
  CardDivider,
  Badge,
  Input,
  Select,
  Textarea,
  PageHeader,
  StatCard,
} from '@/components/ui';

/* ─── Palet token warna ───────────────────────────────────────────────────── */

const COLOR_TOKENS: Array<{ name: string; bg: string; text: string; label: string }> = [
  { name: 'forest',       bg: 'bg-forest',       text: 'text-white',       label: '--color-forest' },
  { name: 'forest-deep',  bg: 'bg-forest-deep',  text: 'text-white',       label: '--color-forest-deep' },
  { name: 'leaf',         bg: 'bg-leaf',         text: 'text-white',       label: '--color-leaf' },
  { name: 'mint',         bg: 'bg-mint',         text: 'text-forest',      label: '--color-mint' },
  { name: 'mist',         bg: 'bg-mist',         text: 'text-forest',      label: '--color-mist' },
  { name: 'paper',        bg: 'bg-paper',        text: 'text-ink',         label: '--color-paper' },
  { name: 'sun',          bg: 'bg-sun',          text: 'text-sun-ink',     label: '--color-sun' },
  { name: 'sun-ink',      bg: 'bg-sun-ink',      text: 'text-white',       label: '--color-sun-ink' },
  { name: 'ink',          bg: 'bg-ink',          text: 'text-white',       label: '--color-ink' },
  { name: 'muted',        bg: 'bg-muted',        text: 'text-white',       label: '--color-muted' },
  { name: 'line',         bg: 'bg-line',         text: 'text-ink',         label: '--color-line' },
  { name: 'danger',       bg: 'bg-danger',       text: 'text-white',       label: '--color-danger' },
  { name: 'danger-soft',  bg: 'bg-danger-soft',  text: 'text-danger',      label: '--color-danger-soft' },
];

/* ─── Section wrapper ─────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl font-semibold text-ink border-b border-line pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function DesignPage() {
  const [inputVal, setInputVal]       = useState('');
  const [selectVal, setSelectVal]     = useState('');
  const [textareaVal, setTextareaVal] = useState('');

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-14">

        {/* ── Header ── */}
        <PageHeader
          title="Design System GO GREEN"
          description="Preview komponen dan token warna. Halaman ini hanya tersedia di development."
          action={
            <Badge variant="pending">Development only</Badge>
          }
        />

        {/* ══════════════════════════════════════════════════════════════════
            1. PALET WARNA
        ══════════════════════════════════════════════════════════════════ */}
        <Section title="Palet Warna">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {COLOR_TOKENS.map(({ name, bg, text, label }) => (
              <div key={name} className="overflow-hidden rounded-xl border border-line">
                <div className={`h-16 ${bg}`} />
                <div className="px-3 py-2 bg-white">
                  <p className="text-xs font-semibold text-ink">{name}</p>
                  <p className="text-xs text-muted font-mono">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            2. TIPOGRAFI
        ══════════════════════════════════════════════════════════════════ */}
        <Section title="Tipografi">
          <Card>
            <p className="font-serif text-4xl font-semibold text-ink leading-tight mb-1">
              Judul Serif — Newsreader
            </p>
            <p className="font-serif text-2xl text-muted mb-4">
              Subheading serif lebih ringan
            </p>
            <CardDivider className="my-4" />
            <p className="font-sans text-base text-ink mb-1">
              Body sans-serif — Plus Jakarta Sans
            </p>
            <p className="font-sans text-sm text-muted mb-1">
              Teks kecil / label — text-sm text-muted
            </p>
            <p className="font-mono text-sm text-muted">
              Monospace — font-mono (kode / ID)
            </p>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            3. BUTTON
        ══════════════════════════════════════════════════════════════════ */}
        <Section title="Button">

          {/* Varian */}
          <Card>
            <CardHeader title="Varian" />
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </Card>

          {/* Ukuran */}
          <Card>
            <CardHeader title="Ukuran" />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
            </div>
          </Card>

          {/* Dengan ikon */}
          <Card>
            <CardHeader title="Dengan Ikon" />
            <div className="flex flex-wrap gap-3">
              <Button variant="primary"  icon={Plus}     >Tambah</Button>
              <Button variant="secondary" icon={Download} >Unduh</Button>
              <Button variant="ghost"    icon={ArrowRight}>Lanjut</Button>
              <Button variant="danger"   icon={Trash2}   >Hapus</Button>
            </div>
          </Card>

          {/* State */}
          <Card>
            <CardHeader title="State" />
            <div className="flex flex-wrap gap-3">
              <Button loading>Memuat...</Button>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" loading size="sm">Simpan</Button>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            4. BADGE
        ══════════════════════════════════════════════════════════════════ */}
        <Section title="Badge">
          <Card>
            <div className="flex flex-wrap gap-3">
              <Badge variant="success">Terverifikasi</Badge>
              <Badge variant="pending">Menunggu</Badge>
              <Badge variant="danger">Ditolak</Badge>
              <Badge variant="neutral">Tidak aktif</Badge>
            </div>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            5. FORM FIELDS
        ══════════════════════════════════════════════════════════════════ */}
        <Section title="Form Fields">
          <Card>
            <CardHeader title="Input" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Nama lengkap"
                placeholder="Masukkan nama"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                hint="Sesuai KTP"
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@domain.com"
                defaultValue="salah@"
                error="Format email tidak valid."
              />
              <Input
                label="Disabled"
                placeholder="Tidak bisa diubah"
                disabled
                defaultValue="Nilai tetap"
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Select" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Kategori sampah"
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
                hint="Pilih satu kategori"
                required
              >
                <option value="">-- Pilih --</option>
                <option value="plastik">Plastik PET</option>
                <option value="kardus">Kardus</option>
                <option value="kaleng">Kaleng</option>
              </Select>
              <Select
                label="Status"
                error="Wajib dipilih."
              >
                <option value="">-- Pilih --</option>
              </Select>
            </div>
          </Card>

          <Card>
            <CardHeader title="Textarea" />
            <Textarea
              label="Catatan"
              placeholder="Tulis catatan tambahan di sini..."
              value={textareaVal}
              onChange={(e) => setTextareaVal(e.target.value)}
              hint="Maksimal 500 karakter."
              rows={4}
            />
          </Card>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            6. CARD
        ══════════════════════════════════════════════════════════════════ */}
        <Section title="Card">
          <Card>
            <CardHeader
              title="Judul kartu"
              description="Deskripsi singkat di bawah judul."
              action={<Button size="sm" variant="secondary">Aksi</Button>}
            />
            <p className="text-sm text-muted">
              Konten kartu menggunakan token warna dan ukuran yang konsisten.
            </p>
            <CardDivider className="my-4" />
            <p className="text-sm text-muted">
              Bagian bawah setelah divider.
            </p>
          </Card>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            7. STAT CARD
        ══════════════════════════════════════════════════════════════════ */}
        <Section title="StatCard">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={Recycle}
              label="Setoran hari ini"
              value={24}
              unit="setoran"
              trend="+3 dari kemarin"
            />
            <StatCard
              icon={BarChart3}
              label="Total berat"
              value={312}
              unit="kg"
              iconClass="text-forest"
            />
            <StatCard
              icon={Users}
              label="Penyetor unik"
              value={18}
              unit="orang"
              iconClass="text-sun-ink"
            />
            <StatCard
              icon={PackageCheck}
              label="Poin diberikan"
              value={15600}
              unit="poin"
              iconClass="text-danger"
            />
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════
            8. PAGE HEADER
        ══════════════════════════════════════════════════════════════════ */}
        <Section title="PageHeader">
          <Card>
            <PageHeader
              title="Judul Halaman"
              description="Deskripsi singkat tentang isi halaman ini."
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon={Download}>Ekspor</Button>
                  <Button size="sm" icon={Plus}>Tambah</Button>
                </div>
              }
            />
          </Card>
        </Section>

        {/* ── Footer label ── */}
        <p className="text-center text-xs text-muted pb-4">
          GO GREEN Design System — hanya tersedia di development
        </p>

      </div>
    </div>
  );
}
