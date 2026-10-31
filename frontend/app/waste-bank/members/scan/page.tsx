'use client';

/**
 * /waste-bank/members/scan
 *
 * Halaman pindai kartu member, tiga tahap:
 *   scanning → found → (navigasi ke /waste-bank/deposits/new)
 *
 * - QR Scanner dengan overlay sudut, ganti kamera, dan senter
 * - Input kode manual (cadangan bila kamera gagal)
 * - Kartu konfirmasi member + hitung mundur sisa klaim
 * - Tombol "Lanjut input setoran" → simpan ke depositSession lalu navigasi
 * - Tombol "Pindai ulang" → release token + kembali ke scanning
 * - Semua pesan error dalam Bahasa Indonesia lewat banner AlertTriangle
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    ArrowRight,
    Check,
    Clock,
    Keyboard,
    QrCode,
    RefreshCw,
    RotateCcw,
    ScanLine,
    UserRound,
    X,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import { depositSession } from '@/store/depositSession';
import type { DepositMember } from '@/store/depositSession';

// Kamera hanya di client
const QrScannerCamera = dynamic(() => import('@/components/QrScannerCamera'), {
    ssr: false,
    loading: () => (
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-mist" aria-busy="true" />
    ),
});

// ── Konstanta ─────────────────────────────────────────────────────────────

const QR_PREFIX = 'gogreen://member/';
const TOKEN_RE  = /^[A-Za-z0-9]{32}$/;
type ScanStep   = 'scanning' | 'found';

// ── Peta kode error → pesan Indonesia ────────────────────────────────────

function codeToMessage(code?: string): string {
    const map: Record<string, string> = {
        token_invalid:          'QR tidak valid. Minta member tampilkan QR yang baru.',
        token_expired:          'QR sudah kedaluwarsa. Minta member buat QR baru.',
        token_used:             'QR ini sudah pernah digunakan.',
        token_claimed_by_other: 'QR sedang diproses oleh bank sampah lain. Tunggu sebentar.',
        token_in_process:       'Token QR sedang dalam proses di bank sampah lain.',
        user_not_found:         'Member tidak ditemukan.',
        user_banned:            'Akun member ini telah diblokir dan tidak dapat melakukan setoran.',
        bank_not_verified:      'Akun bank sampah belum diverifikasi. Hubungi administrator.',
        rate_limited:           'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
    };
    return code && map[code]
        ? map[code]
        : 'Terjadi kesalahan. Silakan coba lagi.';
}

// ── Sub-components ────────────────────────────────────────────────────────

/** Banner error dengan tombol tutup */
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div
            className="flex items-start gap-3 rounded-xl border border-danger/30
                       bg-danger-soft px-4 py-3"
            role="alert"
            aria-live="assertive"
        >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            <p className="flex-1 text-sm text-danger">{message}</p>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Tutup pesan error"
                className="min-h-[40px] min-w-[40px] rounded-lg text-danger/60 hover:text-danger"
            >
                <X className="size-4" aria-hidden />
            </button>
        </div>
    );
}

/** Hitung mundur sisa waktu klaim 15 menit */
function ClaimCountdown({ claimedAt }: { claimedAt: number }) {
    const CLAIM_TTL_MS = 15 * 60 * 1000;

    function calcSecs() {
        return Math.max(0, Math.round((claimedAt + CLAIM_TTL_MS - Date.now()) / 1000));
    }

    const [secs, setSecs] = useState(calcSecs);

    useEffect(() => {
        setSecs(calcSecs());
        const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimedAt]);

    const m       = Math.floor(secs / 60);
    const s       = secs % 60;
    const warning = secs > 0 && secs <= 120;
    const expired = secs === 0;

    if (expired) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={[
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm',
                warning ? 'bg-sun text-sun-ink' : 'bg-mist text-forest',
            ].join(' ')}
        >
            <Clock className="size-4 shrink-0" aria-hidden />
            <span>
                {warning ? 'Waktu hampir habis! ' : 'Sisa waktu klaim: '}
                <strong>{m}:{String(s).padStart(2, '0')}</strong>
            </span>
        </div>
    );
}

