'use client';

/**
 * /waste-bank/deposits/new
 *
 * Alur 5 langkah:
 *   1. Scan    — kamera QR + input manual cadangan
 *   2. Konfirmasi member — kartu nama + member_code
 *   3. Item    — form dinamis kategori/berat + preview poin + hitung mundur klaim
 *   4. Modal konfirmasi
 *   5. Sukses
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowLeft,
    Camera,
    CheckCircle2,
    ChevronDown,
    Clock,
    Keyboard,
    Minus,
    Plus,
    QrCode,
    RotateCcw,
    Scale,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { api, firstError } from '@/lib/api';
import { useToast } from '@/components/ui';

// Fallback untuk env yang tidak punya crypto.randomUUID (sangat jarang di modern browser)
function genUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

// QrScanner hanya diload di client
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
    icon: string | null;
    points_per_kg: number;
}

interface DepositLine {
    waste_category_id: number;
    weight_kg: string;
}

interface SubmitResult {
    data: {
        id: number;
        total_weight_kg: number;
        total_points: number;
        member: { name: string; member_code: string } | null;
        items: Array<{
            waste_category: { name: string };
            weight_kg: number;
            points: number;
        }>;
    };
    member_balance: number;
}

type Step = 'scan' | 'confirm' | 'items' | 'success';

const QR_PREFIX = 'gogreen://member/';

// ── Helpers ───────────────────────────────────────────────────────────────

function errorMessage(code?: string): string {
    const map: Record<string, string> = {
        token_invalid:          'QR tidak valid.',
        token_expired:          'QR sudah kedaluwarsa. Minta member buat QR baru.',
        token_used:             'QR sudah pernah digunakan.',
        token_claimed_by_other: 'QR sedang diproses oleh bank sampah lain.',
        user_not_found:         'Member tidak ditemukan.',
        user_banned:            'Akun member ini diblokir.',
        category_not_accepted:  'Beberapa kategori tidak diterima bank ini.',
        bank_not_verified:      'Akun bank sampah belum diverifikasi.',
        rate_limited:           'Terlalu banyak percobaan. Coba lagi sebentar.',
    };
    return code && map[code] ? map[code] : 'Terjadi kesalahan. Silakan coba lagi.';
}

// ── Step 1: Scan ──────────────────────────────────────────────────────────

function ScanStep({
    onToken,
    onCode,
}: {
    onToken: (token: string) => void;
    onCode: (code: string) => void;
}) {
    const [mode, setMode]   = useState<'camera' | 'manual'>('camera');
    const [manual, setManual] = useState('');
    const [camError, setCamError] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    function handleQrResult(raw: string) {
        setShowScanner(false);
        const token = raw.startsWith(QR_PREFIX) ? raw.slice(QR_PREFIX.length) : null;
        if (!token || token.length !== 32) {
            setCamError('QR tidak dikenali. Pastikan kartu member GO GREEN yang dipindai.');
            return;
        }
        onToken(token);
    }

    function handleManualSubmit() {
        const val = manual.trim().toUpperCase();
        if (!val) return;
        // Bisa berupa member_code (GG-XXXXXX) atau token 32 char
        if (val.startsWith('GG-')) {
            onCode(val);
        } else if (val.length === 32) {
            onToken(val);
        } else {
            setCamError('Format kode tidak dikenali. Masukkan kode GG-XXXXXX atau token QR.');
        }
    }

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-serif text-2xl font-medium text-forest">Scan Kartu Member</h2>
                <p className="mt-1 text-sm text-muted">
                    Pindai QR member atau masukkan kode manual sebagai cadangan.
                </p>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl border border-line bg-paper p-1">
                {[
                    { key: 'camera', label: 'Kamera', Icon: Camera },
                    { key: 'manual', label: 'Kode Manual', Icon: Keyboard },
                ].map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => { setMode(key as 'camera' | 'manual'); setCamError(''); }}
                        className={[
                            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors',
                            mode === key ? 'bg-white text-forest shadow-sm' : 'text-muted hover:text-ink',
                        ].join(' ')}
                    >
                        <Icon className="size-4" aria-hidden />
                        {label}
                    </button>
                ))}
            </div>

            {mode === 'camera' && (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-forest/30 bg-mist/40 py-10">
                    <QrCode className="size-12 text-leaf" aria-hidden />
                    <p className="text-sm text-muted">Buka kamera untuk memindai QR member</p>
                    <button
                        type="button"
                        onClick={() => { setShowScanner(true); setCamError(''); }}
                        className="flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                    >
                        <Camera className="size-4" aria-hidden />
                        Buka Kamera
                    </button>
                    <p className="text-xs text-muted">
                        Membutuhkan HTTPS atau localhost untuk akses kamera.
                    </p>
                </div>
            )}

            {mode === 'manual' && (
                <div className="space-y-3">
                    <label className="block text-xs font-semibold text-ink" htmlFor="manual-code">
                        Kode Member / Token QR
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="manual-code"
                            type="text"
                            value={manual}
                            onChange={(e) => setManual(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                            placeholder="GG-XXXXXX atau token 32 karakter"
                            className="field-base flex-1 font-mono uppercase"
                            autoCapitalize="characters"
                        />
                        <button
                            type="button"
                            onClick={handleManualSubmit}
                            disabled={!manual.trim()}
                            className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-40"
                        >
                            Cari
                        </button>
                    </div>
                </div>
            )}

            {camError && (
                <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3" role="alert">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                    <p className="text-sm text-danger">{camError}</p>
                </div>
            )}

            {showScanner && (
                <QrScanner
                    onResult={handleQrResult}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}

// ── Step 2: Konfirmasi member ─────────────────────────────────────────────

function ConfirmMemberStep({
    member,
    onConfirm,
    onRescan,
}: {
    member: Member;
    onConfirm: () => void;
    onRescan: () => void;
}) {
    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-serif text-2xl font-medium text-forest">Konfirmasi Member</h2>
                <p className="mt-1 text-sm text-muted">Pastikan ini member yang benar.</p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center gap-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-full bg-forest text-xl font-semibold text-white">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{member.name}</p>
                        <p className="font-mono text-xs text-muted">{member.member_code}</p>
                        <p className="mt-1 text-xs text-muted">
                            Saldo:{' '}
                            <span className="font-semibold text-forest">
                                {member.points_balance.toLocaleString('id-ID')} poin
                            </span>
                        </p>
                    </div>
                    <UserRound className="size-5 text-leaf" aria-hidden />
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onRescan}
                    className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mist"
                >
                    <RotateCcw className="size-4" aria-hidden />
                    Pindai ulang
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className="flex-1 rounded-xl bg-forest py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                >
                    Benar, lanjutkan →
                </button>
            </div>
        </div>
    );
}

// ── Step 3: Form item ─────────────────────────────────────────────────────

function ClaimCountdown({ claimedAt }: { claimedAt: number }) {
    // Token claimed TTL 15 menit
    const [secs, setSecs] = useState(() =>
        Math.max(0, Math.round((claimedAt + 15 * 60 * 1000 - Date.now()) / 1000)),
    );

    useEffect(() => {
        const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [claimedAt]);

    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const warning = secs <= 120; // 2 menit tersisa

    if (secs === 0) return null;

    return (
        <div
            className={[
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm',
                warning ? 'bg-sun text-sun-ink' : 'bg-mist text-forest',
            ].join(' ')}
            role={warning ? 'alert' : 'status'}
        >
            <Clock className="size-4 shrink-0" aria-hidden />
            <span>
                {warning ? 'Waktu hampir habis! ' : 'Sisa waktu klaim: '}
                <strong>
                    {m}:{String(s).padStart(2, '0')}
                </strong>
            </span>
        </div>
    );
}

function CategoryDropdown({
    categories,
    usedIds,
    onSelect,
}: {
    categories: Category[];
    usedIds: Set<number>;
    onSelect: (cat: Category) => void;
}) {
    const [open, setOpen] = useState(false);
    const available = categories.filter((c) => !usedIds.has(c.id));

    if (available.length === 0) return null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-dashed border-forest/40 px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
            >
                <Plus className="size-4" aria-hidden />
                Tambah sampah
                <ChevronDown
                    className={['size-4 transition-transform', open ? 'rotate-180' : ''].join(' ')}
                    aria-hidden
                />
            </button>
            {open && (
                <div className="absolute left-0 top-full z-10 mt-1 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
                    {available.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => { onSelect(cat); setOpen(false); }}
                            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-mist"
                        >
                            <span className="font-medium text-ink">{cat.name}</span>
                            <span className="text-xs text-muted">{cat.points_per_kg} poin/kg</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ItemRow({
    line,
    category,
    onWeightChange,
    onRemove,
}: {
    line: DepositLine;
    category: Category;
    onWeightChange: (v: string) => void;
    onRemove: () => void;
}) {
    const w       = parseFloat(line.weight_kg) || 0;
    const points  = Math.round(w * category.points_per_kg);

    function step(delta: number) {
        const next = Math.max(0, Math.round((w + delta) * 100) / 100);
        onWeightChange(next > 0 ? String(next) : '');
    }

    return (
        <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-ink">{category.name}</p>
                    <p className="text-xs text-muted">{category.points_per_kg} poin/kg</p>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Hapus ${category.name}`}
                    className="mt-0.5 rounded-lg p-1 text-muted transition-colors hover:text-danger"
                >
                    <Trash2 className="size-4" aria-hidden />
                </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center overflow-hidden rounded-xl border border-line">
                    <button
                        type="button"
                        onClick={() => step(-0.5)}
                        disabled={w <= 0}
                        aria-label="Kurangi 0.5 kg"
                        className="grid h-9 w-9 place-items-center text-muted transition-colors hover:text-forest disabled:opacity-40"
                    >
                        <Minus className="size-4" aria-hidden />
                    </button>
                    <input
                        type="number"
                        value={line.weight_kg}
                        min="0.01"
                        max="500"
                        step="0.01"
                        onChange={(e) => onWeightChange(e.target.value)}
                        aria-label={`Berat ${category.name} dalam kg`}
                        className="w-16 bg-transparent py-2 text-center text-sm font-semibold text-ink outline-none"
                    />
                    <span className="pr-2 text-xs text-muted">kg</span>
                    <button
                        type="button"
                        onClick={() => step(0.5)}
                        aria-label="Tambah 0.5 kg"
                        className="grid h-9 w-9 place-items-center text-muted transition-colors hover:text-forest"
                    >
                        <Plus className="size-4" aria-hidden />
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
}

// ── Step 5: Sukses ────────────────────────────────────────────────────────

function SuccessStep({
    result,
    newBalance,
    onNew,
}: {
    result: SubmitResult['data'];
    newBalance: number;
    onNew: () => void;
}) {
    return (
        <div className="space-y-5">
            <div className="flex flex-col items-center gap-5 rounded-2xl bg-mint px-6 py-8 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-forest text-mint">
                    <CheckCircle2 className="size-8" aria-hidden />
                </span>
                <div>
                    <h2 className="font-serif text-2xl font-medium text-forest">Setoran Berhasil!</h2>
                    <p className="mt-1 text-sm text-muted">
                        Poin dikreditkan ke{' '}
                        <span className="font-semibold text-ink">{result.member?.name}</span>
                    </p>
                </div>

                <div className="w-full space-y-2 rounded-2xl bg-white/70 px-5 py-4 text-left">
                    <RowInfo label="Total berat" value={`${Number(result.total_weight_kg).toFixed(2)} kg`} />
                    <RowInfo
                        label="Poin diperoleh"
                        value={`+${result.total_points.toLocaleString('id-ID')}`}
                        valueClass="font-semibold text-forest"
                    />
                    <RowInfo
                        label="Saldo baru member"
                        value={`${newBalance.toLocaleString('id-ID')} poin`}
                    />
                </div>

                {result.items.length > 0 && (
                    <div className="w-full space-y-1 text-left">
                        <p className="text-xs font-semibold text-muted">Rincian</p>
                        {result.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs text-muted">
                                <span>{item.waste_category.name}</span>
                                <span>
                                    {Number(item.weight_kg).toFixed(2)} kg → +{item.points} poin
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onNew}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                >
                    <Plus className="size-4" aria-hidden />
                    Setoran baru
                </button>
                <Link
                    href="/waste-bank/deposits"
                    className="flex flex-1 items-center justify-center rounded-xl border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mist"
                >
                    Lihat rekapan
                </Link>
            </div>
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

// ── Modal konfirmasi ──────────────────────────────────────────────────────

function ConfirmModal({
    open,
    memberName,
    lines,
    categories,
    totalKg,
    totalPoints,
    submitting,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    memberName: string;
    lines: DepositLine[];
    categories: Category[];
    totalKg: number;
    totalPoints: number;
    submitting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
        >
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h3 id="confirm-title" className="font-semibold text-ink">Konfirmasi Setoran</h3>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Batal"
                        className="rounded-lg p-1 text-muted hover:text-ink"
                    >
                        <X className="size-4" aria-hidden />
                    </button>
                </div>

                <div className="space-y-3 px-5 py-4 text-sm">
                    <RowInfo label="Member" value={memberName} />
                    {lines.map((l) => {
                        const cat = categories.find((c) => c.id === l.waste_category_id);
                        if (!cat) return null;
                        return (
                            <RowInfo
                                key={l.waste_category_id}
                                label={cat.name}
                                value={`${parseFloat(l.weight_kg).toFixed(2)} kg`}
                            />
                        );
                    })}
                    <div className="border-t border-line pt-2">
                        <RowInfo label="Total berat" value={`${totalKg.toFixed(2)} kg`} />
                        <RowInfo
                            label="Estimasi poin"
                            value={`+${totalPoints.toLocaleString('id-ID')}`}
                            valueClass="font-semibold text-forest"
                        />
                    </div>
                </div>

                <div className="flex gap-3 border-t border-line px-5 py-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mist disabled:opacity-40"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={submitting}
                        className="flex-1 rounded-xl bg-forest py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-50"
                    >
                        {submitting ? 'Menyimpan…' : 'Simpan Setoran'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Error banner ──────────────────────────────────────────────────────────

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div
            className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3"
            role="alert"
        >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            <p className="flex-1 text-sm text-danger">{message}</p>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Tutup pesan error"
                className="text-danger/60 hover:text-danger"
            >
                <X className="size-4" aria-hidden />
            </button>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function NewDepositPage() {
    const { toast } = useToast();

    const [step, setStep]     = useState<Step>('scan');
    const [error, setError]   = useState('');

    // State data
    const [member, setMember]     = useState<Member | null>(null);
    const [token, setToken]       = useState<string | null>(null);     // token QR yang dipakai
    const [memberCode, setMemberCode] = useState<string | null>(null); // cadangan jika tanpa token
    const [categories, setCategories] = useState<Category[]>([]);
    const [lines, setLines]       = useState<DepositLine[]>([]);
    const [notes, setNotes]       = useState('');
    const [claimedAt, setClaimedAt] = useState<number>(0);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult]     = useState<SubmitResult | null>(null);

    // client_request_id dibuat sekali per percobaan setoran
    const clientIdRef = useRef<string>(genUuid());

    // ── Load kategori bank ────────────────────────────────────────────

    useEffect(() => {
        api.get<{ data: Category[] }>('/waste-bank/deposit-categories')
            .then((r) => setCategories(r.data))
            .catch(() => {});
    }, []);

    // ── Lookup setelah scan ───────────────────────────────────────────

    const doLookup = useCallback(async (t: string | null, code: string | null) => {
        setError('');
        try {
            const param = t
                ? `/waste-bank/members/lookup?token=${encodeURIComponent(t)}`
                : `/waste-bank/members/lookup?code=${encodeURIComponent(code ?? '')}`;

            const res = await api.get<{ data: Member }>(param);
            setMember(res.data);
            setToken(t);
            setMemberCode(code);
            setClaimedAt(Date.now());
            setStep('confirm');
        } catch (err) {
            const apiErr = err as { code?: string; message?: string };
            setError(errorMessage(apiErr?.code));
        }
    }, []);

    // ── Handlers ─────────────────────────────────────────────────────

    function handleToken(t: string) {
        doLookup(t, null);
    }

    function handleCode(code: string) {
        doLookup(null, code);
    }

    function handleConfirmMember() {
        setLines([]);
        setStep('items');
    }

    function handleAddCategory(cat: Category) {
        setLines((prev) => [...prev, { waste_category_id: cat.id, weight_kg: '' }]);
    }

    function handleWeightChange(idx: number, val: string) {
        setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, weight_kg: val } : l)));
    }

    function handleRemoveLine(idx: number) {
        setLines((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSubmit() {
        if (!member) return;
        setSubmitting(true);
        try {
            const res = await api.post<SubmitResult>('/waste-bank/deposits', {
                ...(token ? { token } : { member_code: memberCode }),
                notes:              notes.trim() || undefined,
                client_request_id:  clientIdRef.current,
                items: lines
                    .filter((l) => l.waste_category_id > 0 && parseFloat(l.weight_kg) >= 0.01)
                    .map((l) => ({
                        waste_category_id: l.waste_category_id,
                        weight_kg:         parseFloat(l.weight_kg),
                    })),
            });
            setResult(res);
            setShowModal(false);
            setStep('success');
        } catch (err) {
            const apiErr = err as { code?: string };
            toast(errorMessage(apiErr?.code), 'error');
            setShowModal(false);
        } finally {
            setSubmitting(false);
        }
    }

    function handleNewDeposit() {
        setStep('scan');
        setMember(null);
        setToken(null);
        setMemberCode(null);
        setLines([]);
        setNotes('');
        setError('');
        setResult(null);
        clientIdRef.current = genUuid();
    }

    // ── Derived ───────────────────────────────────────────────────────

    const totalKg = lines.reduce((s, l) => s + (parseFloat(l.weight_kg) || 0), 0);
    const totalPoints = lines.reduce((s, l) => {
        const cat = categories.find((c) => c.id === l.waste_category_id);
        return s + (cat ? Math.round((parseFloat(l.weight_kg) || 0) * cat.points_per_kg) : 0);
    }, 0);
    const usedIds = new Set(lines.map((l) => l.waste_category_id));
    const linesValid =
        lines.length > 0 &&
        lines.every((l) => l.waste_category_id > 0 && parseFloat(l.weight_kg) >= 0.01);

    // ── Render ────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-leaf">Bank Sampah</p>
                    <h1 className="font-serif text-3xl font-medium text-forest">Input Setoran</h1>
                </div>
                {step !== 'success' && (
                    <Link
                        href="/waste-bank/deposits"
                        className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        Rekapan
                    </Link>
                )}
            </div>

            {/* Step indicator */}
            {step !== 'success' && (
                <div className="flex items-center gap-2">
                    {(['scan', 'confirm', 'items'] as const).map((s, i) => {
                        const stepNum = ['scan', 'confirm', 'items'].indexOf(step);
                        const done    = i < stepNum;
                        const active  = s === step;
                        const label   = ['Pindai', 'Member', 'Timbang'][i];
                        return (
                            <div key={s} className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={[
                                            'grid size-6 place-items-center rounded-full text-xs font-semibold',
                                            done    ? 'bg-forest text-white'
                                            : active ? 'bg-forest text-white'
                                            : 'bg-line text-muted',
                                        ].join(' ')}
                                    >
                                        {done ? <CheckCircle2 className="size-4" aria-hidden /> : i + 1}
                                    </span>
                                    <span className={['text-xs font-semibold', active || done ? 'text-ink' : 'text-muted'].join(' ')}>
                                        {label}
                                    </span>
                                </div>
                                {i < 2 && <div className="h-px w-6 bg-line" aria-hidden />}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Error banner */}
            {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

            {/* Steps */}
            {step === 'scan' && <ScanStep onToken={handleToken} onCode={handleCode} />}

            {step === 'confirm' && member && (
                <ConfirmMemberStep
                    member={member}
                    onConfirm={handleConfirmMember}
                    onRescan={() => { setStep('scan'); setError(''); }}
                />
            )}

            {step === 'items' && member && (
                <div className="space-y-4">
                    {/* Member chip */}
                    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-forest text-sm font-semibold text-white">
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink">{member.name}</p>
                            <p className="font-mono text-xs text-muted">{member.member_code}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStep('confirm')}
                            className="text-xs font-semibold text-forest hover:underline"
                        >
                            Ganti
                        </button>
                    </div>

                    {/* Countdown klaim */}
                    {token && <ClaimCountdown claimedAt={claimedAt} />}

                    {/* Item list */}
                    {lines.length > 0 && (
                        <div className="space-y-3">
                            {lines.map((line, idx) => {
                                const cat = categories.find((c) => c.id === line.waste_category_id);
                                if (!cat) return null;
                                return (
                                    <ItemRow
                                        key={line.waste_category_id}
                                        line={line}
                                        category={cat}
                                        onWeightChange={(v) => handleWeightChange(idx, v)}
                                        onRemove={() => handleRemoveLine(idx)}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Tambah kategori */}
                    <CategoryDropdown
                        categories={categories}
                        usedIds={usedIds}
                        onSelect={handleAddCategory}
                    />

                    {/* Empty state */}
                    {lines.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-line py-8 text-center text-sm text-muted">
                            <Scale className="mx-auto mb-2 size-8 text-line" aria-hidden />
                            Belum ada item. Tambahkan jenis sampah di atas.
                        </div>
                    )}

                    {/* Catatan */}
                    <div>
                        <label htmlFor="notes" className="mb-1.5 block text-xs font-semibold text-ink">
                            Catatan <span className="font-normal text-muted">(opsional)</span>
                        </label>
                        <textarea
                            id="notes"
                            rows={2}
                            maxLength={500}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: botol bersih, sudah dipilah"
                            className="field-base resize-none"
                        />
                    </div>

                    {/* Summary */}
                    {linesValid && (
                        <div className="rounded-2xl bg-mint p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Total berat</span>
                                <span className="font-semibold text-ink">{totalKg.toFixed(2)} kg</span>
                            </div>
                            <div className="mt-1 flex justify-between text-sm">
                                <span className="text-muted">Estimasi poin</span>
                                <span className="font-semibold text-forest">+{totalPoints.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep('confirm')}
                            className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mist"
                        >
                            <ArrowLeft className="size-4" aria-hidden />
                            Kembali
                        </button>
                        <button
                            type="button"
                            disabled={!linesValid}
                            onClick={() => { clientIdRef.current = genUuid(); setShowModal(true); }}
                            className="flex-1 rounded-xl bg-forest py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Simpan Setoran
                        </button>
                    </div>
                </div>
            )}

            {step === 'success' && result && (
                <SuccessStep
                    result={result.data}
                    newBalance={result.member_balance}
                    onNew={handleNewDeposit}
                />
            )}

            {/* Modal konfirmasi */}
            <ConfirmModal
                open={showModal}
                memberName={member?.name ?? ''}
                lines={lines.filter((l) => l.waste_category_id > 0 && parseFloat(l.weight_kg) >= 0.01)}
                categories={categories}
                totalKg={totalKg}
                totalPoints={totalPoints}
                submitting={submitting}
                onConfirm={handleSubmit}
                onCancel={() => setShowModal(false)}
            />
        </div>
    );
}
