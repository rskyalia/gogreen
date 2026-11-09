'use client';

/**
 * /waste-bank/deposits/scan
 * 
 * Halaman untuk scan QR draft deposit dari user
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Minus,
  Plus,
  QrCode,
  Trash2,
  User,
} from 'lucide-react';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

// QrScanner hanya diload di client
const QrScanner = dynamic(() => import('@/components/QrScanner'), {
  ssr: false,
  loading: () => null,
});

// ── Types ─────────────────────────────────────────────────────────────────

interface DraftDetail {
  draft_id: number;
  user: {
    id: number;
    name: string;
    member_code: string;
  };
  waste_bank_name: string;
  notes: string | null;
  items: Array<{
    id: number;
    waste_category_id: number;
    waste_category_name: string;
    weight_kg: number;
    points_per_kg: number;
  }>;
  expires_at: string;
}

interface DepositItem {
  waste_category_id: number;
  weight_kg: string;
}

const QR_PREFIX = 'gogreen://deposit/';

export default function ScanDraftPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [showScanner, setShowScanner] = useState(false);
  const [draft, setDraft] = useState<DraftDetail | null>(null);
  const [items, setItems] = useState<DepositItem[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  function handleQrResult(raw: string) {
    if (scanning) return; // Prevent double scan
    
    setScanning(true);
    setShowScanner(false);
    
    const token = raw.startsWith(QR_PREFIX) ? raw.slice(QR_PREFIX.length) : raw;
    
    if (token.length !== 32) {
      setError('QR code tidak valid. Pastikan ini QR setoran dari user.');
      setScanning(false);
      return;
    }

    fetchDraft(token);
  }

  const fetchDraft = useCallback(async (token: string) => {
    setError('');
    try {
      const res = await api.get<{ data: DraftDetail }>(`/waste-bank/deposits/scan?token=${token}`);
      setDraft(res.data);
      
      // Initialize items dari draft
      setItems(res.data.items.map(item => ({
        waste_category_id: item.waste_category_id,
        weight_kg: String(item.weight_kg),
      })));
      
      setNotes(res.data.notes || '');
    } catch (err: unknown) {
      const anyErr = err as { code?: string; message?: string; errors?: Record<string, string[]>; status?: number };
      const code = anyErr?.code ?? 'unknown';
      const errorMessages: Record<string, string> = {
        'wrong_waste_bank': 'QR code ini untuk bank sampah lain. Setoran harus dilakukan di bank sampah yang dipilih user.',
        'token_expired': 'QR code sudah kedaluwarsa.',
        'draft_already_processed': 'Setoran ini sudah diproses.',
        'token_invalid': 'QR code tidak valid.',
      };
      const message = errorMessages[code] ?? firstError(err);
      
      setError(message);
    } finally {
      setScanning(false);
    }
  }, []);

  function handleWeightChange(idx: number, val: string) {
    setItems(prev => prev.map((item, i) => 
      i === idx ? { ...item, weight_kg: val } : item
    ));
  }

  function handleRemoveItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!draft || items.length === 0) return;

    const validItems = items.filter(item => parseFloat(item.weight_kg) >= 0.01);
    
    if (validItems.length === 0) {
      toast('Tambahkan minimal satu item dengan berat >= 0.01 kg', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/waste-bank/deposits/approve', {
        draft_id: draft.draft_id,
        items: validItems.map(item => ({
          waste_category_id: item.waste_category_id,
          weight_kg: parseFloat(item.weight_kg),
        })),
        notes: notes.trim() || null,
      });

      toast('Setoran berhasil disetujui!', 'success');
      router.push('/waste-bank/deposits');
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setDraft(null);
    setItems([]);
    setNotes('');
    setError('');
    setScanning(false);
  }

  function handleScanError(err: unknown) {
    const anyErr = err as { name?: string };
    console.error('Scanner error:', err);
    setShowScanner(false);
    setScanning(false);

    if (anyErr?.name === 'NotAllowedError') {
      setError('Akses kamera ditolak. Mohon izinkan akses kamera di browser Anda.');
    } else if (anyErr?.name === 'NotFoundError') {
      setError('Kamera tidak ditemukan. Pastikan device memiliki kamera.');
    }
  }

  const totalPoints: number = draft ? items.reduce((sum, item) => {
    const draftItem = draft.items.find(i => i.waste_category_id === item.waste_category_id);
    if (!draftItem) return sum;
    const weight = parseFloat(item.weight_kg) || 0;
    return sum + Math.round(weight * draftItem.points_per_kg);
  }, 0) : 0;

  const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight_kg) || 0), 0);

  // Render scan view
  if (!draft) {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg p-2 transition-colors hover:bg-mist"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
              Scan QR Setoran
            </h1>
            <p className="mt-2 text-sm text-muted">
              Scan QR code dari member untuk memproses setoran
            </p>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
            <div className="flex-1">
              <p className="text-sm text-danger">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-forest/30 bg-mist/40 py-16">
          <QrCode className="size-16 text-leaf" />
          <div className="text-center">
            <p className="font-semibold text-ink">Scan QR Code Setoran</p>
            <p className="mt-1 text-sm text-muted">Minta member menunjukkan QR code setoran</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError('');
              setShowScanner(true);
            }}
            disabled={scanning}
            className="flex items-center gap-2 rounded-xl bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-50"
          >
            <Camera className="size-4" />
            {scanning ? 'Memproses...' : 'Buka Kamera'}
          </button>
          <p className="text-xs text-muted">Membutuhkan HTTPS atau localhost untuk akses kamera</p>
        </div>

        {showScanner && (
          <QrScanner
            onResult={handleQrResult}
            onClose={() => {
              setShowScanner(false);
              setScanning(false);
            }}
            onError={handleScanError}
          />
        )}
      </div>
    );
  }

  // Render preview & approve view
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg p-2 transition-colors hover:bg-mist"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
            Verifikasi Setoran
          </h1>
          <p className="mt-2 text-sm text-muted">
            Review dan setujui setoran dari member
          </p>
        </div>
      </header>

      {/* Member info */}
      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-forest text-white">
            <User className="size-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{draft.user.name}</p>
            <p className="text-xs text-muted font-mono">{draft.user.member_code}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Daftar Sampah</h3>
        {items.map((item, idx) => {
          const draftItem = draft.items.find(i => i.waste_category_id === item.waste_category_id);
          if (!draftItem) return null;

          const weight = parseFloat(item.weight_kg) || 0;
          const points = Math.round(weight * draftItem.points_per_kg);

          return (
            <div key={idx} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{draftItem.waste_category_name}</p>
                  <p className="text-xs text-muted">{draftItem.points_per_kg} poin/kg</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="text-muted hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-line">
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = Math.max(0, weight - 0.5);
                      handleWeightChange(idx, newVal > 0 ? String(newVal) : '');
                    }}
                    className="grid size-9 place-items-center text-muted hover:text-forest"
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    type="number"
                    value={item.weight_kg}
                    onChange={(e) => handleWeightChange(idx, e.target.value)}
                    className="w-16 bg-transparent py-2 text-center text-sm font-semibold text-ink outline-none"
                    min="0.01"
                    step="0.1"
                  />
                  <span className="pr-2 text-xs text-muted">kg</span>
                  <button
                    type="button"
                    onClick={() => handleWeightChange(idx, String(weight + 0.5))}
                    className="grid size-9 place-items-center text-muted hover:text-forest"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                {points > 0 && (
                  <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">
                    +{points.toLocaleString('id-ID')} poin
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-ink">
          Catatan <span className="font-normal text-muted">(opsional)</span>
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tambahkan catatan jika diperlukan..."
          className="field-base resize-none"
          maxLength={500}
        />
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="rounded-2xl bg-mint p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Total berat</span>
            <span className="font-semibold text-ink">{totalWeight.toFixed(2)} kg</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted">Total poin</span>
            <span className="font-semibold text-forest">
              +{totalPoints.toLocaleString('id-ID')} poin
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-mist"
        >
          <ArrowLeft className="size-4" />
          Scan Ulang
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || items.length === 0}
          className="flex-1 rounded-xl bg-forest py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-50"
        >
          {submitting ? 'Memproses...' : 'Setujui Setoran'}
        </button>
      </div>
    </div>
  );
}