/** Kartu konfirmasi member setelah berhasil dipindai */
function MemberFoundCard({
    member,
    token,
    code,
    claimedAt,
    claimedUntil,
    onContinue,
    onRescan,
    releasing,
}: {
    member: DepositMember;
    token?: string;
    code?: string;
    claimedAt: number;
    claimedUntil?: string;
    onContinue: () => void;
    onRescan: () => void;
    releasing: boolean;
}) {
    return (
        <div className="space-y-4">
            {/* Kartu member */}
            <div className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center gap-4">
                    <div
                        className="grid size-14 shrink-0 place-items-center
                                   rounded-full bg-forest text-xl font-semibold text-white"
                        aria-hidden
                    >
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{member.name}</p>
                        <p className="font-mono text-xs text-muted">{member.member_code}</p>
                    </div>
                    <span className="grid size-9 place-items-center rounded-full bg-mint text-forest">
                        <UserRound className="size-5" aria-hidden />
                    </span>
                </div>
            </div>

            {/* Hitung mundur klaim (hanya untuk mode token) */}
            {token && <ClaimCountdown claimedAt={claimedAt} />}

            {/* Catatan untuk kode manual */}
            {code && !token && (
                <div
                    className="flex items-start gap-2 rounded-xl border border-sun bg-sun px-4 py-3"
                    role="note"
                >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sun-ink" aria-hidden />
                    <p className="text-sm text-sun-ink">
                        Mode kode manual — cocokkan identitas dengan orang yang hadir langsung.
                    </p>
                </div>
            )}

            {/* Tombol aksi */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onRescan}
                    disabled={releasing}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl border border-line
                               px-4 py-2.5 text-sm font-semibold text-ink transition-colors
                               hover:bg-mist disabled:opacity-50"
                >
                    {releasing
                        ? <RefreshCw className="size-4 animate-spin" aria-hidden />
                        : <RotateCcw className="size-4" aria-hidden />
                    }
                    Pindai ulang
                </button>

                <button
                    type="button"
                    onClick={onContinue}
                    className="flex flex-1 min-h-[44px] items-center justify-center gap-2
                               rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold
                               text-white transition-colors hover:bg-forest-deep"
                >
                    <Check className="size-4" aria-hidden />
                    Lanjut input setoran
                    <ArrowRight className="size-4" aria-hidden />
                </button>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ScanMemberPage() {
    const router = useRouter();

    const [step, setStep]           = useState<ScanStep>('scanning');
    const [error, setError]         = useState('');
    const [looking, setLooking]     = useState(false);   // sedang panggil API
    const [releasing, setReleasing] = useState(false);

    // State hasil lookup
    const [member, setMember]           = useState<DepositMember | null>(null);
    const [activeToken, setActiveToken] = useState<string | undefined>();
    const [activeCode, setActiveCode]   = useState<string | undefined>();
    const [claimedAt, setClaimedAt]     = useState(0);
    const [claimedUntil, setClaimedUntil] = useState<string | undefined>();

    // Input manual
    const [manualInput, setManualInput] = useState('');
    const [manualMode, setManualMode]   = useState(false);

    // Ref untuk cegah dua lookup sekaligus
    const lookingRef = useRef(false);

    // ── Lookup API ────────────────────────────────────────────────────

    const doLookup = useCallback(async (token?: string, code?: string) => {
        if (lookingRef.current) return;
        lookingRef.current = true;
        setLooking(true);
        setError('');

        try {
            const param = token
                ? `?token=${encodeURIComponent(token)}`
                : `?code=${encodeURIComponent(code ?? '')}`;

            const res = await api.get<{
                data: DepositMember;
                claim_expires_at?: string;
            }>(`/waste-bank/members/lookup${param}`);

            setMember(res.data);
            setActiveToken(token);
            setActiveCode(code);
            setClaimedAt(Date.now());
            setClaimedUntil(res.claim_expires_at);
            setStep('found');
        } catch (err) {
            const apiErr = err as ApiError;
            setError(codeToMessage(apiErr?.code));
        } finally {
            setLooking(false);
            lookingRef.current = false;
        }
    }, []);

    // ── Hasil scan QR ─────────────────────────────────────────────────

    function handleQrToken(token: string) {
        doLookup(token, undefined);
    }

    function handleCameraError(msg: string) {
        setError(msg);
    }

    // ── Input manual ──────────────────────────────────────────────────

    function handleManualSubmit() {
        const val = manualInput.trim().toUpperCase();
        if (!val) return;

        if (val.startsWith('GG-')) {
            doLookup(undefined, val);
        } else if (TOKEN_RE.test(val)) {
            doLookup(val, undefined);
        } else {
            setError('Format tidak dikenali. Masukkan kode GG-XXXXXX atau token QR 32 karakter.');
        }
    }

    // ── Lanjut ke setoran ─────────────────────────────────────────────

    function handleContinue() {
        if (!member) return;

        depositSession.set({
            member,
            token: activeToken,
            code: activeCode,
            claimedAt,
            claimedUntil,
        });

        router.push('/waste-bank/deposits/new');
    }

    // ── Pindai ulang ──────────────────────────────────────────────────

    async function handleRescan() {
        if (!activeToken) {
            // Mode kode: tidak perlu release
            resetToScanning();
            return;
        }

        setReleasing(true);
        try {
            await api.post('/waste-bank/members/release', { token: activeToken });
        } catch {
            // Abaikan error release — token mungkin sudah expired
        } finally {
            setReleasing(false);
            resetToScanning();
        }
    }

    function resetToScanning() {
        setStep('scanning');
        setMember(null);
        setActiveToken(undefined);
        setActiveCode(undefined);
        setClaimedAt(0);
        setClaimedUntil(undefined);
        setError('');
        setManualInput('');
    }

    // ── Render ────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-lg space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <ScanLine className="size-5 text-forest" aria-hidden />
                <h1 className="font-serif text-xl font-medium text-forest">Pindai Member</h1>
            </div>

            {/* Error banner */}
            {error && (
                <ErrorBanner message={error} onDismiss={() => setError('')} />
            )}

            {/* ── Status: scanning ─────────────────────────────────── */}
            {step === 'scanning' && (
                <div className="space-y-4">
                    {/* Tab switch: kamera / kode manual */}
                    <div className="flex overflow-hidden rounded-xl border border-line bg-paper p-1">
                        {[
                            { key: false, label: 'Kamera QR', Icon: QrCode },
                            { key: true,  label: 'Kode Manual', Icon: Keyboard },
                        ].map(({ key, label, Icon }) => (
                            <button
                                key={String(key)}
                                type="button"
                                onClick={() => { setManualMode(key); setError(''); }}
                                className={[
                                    'flex flex-1 items-center justify-center gap-2 rounded-lg',
                                    'py-2 text-sm font-semibold transition-colors',
                                    manualMode === key
                                        ? 'bg-white text-forest shadow-sm'
                                        : 'text-muted hover:text-ink',
                                ].join(' ')}
                            >
                                <Icon className="size-4" aria-hidden />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Mode kamera */}
                    {!manualMode && (
                        <div className="space-y-3">
                            <QrScannerCamera
                                onResult={handleQrToken}
                                onError={handleCameraError}
                            />
                            {looking && (
                                <p
                                    className="flex items-center justify-center gap-2
                                               text-sm text-muted"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <RefreshCw className="size-4 animate-spin" aria-hidden />
                                    Mengidentifikasi member…
                                </p>
                            )}
                        </div>
                    )}

                    {/* Mode kode manual */}
                    {manualMode && (
                        <div className="space-y-3">
                            <label
                                className="block text-xs font-semibold text-ink"
                                htmlFor="manual-code"
                            >
                                Kode Member atau Token QR
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="manual-code"
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                                    placeholder="GG-000001 atau token 32 karakter"
                                    className="field-base flex-1 font-mono uppercase"
                                    autoCapitalize="characters"
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                <button
                                    type="button"
                                    onClick={handleManualSubmit}
                                    disabled={!manualInput.trim() || looking}
                                    className="flex min-h-[44px] items-center gap-1.5 rounded-xl
                                               bg-forest px-4 text-sm font-semibold text-white
                                               transition-colors hover:bg-forest-deep disabled:opacity-40"
                                >
                                    {looking
                                        ? <RefreshCw className="size-4 animate-spin" aria-hidden />
                                        : 'Cari'
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Status: found ────────────────────────────────────── */}
            {step === 'found' && member && (
                <MemberFoundCard
                    member={member}
                    token={activeToken}
                    code={activeCode}
                    claimedAt={claimedAt}
                    claimedUntil={claimedUntil}
                    onContinue={handleContinue}
                    onRescan={handleRescan}
                    releasing={releasing}
                />
            )}
        </div>
    );
}
