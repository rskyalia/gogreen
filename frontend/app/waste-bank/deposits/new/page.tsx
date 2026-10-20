'use client';

/**
 * /waste-bank/deposits/new
 * Alur: Lookup member → Konfirmasi → Form multi-item → Konfirmasi → Sukses
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  PageHeader, Card, Button, Input, Select,
  ConfirmModal, StatusBadge, useToast,
  EmptyState,
} from '@/components/ui';
import { api, firstError } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import {
  Search, QrCode, Plus, Trash2, ArrowLeft, CheckCircle,
} from 'lucide-react';

// QR scanner dimuat lazily
const QrScanner = dynamic(() => import('@/components/QrScanner'), {
  ssr: false,
  loading: () => null,
});

// ── Types ─────────────────────────────────────────────────────────────────

interface Member {
  id: number;
  name: string;
  member_code: string;
  avatar: string | null;
  points_balance: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  points_per_kg: number;
}

interface DepositLine {
  waste_category_id: number;
  weight_kg: string;
}

interface DepositResult {
  id: number;
  total_weight_kg: number;
  total_points: number;
  member: { id: number; name: string; member_code: string } | null;
  items: Array<{
    waste_category: { id: number; name: string };
    weight_kg: number;
    points: number;
  }>;
}

// ── Page ──────────────────────────────────────────────────────────────────

type Step = 'lookup' | 'form' | 'success';

export default function NewDepositPage() {
  const { toast }       = useToast();

  const [step, setStep] = useState<Step>('lookup');

  // Step 1 — lookup
  const [query, setQuery]           = useState('');
  const [searching, setSearching]   = useState(false);
  const [lookupError, setLookupError] = useState('');
  // Member yang ditemukan (bisa via kode atau token)
  const [member, setMember]         = useState<Member | null>(null);
  // Simpan token yang dipakai untuk lookup, agar bisa dikirim saat submit
  const [resolvedToken, setResolvedToken] = useState<string | null>(null);
  const [showQr, setShowQr]         = useState(false);

  // Step 2 — form
  const [categories, setCategories] = useState<Category[]>([]);
  const [lines, setLines]           = useState<DepositLine[]>([
    { waste_category_id: 0, weight_kg: '' },
  ]);
  const [notes, setNotes]           = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 3 — success
  const [result, setResult]         = useState<DepositResult | null>(null);
  const [newBalance, setNewBalance] = useState(0);

  // Muat kategori yang diterima bank ini
  useEffect(() => {
    api.get<{ data: Category[] }>('/waste-bank/profile')
      .then((res) => {
        // accepted_categories ada di dalam data
        const prof = res as unknown as { data: { accepted_categories: Category[] } };
        setCategories(prof.data.accepted_categories ?? []);
      })
      .catch(() => {/* gagal muat kategori — user akan dapat empty select */});
  }, []);

  // ── Member lookup ─────────────────────────────────────────────────────

  const doLookup = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setSearching(true);
    setLookupError('');
    setMember(null);
    setResolvedToken(null);
    try {
      const { data } = await api.get<{ data: Member }>(
        `/waste-bank/members/lookup?code=${encodeURIComponent(code.trim())}`
      );
      setMember(data);
      // Simpan token jika bukan member_code (bukan diawali GG-)
      const upper = code.trim().toUpperCase();
      if (!upper.startsWith('GG-')) {
        setResolvedToken(code.trim());
      }
    } catch (err) {
      setLookupError(firstError(err));
    } finally {
      setSearching(false);
    }
  }, []);

  // ── Points preview ────────────────────────────────────────────────────

  const totalPoints = lines.reduce((sum, line) => {
    const cat = categories.find((c) => c.id === line.waste_category_id);
    if (!cat || !line.weight_kg) return sum;
    return sum + Math.round(parseFloat(line.weight_kg) * cat.points_per_kg);
  }, 0);

  const totalKg = lines.reduce((sum, line) => {
    return sum + (parseFloat(line.weight_kg) || 0);
  }, 0);

  // ── Submit deposit ────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!member) return;
    setSubmitting(true);
    try {
      const res = await api.post<{
        data: DepositResult;
        member_balance: number;
        message: string;
      }>('/waste-bank/deposits', {
        // Kirim token jika tersedia, fallback ke member_code
        ...(resolvedToken
          ? { member_token: resolvedToken }
          : { member_code: member.member_code }),
        notes:       notes || undefined,
        items: lines
          .filter((l) => l.waste_category_id > 0 && parseFloat(l.weight_kg) > 0)
          .map((l) => ({
            waste_category_id: l.waste_category_id,
            weight_kg:         parseFloat(l.weight_kg),
          })),
      });
      setResult(res.data);
      setNewBalance(res.member_balance);
      setStep('success');
      setShowConfirm(false);
    } catch (err) {
      toast(firstError(err), 'error');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Reset for new deposit ─────────────────────────────────────────────

  function resetAll() {
    setStep('lookup');
    setQuery('');
    setMember(null);
    setResolvedToken(null);
    setLookupError('');
    setLines([{ waste_category_id: 0, weight_kg: '' }]);
    setNotes('');
    setResult(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Input Setoran"
        description="Catat setoran sampah dari anggota"
        action={
          step !== 'success' ? (
            <Link
              href="/waste-bank/deposits"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
            >
              <ArrowLeft size={14} />
              Rekapan
            </Link>
          ) : undefined
        }
      />

      {/* ── STEP 1: Lookup ── */}
      {step === 'lookup' && (
        <Card>
          <p className="mb-4 text-sm text-muted">
            Masukkan kode member atau scan QR Card.
          </p>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLookup(query)}
              placeholder="GG-XXXXXX atau scan QR"
              wrapClass="flex-1"
              aria-label="Kode member atau token QR"
            />
            <Button
              variant="secondary" size="sm" icon={Search}
              onClick={() => doLookup(query)}
              loading={searching}
            >
              Cari
            </Button>
            <Button
              variant="ghost" size="sm" icon={QrCode}
              onClick={() => setShowQr(true)}
              aria-label="Scan QR Code"
            />
          </div>

          {lookupError && (
            <p className="mt-2 text-sm text-danger" role="alert">{lookupError}</p>
          )}

          {member && (
            <div className="mt-4 rounded-xl border border-mint bg-mist p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center
                              rounded-full bg-leaf text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{member.name}</p>
                  <p className="text-xs font-mono text-muted">{member.member_code}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Saldo saat ini:{' '}
                    <span className="font-semibold text-forest">
                      {member.points_balance.toLocaleString('id-ID')} poin
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setStep('form')}
                >
                  Lanjut
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── STEP 2: Form ── */}
      {step === 'form' && member && (
        <>
          {/* Member card */}
          <Card padded={false}>
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-bold text-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{member.name}</p>
                <p className="text-xs font-mono text-muted">{member.member_code}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep('lookup')}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                Ganti
              </button>
            </div>
          </Card>

          {/* Item lines */}
          <Card>
            <h2 className="mb-4 font-serif text-base font-semibold text-ink">Item Setoran</h2>

            {categories.length === 0 ? (
              <EmptyState
                title="Belum ada kategori"
                description="Tambahkan kategori yang diterima di halaman Profil terlebih dahulu."
              />
            ) : (
              <div className="space-y-3">
                {lines.map((line, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <Select
                      label={i === 0 ? 'Kategori' : undefined}
                      value={line.waste_category_id || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setLines((prev) =>
                          prev.map((l, idx) => idx === i ? { ...l, waste_category_id: val } : l)
                        );
                      }}
                      wrapClass="flex-1"
                      aria-label={`Kategori item ${i + 1}`}
                    >
                      <option value="">Pilih kategori…</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </Select>

                    <Input
                      label={i === 0 ? 'Berat (kg)' : undefined}
                      type="number" step="0.01" min="0.01"
                      value={line.weight_kg}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, idx) => idx === i ? { ...l, weight_kg: e.target.value } : l)
                        )
                      }
                      placeholder="0.00"
                      wrapClass="w-28 shrink-0"
                      aria-label={`Berat item ${i + 1}`}
                    />

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center
                                   rounded-lg text-muted hover:bg-danger-soft hover:text-danger transition-colors"
                        aria-label={`Hapus item ${i + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <Button
                  variant="ghost" size="sm" icon={Plus}
                  onClick={() => setLines((prev) => [...prev, { waste_category_id: 0, weight_kg: '' }])}
                  className="mt-1"
                >
                  Tambah item
                </Button>
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <Input
              label="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan tentang setoran ini"
            />
          </Card>

          {/* Preview poin */}
          <div className="rounded-xl border border-mint bg-mist px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">Total berat</p>
                <p className="font-serif text-xl font-semibold text-ink">
                  {totalKg.toFixed(2)} kg
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Estimasi poin</p>
                <p className="font-serif text-2xl font-semibold text-forest">
                  +{totalPoints.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary" size="sm"
              onClick={() => setStep('lookup')}
              className="flex-1"
            >
              Kembali
            </Button>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={
                lines.every((l) => !l.waste_category_id || !parseFloat(l.weight_kg))
              }
              className="flex-1"
            >
              Simpan Setoran
            </Button>
          </div>
        </>
      )}

      {/* ── STEP 3: Sukses ── */}
      {step === 'success' && result && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle size={48} className="text-leaf" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold text-ink">Setoran Berhasil!</h2>
            <p className="text-sm text-muted">
              Poin telah dikreditkan ke akun {result.member?.name}.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-paper p-4 space-y-2 text-sm">
            <Row label="Total Berat" value={`${Number(result.total_weight_kg).toFixed(2)} kg`} />
            <Row
              label="Poin Diperoleh"
              value={`+${result.total_points.toLocaleString('id-ID')}`}
              valueClass="text-forest font-semibold"
            />
            <Row
              label="Saldo Baru"
              value={`${newBalance.toLocaleString('id-ID')} poin`}
            />
          </div>

          {/* Rincian per item */}
          {result.items.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-muted">Rincian Item:</p>
              {result.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-muted">
                  <span>{item.waste_category.name}</span>
                  <span>{Number(item.weight_kg).toFixed(2)} kg → +{item.points} poin</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary" size="sm"
              onClick={resetAll}
              className="flex-1"
            >
              + Setoran Baru
            </Button>
            <Link
              href="/waste-bank/deposits"
              className="flex-1 flex items-center justify-center rounded-lg border border-line
                         bg-white px-4 h-8 text-xs font-medium text-muted hover:bg-paper transition-colors"
            >
              Lihat Rekapan
            </Link>
          </div>
        </Card>
      )}

      {/* Modal konfirmasi submit */}
      <ConfirmModal
        open={showConfirm}
        title="Konfirmasi Setoran"
        confirmLabel="Simpan"
        confirmVariant="primary"
        loading={submitting}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      >
        <div className="space-y-1 text-sm">
          <Row label="Member"     value={member?.name ?? ''} />
          <Row label="Total Berat" value={`${totalKg.toFixed(2)} kg`} />
          <Row
            label="Estimasi Poin"
            value={`+${totalPoints.toLocaleString('id-ID')}`}
            valueClass="text-forest font-semibold"
          />
        </div>
      </ConfirmModal>

      {/* QR Scanner */}
      {showQr && (
        <QrScanner
          onResult={(code) => {
            setQuery(code.toUpperCase());
            setShowQr(false);
            doLookup(code);
          }}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function Row({
  label, value, valueClass = '',
}: {
  label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className={`font-medium text-ink ${valueClass}`}>{value}</span>
    </div>
  );
}
