'use client';

/**
 * /member-card  — Kartu member digital dengan QR token sekali pakai.
 *
 * Siklus:
 *   active  → QR tampil + progress bar + hitung mundur + polling status tiap 3 detik
 *   claimed → "Dipindai oleh {bank}, menunggu petugas…" + terus polling
 *   used    → layar sukses (nama bank, kg, poin, saldo baru) + tombol ke dashboard
 *   expired → pesan + tombol "Buat QR baru"
 *
 * Fitur:
 *   - Tombol Maximize → modal QR layar penuh dengan petunjuk naikkan kecerahan
 *   - Auto-refresh token 30 detik sebelum kedaluwarsa
 *   - Polling berhenti saat tab tidak aktif; dilanjutkan + token baru saat aktif kembali
 *   - token_in_process (409) → tampilkan claimed tanpa menghancurkan token yang ada
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle2,
    Clock,
    Coins,
    Copy,
    Maximize,
    QrCode,
    RefreshCw,
    ScanLine,
    Sun,
    X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui';
import type { ApiError } from '@/lib/api';

// QRCodeSVG hanya jalan di client
const QRCodeSVG = dynamic(
    () => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })),
    { ssr: false, loading: () => <QrPlaceholder /> },
);

// ── Konstanta ─────────────────────────────────────────────────────────────

const TOKEN_POLL_MS      = 3_000;   // polling status setiap 3 detik
const TOKEN_TTL_SEC      = 5 * 60;  // TTL aktif 5 menit (untuk progress bar)
const REFRESH_BEFORE_SEC = 30;      // buat token baru 30 detik sebelum expired

// ── Types ─────────────────────────────────────────────────────────────────

interface MemberCard {
    id: number;
    name: string;
    avatar: string | null;
    member_code: string;
    points_balance: number;
}

interface TokenData {
    token: string;
    payload: string;   // gogreen://member/{token}
    expires_at: string;
}

type TokenStatus = 'active' | 'claimed' | 'used' | 'expired';

interface StatusResponse {
    status: TokenStatus;
    expires_at?: string;
    waste_bank_name?: string;
    deposit?: {
        id: number;
        waste_bank_name: string;
        total_weight_kg: number;
        total_points: number;
        balance_after: number;
    };
}

// ── Subcomponents ─────────────────────────────────────────────────────────

function QrPlaceholder() {
    return (
        <div
            className="size-60 animate-pulse rounded-2xl bg-mist"
            aria-hidden
        />
    );
}

/** Progress bar + hitung mundur. Menampilkan sisa waktu dan proporsi yang tersisa. */
function CountdownBar({ expiresAt, isExpiring }: { expiresAt: string; isExpiring: boolean }) {
    const totalMs = TOKEN_TTL_SEC * 1000;

    const calcSecs = () =>
        Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));

    const [secs, setSecs] = useState(calcSecs);

    useEffect(() => {
        setSecs(calcSecs());
        const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expiresAt]);

    const m       = Math.floor(secs / 60);
    const s       = secs % 60;
    const expired = secs === 0;
    // pct = remaining fraction (0–1)
    const pct = Math.min(1, Math.max(0,
        (new Date(expiresAt).getTime() - Date.now()) / totalMs,
    ));

    const barColor = expired
        ? 'bg-danger'
        : isExpiring
          ? 'bg-sun-ink'
          : 'bg-forest';

    const timeLabel = expired
        ? 'Token kedaluwarsa'
        : `Token berlaku ${m}:${String(s).padStart(2, '0')}`;

    return (
        <div className="w-full space-y-1.5">
            {/* Bar */}
            <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-mist"
                role="progressbar"
                aria-valuenow={secs}
                aria-valuemin={0}
                aria-valuemax={TOKEN_TTL_SEC}
                aria-label={timeLabel}
            >
                <div
                    className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${barColor}`}
                    style={{ width: `${pct * 100}%` }}
                />
            </div>

            {/* Label waktu */}
            <div
                role="status"
                aria-live="polite"
                className={[
                    'flex items-center justify-center gap-1.5 text-xs font-semibold',
                    expired ? 'text-danger' : isExpiring ? 'text-sun-ink' : 'text-muted',
                ].join(' ')}
            >
                <Clock className="size-3" aria-hidden />
                <span>
                    {expired ? 'Kedaluwarsa' : `${m}:${String(s).padStart(2, '0')}`}
                </span>
            </div>
        </div>
    );
}

/** Tombol salin kode member — ikon berubah ke Check selama 2 detik */
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard mungkin diblokir di browser lama
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Kode berhasil disalin' : 'Salin kode member'}
            className="min-h-[40px] min-w-[40px] rounded-lg p-1.5 text-muted
                       transition-colors hover:text-forest
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
        >
            {copied
                ? <Check className="size-4 text-leaf" aria-hidden />
                : <Copy className="size-4" aria-hidden />
            }
        </button>
    );
}

/** Modal QR layar penuh — latar putih, petunjuk kecerahan */
function FullscreenQrModal({
    payload,
    onClose,
}: {
    payload: string;
    onClose: () => void;
}) {
    // Tutup dengan Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white p-8"
            role="dialog"
            aria-modal="true"
            aria-label="QR Code layar penuh"
        >
            {/* Tombol tutup */}
            <button
                type="button"
                onClick={onClose}
                aria-label="Tutup layar penuh"
                className="absolute right-4 top-4 min-h-[40px] min-w-[40px]
                           rounded-full p-2 text-ink/60 transition-colors
                           hover:bg-mist hover:text-ink
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
            >
                <X className="size-5" aria-hidden />
            </button>

            {/* QR Code besar */}
            <QRCodeSVG
                value={payload}
                size={288}
                level="M"
                bgColor="#ffffff"
                fgColor="#0b4d36"
            />

            {/* Petunjuk kecerahan */}
            <div
                className="flex items-center gap-2.5 rounded-2xl bg-sun px-5 py-3 text-sm text-sun-ink"
                aria-live="polite"
            >
                <Sun className="size-5 shrink-0" aria-hidden />
                <span>Naikkan kecerahan layar agar lebih mudah dipindai.</span>
            </div>
        </div>
    );
}

// ── Layar claimed ─────────────────────────────────────────────────────────

function ClaimedCard({ bankName }: { bankName?: string }) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-mist px-6 py-8 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-forest text-mint">
                <ScanLine className="size-7" aria-hidden />
            </span>
            <div>
                <p className="font-semibold text-ink">Kartu sedang dipindai</p>
                {bankName && (
                    <p className="mt-1 text-sm text-muted">
                        oleh <span className="font-semibold text-forest">{bankName}</span>
                    </p>
                )}
                <p className="mt-2 text-xs text-muted">
                    Menunggu petugas menyelesaikan setoran…
                </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
                <span className="size-2 animate-pulse rounded-full bg-leaf" aria-hidden />
                Live
            </div>
        </div>
    );
}

// ── Layar used (sukses) ───────────────────────────────────────────────────

function SuccessCard({
    deposit,
    onReset,
}: {
    deposit: NonNullable<StatusResponse['deposit']>;
    onReset: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-mint px-6 py-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-forest text-mint">
                <CheckCircle2 className="size-8" aria-hidden />
            </span>
            <div>
                <h2 className="font-serif text-2xl font-medium text-forest">Setoran Berhasil!</h2>
                <p className="mt-1 text-sm text-muted">{deposit.waste_bank_name}</p>
            </div>

            <div className="w-full space-y-2 rounded-2xl bg-white/70 px-5 py-4">
                <RowInfo
                    label="Total berat"
                    value={`${Number(deposit.total_weight_kg).toFixed(2)} kg`}
                />
                <RowInfo
                    label="Poin diperoleh"
                    value={`+${deposit.total_points.toLocaleString('id-ID')}`}
                    valueClass="font-semibold text-forest"
                />
                <RowInfo
                    label="Saldo baru"
                    value={`${deposit.balance_after.toLocaleString('id-ID')} poin`}
                />
            </div>

            <div className="flex w-full gap-3">
                <button
                    type="button"
                    onClick={onReset}
                    className="flex-1 rounded-xl border border-forest/30 py-2.5 text-sm
                               font-semibold text-forest transition-colors hover:bg-white/60"
                >
                    Buat QR baru
                </button>
                <Link
                    href="/dashboard"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl
                               bg-forest py-2.5 text-sm font-semibold text-white
                               transition-colors hover:bg-forest-deep"
                >
                    Dashboard
                    <ArrowRight className="size-4" aria-hidden />
                </Link>
            </div>
        </div>
    );
}

// ── Layar expired ─────────────────────────────────────────────────────────

function ExpiredCard({ onReset, loading }: { onReset: () => void; loading: boolean }) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-6 py-8 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
                <AlertTriangle className="size-7" aria-hidden />
            </span>
            <div>
                <p className="font-semibold text-ink">QR Kedaluwarsa</p>
                <p className="mt-1 text-xs text-muted">
                    Token sudah tidak berlaku. Buat yang baru untuk melanjutkan.
                </p>
            </div>
            <button
                type="button"
                onClick={onReset}
                disabled={loading}
                className="flex min-h-[40px] items-center gap-2 rounded-xl bg-forest px-5
                           py-2.5 text-sm font-semibold text-white transition-colors
                           hover:bg-forest-deep disabled:opacity-50"
            >
                <RefreshCw
                    className={['size-4', loading ? 'animate-spin' : ''].join(' ')}
                    aria-hidden
                />
                {loading ? 'Membuat QR…' : 'Buat QR baru'}
            </button>
        </div>
    );
}

function RowInfo({
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

// ── Bagian "Cara pakai" ───────────────────────────────────────────────────

const HOW_TO_STEPS = [
    {
        step: '1',
        title: 'Buka halaman ini',
        desc: 'QR aktif otomatis dan berlaku 5 menit.',
    },
    {
        step: '2',
        title: 'Tunjukkan ke petugas',
        desc: 'Petugas bank sampah akan memindai QR Anda.',
    },
    {
        step: '3',
        title: 'Tunggu konfirmasi',
        desc: 'Poin dikreditkan setelah setoran dikonfirmasi.',
    },
] as const;

function HowToSection() {
    return (
        <section aria-labelledby="how-to-heading" className="rounded-2xl border border-line bg-white p-5">
            <h2 id="how-to-heading" className="mb-4 text-sm font-semibold text-ink">
                Cara pakai
            </h2>
            <ol className="space-y-3">
                {HOW_TO_STEPS.map(({ step, title, desc }) => (
                    <li key={step} className="flex gap-3">
                        <span
                            className="flex size-6 shrink-0 items-center justify-center
                                       rounded-full bg-forest text-xs font-bold text-white"
                            aria-hidden
                        >
                            {step}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-ink">{title}</p>
                            <p className="text-xs text-muted">{desc}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function PageSkeleton() {
    return (
        <div className="mx-auto max-w-sm space-y-5">
            <div className="h-7 w-40 animate-pulse rounded-lg bg-mist" />
            <div className="overflow-hidden rounded-2xl border border-line bg-white p-6">
                <div className="flex flex-col items-center gap-5">
                    <div className="size-14 animate-pulse rounded-full bg-mist" />
                    <div className="h-5 w-32 animate-pulse rounded bg-mist" />
                    <QrPlaceholder />
                    <div className="h-8 w-48 animate-pulse rounded-lg bg-mist" />
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function MemberCardPage() {
    const { user }  = useAuth();
    const { toast } = useToast();

    const [card, setCard]             = useState<MemberCard | null>(null);
    const [tokenData, setTokenData]   = useState<TokenData | null>(null);
    const [tokenStatus, setTokenStatus]   = useState<TokenStatus>('active');
    const [statusExtra, setStatusExtra]   = useState<StatusResponse | null>(null);
    const [generating, setGenerating]     = useState(false);
    const [pageLoading, setPageLoading]   = useState(true);
    const [showFullscreen, setShowFullscreen] = useState(false);

    const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const refreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokenRef   = useRef<TokenData | null>(null);   // always-current for callbacks
    const statusRef  = useRef<TokenStatus>('active');

    // Sync refs
    useEffect(() => { tokenRef.current = tokenData; }, [tokenData]);
    useEffect(() => { statusRef.current = tokenStatus; }, [tokenStatus]);

    // ── Fetch member card ─────────────────────────────────────────────

    useEffect(() => {
        api.get<{ data: MemberCard }>('/user/member-card')
            .then((r) => setCard(r.data))
            .catch((err) => {
                const apiErr = err as ApiError;
                toast(apiErr?.message ?? 'Gagal memuat data kartu.', 'error');
            })
            .finally(() => setPageLoading(false));
    }, [toast]);

    // ── Generate / issue token ────────────────────────────────────────

    const generateToken = useCallback(async () => {
        setGenerating(true);
        stopPoll();
        clearRefreshTimer();

        try {
            const res = await api.post<{ data: TokenData }>('/user/member-token', {});
            const td  = res.data;
            setTokenData(td);
            setTokenStatus('active');
            setStatusExtra(null);
            scheduleRefresh(td);
            startPoll(td.token);
        } catch (err) {
            const apiErr = err as ApiError;
            // token_in_process: token sedang diklaim bank. Tampilkan claimed
            // dan polling dengan token lama yang masih ada.
            if (apiErr?.code === 'token_in_process') {
                setTokenStatus('claimed');
                if (tokenRef.current) {
                    startPoll(tokenRef.current.token);
                }
            } else {
                toast(apiErr?.message ?? 'Gagal membuat token.', 'error');
            }
        } finally {
            setGenerating(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast]);

    // Buat token pertama kali setelah card dimuat
    useEffect(() => {
        if (!pageLoading) generateToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageLoading]);

    // ── Polling status token ──────────────────────────────────────────

    function startPoll(token: string) {
        stopPoll();
        pollRef.current = setInterval(() => pollStatus(token), TOKEN_POLL_MS);
    }

    function stopPoll() {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }

    async function pollStatus(token: string) {
        if (statusRef.current === 'used' || statusRef.current === 'expired') {
            stopPoll();
            return;
        }
        try {
            const res = await api.get<{ data: StatusResponse }>(
                `/user/member-token/status?token=${encodeURIComponent(token)}`,
            );
            const data = res.data;
            setTokenStatus(data.status);
            setStatusExtra(data);

            if (data.status === 'used') {
                stopPoll();
                clearRefreshTimer();
                setShowFullscreen(false);
                // Refresh saldo StatCard
                api.get<{ data: MemberCard }>('/user/member-card')
                    .then((r) => setCard(r.data))
                    .catch(() => {});
            }
            if (data.status === 'expired') {
                stopPoll();
                clearRefreshTimer();
                setShowFullscreen(false);
            }
        } catch {
            // abaikan error poll sementara
        }
    }

    // ── Auto-refresh timer ────────────────────────────────────────────

    function scheduleRefresh(td: TokenData) {
        clearRefreshTimer();
        const msToExpiry   = new Date(td.expires_at).getTime() - Date.now();
        const refreshAfter = Math.max(0, msToExpiry - REFRESH_BEFORE_SEC * 1000);

        refreshRef.current = setTimeout(() => {
            if (statusRef.current === 'active') {
                generateToken();
            }
        }, refreshAfter);
    }

    function clearRefreshTimer() {
        if (refreshRef.current) {
            clearTimeout(refreshRef.current);
            refreshRef.current = null;
        }
    }

    // ── Tab visibility ────────────────────────────────────────────────

    useEffect(() => {
        function onVisibility() {
            if (document.visibilityState === 'hidden') {
                stopPoll();
                clearRefreshTimer();
            } else {
                // Tab aktif kembali → cek status + buat token baru bila perlu
                if (statusRef.current !== 'used') {
                    generateToken();
                }
            }
        }
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cleanup on unmount
    useEffect(() => () => { stopPoll(); clearRefreshTimer(); }, []);

    // ── Reset flow ────────────────────────────────────────────────────

    function handleReset() {
        setStatusExtra(null);
        setShowFullscreen(false);
        generateToken();
    }

    // ── Derived ───────────────────────────────────────────────────────

    if (pageLoading) return <PageSkeleton />;

    const isExpiring = tokenData
        ? new Date(tokenData.expires_at).getTime() - Date.now() <= REFRESH_BEFORE_SEC * 1000
        : false;

    const initials = (card?.name ?? user?.name ?? 'U').charAt(0).toUpperCase();

    return (
        <>
            {/* ── Fullscreen QR modal ────────────────────────────────── */}
            {showFullscreen && tokenData && (
                <FullscreenQrModal
                    payload={tokenData.payload}
                    onClose={() => setShowFullscreen(false)}
                />
            )}

            <div className="mx-auto max-w-sm space-y-5">
                {/* ── Header ───────────────────────────────────────────── */}
                <div className="flex items-center gap-2.5">
                    <QrCode className="size-5 text-forest" aria-hidden />
                    <h1 className="font-serif text-xl font-medium text-forest">Kartu Member</h1>
                </div>

                {/* ── StatCard: saldo poin ──────────────────────────────── */}
                <StatCard
                    icon={Coins}
                    label="Saldo poin saat ini"
                    value={card?.points_balance ?? 0}
                    unit="poin"
                    tone="mint"
                />

                {/* ── Kartu utama ───────────────────────────────────────── */}
                <div className="overflow-hidden rounded-2xl border border-line bg-white">
                    {/* Strip status atas */}
                    <div
                        className={[
                            'h-1.5',
                            tokenStatus === 'used'    ? 'bg-forest'
                            : tokenStatus === 'claimed' ? 'bg-leaf'
                            : tokenStatus === 'expired' ? 'bg-danger'
                            : 'bg-mist',
                        ].join(' ')}
                        aria-hidden
                    />

                    <div className="flex flex-col items-center gap-5 p-6">
                        {/* Avatar + nama */}
                        <div className="w-full text-center">
                            <div
                                className="mx-auto mb-2 grid size-14 place-items-center
                                           rounded-full bg-forest text-xl font-semibold text-white"
                                aria-hidden
                            >
                                {initials}
                            </div>
                            <p className="font-semibold text-ink">
                                {card?.name ?? user?.name}
                            </p>
                        </div>

                        {/* ── Status body ────────────────────────────────── */}

                        {tokenStatus === 'used' && statusExtra?.deposit && (
                            <SuccessCard
                                deposit={statusExtra.deposit}
                                onReset={handleReset}
                            />
                        )}

                        {tokenStatus === 'expired' && (
                            <ExpiredCard onReset={handleReset} loading={generating} />
                        )}

                        {tokenStatus === 'claimed' && (
                            <ClaimedCard bankName={statusExtra?.waste_bank_name} />
                        )}

                        {tokenStatus === 'active' && (
                            <>
                                {/* QR Code 240px + tombol layar penuh */}
                                <div className="relative">
                                    <div
                                        className="rounded-2xl border-2 border-line bg-white p-3"
                                        aria-label="QR Code kartu member"
                                    >
                                        {tokenData ? (
                                            <QRCodeSVG
                                                value={tokenData.payload}
                                                size={240}
                                                level="M"
                                                bgColor="#ffffff"
                                                fgColor="#0b4d36"
                                            />
                                        ) : (
                                            <QrPlaceholder />
                                        )}
                                    </div>

                                    {/* Tombol Maximize — pojok kanan atas */}
                                    {tokenData && (
                                        <button
                                            type="button"
                                            onClick={() => setShowFullscreen(true)}
                                            aria-label="Tampilkan QR layar penuh"
                                            className="absolute -right-2 -top-2 min-h-[40px] min-w-[40px]
                                                       grid place-items-center rounded-full
                                                       border border-line bg-white text-muted shadow-sm
                                                       transition-colors hover:text-forest
                                                       focus-visible:outline-2 focus-visible:outline-offset-2
                                                       focus-visible:outline-leaf"
                                        >
                                            <Maximize className="size-4" aria-hidden />
                                        </button>
                                    )}
                                </div>

                                {/* Progress bar + countdown */}
                                {tokenData && (
                                    <div className="w-full px-1">
                                        <CountdownBar
                                            expiresAt={tokenData.expires_at}
                                            isExpiring={isExpiring}
                                        />
                                    </div>
                                )}

                                {/* Member code + salin */}
                                {card && (
                                    <div className="flex w-full items-center gap-2 rounded-xl
                                                    border border-line bg-paper px-4 py-2">
                                        <span className="flex-1 text-center font-mono text-base
                                                         font-semibold tracking-widest text-ink">
                                            {card.member_code}
                                        </span>
                                        <CopyButton text={card.member_code} />
                                    </div>
                                )}

                                <p className="text-center text-xs leading-relaxed text-muted">
                                    Tunjukkan QR ini ke petugas bank sampah saat menyetor.
                                    <br />
                                    Berlaku <strong>5 menit</strong> dan hanya bisa digunakan sekali.
                                </p>

                                {/* Tombol buat ulang */}
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={generating}
                                    aria-label="Buat QR baru"
                                    className="flex min-h-[40px] items-center gap-2 rounded-xl
                                               border border-forest/30 px-4 py-2 text-xs
                                               font-semibold text-forest transition-colors
                                               hover:bg-mist disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={['size-3.5', generating ? 'animate-spin' : ''].join(' ')}
                                        aria-hidden
                                    />
                                    {generating ? 'Membuat QR…' : 'Buat ulang QR'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Kode manual (cadangan) ────────────────────────────── */}
                {card && (
                    <p className="text-center text-xs text-muted">
                        Cadangan: tunjukkan kode{' '}
                        <span className="font-mono font-semibold text-ink">
                            {card.member_code}
                        </span>{' '}
                        bila kamera petugas tidak tersedia.
                    </p>
                )}

                {/* ── Cara pakai ────────────────────────────────────────── */}
                <HowToSection />
            </div>
        </>
    );
}
