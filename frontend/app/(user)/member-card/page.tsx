'use client';

/**
 * /member-card  — Kartu member digital dengan QR token sekali pakai.
 *
 * Siklus:
 *   active  → QR tampil + hitung mundur + polling status tiap 3 detik
 *   claimed → "Dipindai oleh {bank}, menunggu petugas…" + terus polling
 *   used    → layar sukses (nama bank, kg, poin, saldo baru)
 *   expired → pesan + tombol "Buat QR baru"
 *
 * Auto-refresh token 30 detik sebelum kedaluwarsa.
 * Polling berhenti saat tab tidak aktif; dilanjutkan + token baru saat aktif kembali.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    RefreshCw,
    ScanLine,
} from 'lucide-react';
import { api, firstError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui';

// QRCodeSVG hanya jalan di client
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

interface TokenData {
    token: string;
    payload: string;   // gogreen://member/{token}
    expires_at: string;
}

type TokenStatus = 'active' | 'claimed' | 'used' | 'expired';

interface StatusResponse {
    status: TokenStatus;
    waste_bank_name?: string;
    deposit?: {
        id: number;
        waste_bank_name: string;
        total_weight_kg: number;
        total_points: number;
        balance_after: number;
    };
}

// ── Sub-components ────────────────────────────────────────────────────────

function QrPlaceholder() {
    return <div className="size-52 animate-pulse rounded-2xl bg-mist" aria-hidden />;
}

function CountdownBadge({ expiresAt, isExpiring }: { expiresAt: string; isExpiring: boolean }) {
    const [secs, setSecs] = useState(() =>
        Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)),
    );

    useEffect(() => {
        const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const expired = secs === 0;

    return (
        <span
            role="status"
            aria-live="polite"
            aria-label={expired ? 'Token kedaluwarsa' : `Token berlaku ${m}:${String(s).padStart(2, '0')}`}
            className={[
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                expired
                    ? 'bg-danger-soft text-danger'
                    : isExpiring
                      ? 'bg-sun text-sun-ink'
                      : 'bg-mist text-forest',
            ].join(' ')}
        >
            <Clock className="size-3" aria-hidden />
            {expired ? 'Kedaluwarsa' : `${m}:${String(s).padStart(2, '0')}`}
        </span>
    );
}

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
            aria-label="Salin kode member"
            className="rounded-lg p-1.5 text-muted transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
        >
            <Copy className={['size-4', copied ? 'text-leaf' : ''].join(' ')} aria-hidden />
        </button>
    );
}

// ── Layar status: claimed ─────────────────────────────────────────────────

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
                <p className="mt-2 text-xs text-muted">Menunggu petugas menyelesaikan setoran…</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
                <span className="size-2 animate-pulse rounded-full bg-leaf" aria-hidden />
                Live
            </div>
        </div>
    );
}

// ── Layar status: used (sukses) ───────────────────────────────────────────

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
                <RowInfo label="Total berat" value={`${Number(deposit.total_weight_kg).toFixed(2)} kg`} />
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
                    className="flex-1 rounded-xl border border-forest/30 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-white/60"
                >
                    Buat QR baru
                </button>
                <Link
                    href="/dashboard"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                >
                    Dashboard
                    <ArrowRight className="size-4" aria-hidden />
                </Link>
            </div>
        </div>
    );
}

// ── Layar status: expired ─────────────────────────────────────────────────

function ExpiredCard({ onReset, loading }: { onReset: () => void; loading: boolean }) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-white px-6 py-8 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
                <AlertTriangle className="size-7" aria-hidden />
            </span>
            <div>
                <p className="font-semibold text-ink">QR Kedaluwarsa</p>
                <p className="mt-1 text-xs text-muted">Token sudah tidak berlaku. Buat yang baru untuk melanjutkan.</p>
            </div>
            <button
                type="button"
                onClick={onReset}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-50"
            >
                <RefreshCw className={['size-4', loading ? 'animate-spin' : ''].join(' ')} aria-hidden />
                {loading ? 'Membuat QR…' : 'Buat QR baru'}
            </button>
        </div>
    );
}

function RowInfo({ label, value, valueClass = 'text-ink' }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{label}</span>
            <span className={valueClass}>{value}</span>
        </div>
    );
}

// ── Skeleton loading ──────────────────────────────────────────────────────

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

const TOKEN_POLL_MS      = 3_000;   // polling status setiap 3 detik
const REFRESH_BEFORE_SEC = 30;      // buat token baru 30 detik sebelum expired

export default function MemberCardPage() {
    const { user }  = useAuth();
    const { toast } = useToast();

    const [card, setCard]           = useState<MemberCard | null>(null);
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [tokenStatus, setTokenStatus] = useState<TokenStatus>('active');
    const [statusExtra, setStatusExtra] = useState<StatusResponse | null>(null);
    const [generating, setGenerating]   = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
    const refreshRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokenRef      = useRef<TokenData | null>(null);   // always-current ref for callbacks
    const statusRef     = useRef<TokenStatus>('active');

    // Sync refs
    useEffect(() => { tokenRef.current = tokenData; }, [tokenData]);
    useEffect(() => { statusRef.current = tokenStatus; }, [tokenStatus]);

    // ── Fetch member card ─────────────────────────────────────────────

    useEffect(() => {
        api.get<{ data: MemberCard }>('/user/member-card')
            .then((r) => setCard(r.data))
            .catch((err) => toast(firstError(err), 'error'))
            .finally(() => setPageLoading(false));
    }, [toast]);

    // ── Generate token ────────────────────────────────────────────────

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
            toast(firstError(err), 'error');
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
        // Jangan poll jika sudah terminal
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
                // Refresh saldo kartu
                api.get<{ data: MemberCard }>('/user/member-card')
                    .then((r) => setCard(r.data))
                    .catch(() => {});
            }
            if (data.status === 'expired') {
                stopPoll();
                clearRefreshTimer();
            }
        } catch {
            // abaikan error poll
        }
    }

    // ── Auto-refresh timer ────────────────────────────────────────────

    function scheduleRefresh(td: TokenData) {
        clearRefreshTimer();
        const msToExpiry   = new Date(td.expires_at).getTime() - Date.now();
        const refreshAfter = Math.max(0, msToExpiry - REFRESH_BEFORE_SEC * 1000);

        refreshRef.current = setTimeout(() => {
            // Hanya refresh jika masih di status active (belum dipindai)
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

    // ── Hentikan polling saat tab tidak aktif ─────────────────────────

    useEffect(() => {
        function onVisible() {
            if (document.visibilityState === 'hidden') {
                stopPoll();
                clearRefreshTimer();
            } else {
                // Tab aktif kembali → buat token baru (yang lama mungkin expired)
                if (statusRef.current !== 'used') {
                    generateToken();
                }
            }
        }
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cleanup on unmount
    useEffect(() => () => { stopPoll(); clearRefreshTimer(); }, []);

    // ── Reset flow ────────────────────────────────────────────────────

    function handleReset() {
        setStatusExtra(null);
        generateToken();
    }

    // ── Render ────────────────────────────────────────────────────────

    if (pageLoading) return <PageSkeleton />;

    const isExpiring = tokenData
        ? new Date(tokenData.expires_at).getTime() - Date.now() <= REFRESH_BEFORE_SEC * 1000
        : false;

    return (
        <div className="mx-auto max-w-sm space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <CreditCard className="size-5 text-forest" aria-hidden />
                <h1 className="font-serif text-xl font-medium text-forest">Kartu Member</h1>
            </div>

            {/* Kartu utama */}
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
                {/* Strip atas — warna berubah sesuai status */}
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
                    <div className="text-center">
                        <div
                            className="mx-auto mb-2 grid size-14 place-items-center rounded-full bg-forest text-xl font-semibold text-white"
                            aria-hidden
                        >
                            {(card?.name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-ink">{card?.name ?? user?.name}</p>
                        <p className="text-sm text-muted">
                            {(card?.points_balance ?? 0).toLocaleString('id-ID')} poin
                        </p>
                    </div>

                    {/* Status body */}
                    {tokenStatus === 'used' && statusExtra?.deposit && (
                        <SuccessCard deposit={statusExtra.deposit} onReset={handleReset} />
                    )}

                    {tokenStatus === 'expired' && (
                        <ExpiredCard onReset={handleReset} loading={generating} />
                    )}

                    {tokenStatus === 'claimed' && (
                        <ClaimedCard bankName={statusExtra?.waste_bank_name} />
                    )}

                    {tokenStatus === 'active' && (
                        <>
                            {/* QR Code — value = payload (gogreen://member/{token}) */}
                            <div
                                className="rounded-2xl border-2 border-line p-3"
                                aria-label="QR Code kartu member"
                            >
                                {tokenData ? (
                                    <QRCodeSVG
                                        value={tokenData.payload}
                                        size={200}
                                        level="M"
                                        bgColor="#ffffff"
                                        fgColor="#0b4d36"
                                    />
                                ) : (
                                    <QrPlaceholder />
                                )}
                            </div>

                            {tokenData && (
                                <CountdownBadge
                                    expiresAt={tokenData.expires_at}
                                    isExpiring={isExpiring}
                                />
                            )}

                            {/* Member code + salin */}
                            {card && (
                                <div className="flex w-full items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5">
                                    <span className="flex-1 text-center font-mono text-base font-semibold tracking-widest text-ink">
                                        {card.member_code}
                                    </span>
                                    <CopyButton text={card.member_code} />
                                </div>
                            )}

                            <p className="text-center text-xs leading-relaxed text-muted">
                                Tunjukkan QR ini ke petugas bank sampah saat menyetor.
                                <br />
                                QR berlaku <strong>5 menit</strong> dan hanya bisa digunakan sekali.
                            </p>

                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={generating}
                                aria-label="Buat QR baru"
                                className="flex items-center gap-2 rounded-xl border border-forest/30 px-4 py-2 text-xs font-semibold text-forest transition-colors hover:bg-mist disabled:opacity-50"
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

            {/* Info tambahan */}
            <p className="text-center text-xs text-muted">
                Atau tunjukkan kode manual{' '}
                <span className="font-mono font-semibold text-ink">
                    {card?.member_code ?? '—'}
                </span>{' '}
                jika kamera tidak tersedia.
            </p>
        </div>
    );
}
