'use client';

/**
 * /member-card
 * Kartu identitas member dengan QR code token sekali pakai.
 *
 * Fitur:
 * - QR besar berisi token 32-karakter (bukan member_code)
 * - member_code ditampilkan di bawah QR dengan tombol salin
 * - Hitung mundur masa berlaku token (5 menit)
 * - Token diperbarui otomatis 30 detik sebelum habis
 * - Tombol refresh manual
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, Button, useToast } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, Copy, Check, CreditCard, Clock } from 'lucide-react';

// QRCodeSVG diimpor secara lazy agar tidak masuk SSR bundle
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })),
  { ssr: false, loading: () => <QrPlaceholder /> },
);

// ── Types ─────────────────────────────────────────────────────────────────

interface MemberCard {
  id: number;
  name: string;
  avatar: string | null;
  member_code: string;
  points_balance: number;
}

interface MemberToken {
  token: string;
  expires_at: string; // ISO 8601
}

// ── Sub-components ────────────────────────────────────────────────────────

function QrPlaceholder() {
  return (
    <div
      className="h-52 w-52 animate-pulse rounded-xl bg-stone-100"
      aria-hidden="true"
    />
  );
}

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isExpiring = seconds <= 30;
  const isExpired  = seconds === 0;

  return (
    <div
      className={[
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        isExpired
          ? 'bg-danger-soft text-danger'
          : isExpiring
            ? 'bg-amber-50 text-amber-600'
            : 'bg-mist text-forest',
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-label={isExpired ? 'Token kedaluwarsa' : `Token berlaku ${mins}:${String(secs).padStart(2, '0')}`}
    >
      <Clock size={12} aria-hidden="true" />
      {isExpired
        ? 'Kedaluwarsa'
        : `${mins}:${String(secs).padStart(2, '0')}`}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function MemberCardPage() {
  const { user }  = useAuth();
  const { toast } = useToast();

  const [card, setCard]       = useState<MemberCard | null>(null);
  const [token, setToken]     = useState<MemberToken | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [copied, setCopied]           = useState(false);

  // Ref untuk auto-refresh timer
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch data kartu member ──────────────────────────────────────────

  useEffect(() => {
    api.get<{ data: MemberCard }>('/user/member-card')
      .then((res) => setCard(res.data))
      .catch((err) => toast(firstError(err), 'error'))
      .finally(() => setLoadingCard(false));
  }, [toast]);

  // ── Generate / refresh token ─────────────────────────────────────────

  const generateToken = useCallback(async () => {
    setRefreshing(true);

    // Batalkan timer refresh lama jika ada
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    try {
      const res = await api.post<{ data: MemberToken }>('/user/member-token', {});
      const newToken = res.data;
      setToken(newToken);

      // Auto-refresh 30 detik sebelum kedaluwarsa
      const msToExpiry = new Date(newToken.expires_at).getTime() - Date.now();
      const refreshAfter = Math.max(0, msToExpiry - 30_000);

      refreshTimerRef.current = setTimeout(() => {
        generateToken();
      }, refreshAfter);
    } catch (err) {
      toast(firstError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  // Buat token saat halaman pertama dimuat
  useEffect(() => {
    generateToken();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Salin member_code ─────────────────────────────────────────────────

  async function handleCopy() {
    if (!card?.member_code) return;
    try {
      await navigator.clipboard.writeText(card.member_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Gagal menyalin kode.', 'error');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (loadingCard) {
    return (
      <div className="mx-auto max-w-sm space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-stone-100" />
        <Card>
          <div className="flex flex-col items-center gap-5 py-6">
            <QrPlaceholder />
            <div className="h-5 w-32 animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-48 animate-pulse rounded bg-stone-100" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={20} className="text-forest" aria-hidden="true" />
          <h1 className="font-serif text-xl font-semibold text-ink">Kartu Member</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={RefreshCw}
          onClick={generateToken}
          loading={refreshing}
          aria-label="Refresh QR Code"
        >
          Refresh
        </Button>
      </div>

      {/* Card utama */}
      <Card>
        <div className="flex flex-col items-center gap-5 py-4">
          {/* Nama & saldo */}
          <div className="text-center">
            {/* Avatar */}
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center
                         rounded-full bg-forest text-xl font-bold text-white"
              aria-hidden="true"
            >
              {(card?.name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
            </div>
            <p className="text-base font-semibold text-ink">{card?.name ?? user?.name}</p>
            <p className="mt-0.5 text-sm text-muted">
              {card?.points_balance.toLocaleString('id-ID') ?? '—'} poin
            </p>
          </div>

          {/* QR Code */}
          <div
            className="rounded-2xl border-2 border-line p-3"
            aria-label="QR Code token kartu member"
          >
            {token ? (
              <QRCodeSVG
                value={token.token}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#1a2a1e"
              />
            ) : (
              <QrPlaceholder />
            )}
          </div>

          {/* Countdown */}
          {token && <CountdownBadge expiresAt={token.expires_at} />}

          {/* Member code + tombol salin */}
          <div className="flex w-full items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5">
            <p className="flex-1 text-center font-mono text-base font-semibold tracking-widest text-ink">
              {card?.member_code ?? '—'}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="text-muted hover:text-forest transition-colors"
              aria-label="Salin kode member"
            >
              {copied
                ? <Check size={16} className="text-leaf" aria-hidden="true" />
                : <Copy size={16} aria-hidden="true" />}
            </button>
          </div>

          <p className="text-center text-xs text-muted">
            Tunjukkan QR ini ke petugas bank sampah saat menyetor.
            <br />
            QR berlaku 5 menit dan hanya bisa dipakai sekali.
          </p>
        </div>
      </Card>
    </div>
  );
}
