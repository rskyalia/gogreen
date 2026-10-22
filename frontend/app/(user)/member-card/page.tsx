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
 * - Polling saldo tiap 5 detik; jika naik → tampilkan layar sukses setoran
 *   (nama bank sampah, kg, poin) dari notifikasi terbaru
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Card, Button, useToast } from '@/components/ui';
import { api, firstError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  RefreshCw, Copy, Check, CreditCard, Clock,
  CheckCircle, ArrowLeft,
} from 'lucide-react';

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
  expires_at: string;
}

interface DepositSuccess {
  waste_bank_name: string;
  total_kg: number;
  total_points: number;
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
      aria-label={
        isExpired
          ? 'Token kedaluwarsa'
          : `Token berlaku ${mins}:${String(secs).padStart(2, '0')}`
      }
    >
      <Clock size={12} aria-hidden="true" />
      {isExpired
        ? 'Kedaluwarsa'
        : `${mins}:${String(secs).padStart(2, '0')}`}
    </div>
  );
}

// ── Layar sukses setoran ──────────────────────────────────────────────────

function DepositSuccessScreen({
  info,
  onBack,
}: {
  info: DepositSuccess;
  onBack: () => void;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <Card>
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <CheckCircle size={52} className="text-leaf" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-2xl font-semibold text-forest">
              Setoran Berhasil!
            </h2>
            <p className="mt-1 text-sm text-muted">
              Poin telah dikreditkan ke akunmu.
            </p>
          </div>

          <div className="w-full rounded-xl border border-mint bg-mist p-4 text-left space-y-2">
            <Row label="Bank Sampah" value={info.waste_bank_name} />
            <Row
              label="Total Berat"
              value={`${Number(info.total_kg).toFixed(2)} kg`}
            />
            <Row
              label="Poin Diperoleh"
              value={`+${info.total_points.toLocaleString('id-ID')}`}
              valueClass="font-semibold text-forest"
            />
          </div>

          <div className="flex w-full gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={onBack}
              className="flex-1"
            >
              Kembali
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = 'text-ink',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

const BALANCE_POLL_MS = 5_000;

export default function MemberCardPage() {
  const { user }  = useAuth();
  const { toast } = useToast();

  const [card, setCard]       = useState<MemberCard | null>(null);
  const [token, setToken]     = useState<MemberToken | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [copied, setCopied]           = useState(false);

  // Layar sukses setoran
  const [depositSuccess, setDepositSuccess] = useState<DepositSuccess | null>(null);
  const prevBalanceRef = useRef<number | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch data kartu member ──────────────────────────────────────────

  useEffect(() => {
    api.get<{ data: MemberCard }>('/user/member-card')
      .then((res) => {
        setCard(res.data);
        prevBalanceRef.current = res.data.points_balance;
      })
      .catch((err) => toast(firstError(err), 'error'))
      .finally(() => setLoadingCard(false));
  }, [toast]);

  // ── Generate / refresh token ─────────────────────────────────────────

  const generateToken = useCallback(async () => {
    setRefreshing(true);

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    try {
      const res = await api.post<{ data: MemberToken }>('/user/member-token', {});
      const newToken = res.data;
      setToken(newToken);

      const msToExpiry  = new Date(newToken.expires_at).getTime() - Date.now();
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

  useEffect(() => {
    generateToken();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling saldo tiap 5 detik ───────────────────────────────────────

  useEffect(() => {
    if (loadingCard) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const [cardRes, notifRes] = await Promise.all([
          api.get<{ data: MemberCard }>('/user/member-card'),
          api.get<{ data: Array<{ data: { waste_bank_name: string; total_kg: number; total_points: number }; read_at: string | null }> }>('/user/notifications?per_page=1'),
        ]);

        const newBalance = cardRes.data.points_balance;
        setCard(cardRes.data);

        // Saldo naik → tampilkan layar sukses dari notifikasi terbaru
        if (
          prevBalanceRef.current !== null &&
          newBalance > prevBalanceRef.current
        ) {
          const latestNotif = notifRes.data[0];
          if (latestNotif) {
            setDepositSuccess({
              waste_bank_name: latestNotif.data.waste_bank_name,
              total_kg:        latestNotif.data.total_kg,
              total_points:    latestNotif.data.total_points,
            });
          }
        }

        prevBalanceRef.current = newBalance;
      } catch {
        // abaikan error poll
      }
    }, BALANCE_POLL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadingCard]);

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

  // ── Tampilkan layar sukses setoran ────────────────────────────────────

  if (depositSuccess) {
    return (
      <DepositSuccessScreen
        info={depositSuccess}
        onBack={() => setDepositSuccess(null)}
      />
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────

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

  // ── Render kartu ──────────────────────────────────────────────────────

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

      <Card>
        <div className="flex flex-col items-center gap-5 py-4">
          {/* Avatar + nama + saldo */}
          <div className="text-center">
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
