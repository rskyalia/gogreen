"use client";

/**
 * SetoranView — tab "Setor Sampah" di dalam DashboardShell.
 *
 * Menggabungkan:
 *   1. Kartu QR member (token sekali pakai, hitung mundur, polling saldo)
 *   2. Riwayat 5 setoran terakhir dari API
 *   3. Layar sukses "Setoran berhasil" jika saldo naik saat polling
 */

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    ArrowRight,
    Check,
    CheckCircle,
    Clock,
    Coins,
    Copy,
    CreditCard,
    RefreshCw,
    Scale,
} from "lucide-react";
import { api, firstError } from "@/lib/api";

// QRCodeSVG dimuat lazy (butuh window)
const QRCodeSVG = dynamic(
    () => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })),
    { ssr: false, loading: () => <QrPlaceholder /> }
);

// ── Types ─────────────────────────────────────────────────────────────────

interface MemberCard {
    id: number;
    name: string;
    member_code: string;
    points_balance: number;
    avatar: string | null;
}

interface MemberToken {
    token: string;
    expires_at: string;
}

interface DepositRow {
    id: number;
    waste_bank_name: string;
    total_weight_kg: number;
    total_points: number;
    created_at: string;
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
            className="h-52 w-52 animate-pulse rounded-xl bg-mist"
            aria-hidden="true"
        />
    );
}

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
    const [seconds, setSeconds] = useState(() =>
        Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000))
    );

    useEffect(() => {
        const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, [expiresAt]);

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const isExpiring = seconds <= 30;
    const isExpired = seconds === 0;

    return (
        <div
            className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                isExpired
                    ? "bg-red-50 text-red-600"
                    : isExpiring
                        ? "bg-amber-50 text-amber-600"
                        : "bg-mist text-forest",
            ].join(" ")}
            role="status"
            aria-live="polite"
        >
            <Clock className="size-3" aria-hidden="true" />
            {isExpired ? "Kedaluwarsa" : `${mins}:${String(secs).padStart(2, "0")}`}
        </div>
    );
}

// ── Layar sukses ──────────────────────────────────────────────────────────

function SuccessScreen({
    info,
    onBack,
}: {
    info: DepositSuccess;
    onBack: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-line bg-white p-8 text-center">
            <CheckCircle className="size-14 text-leaf" aria-hidden="true" />
            <div>
                <h2 className="font-serif text-2xl font-medium text-forest">
                    Setoran Berhasil!
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Poin telah dikreditkan ke akunmu.
                </p>
            </div>

            <div className="w-full rounded-xl border border-line bg-paper p-4 text-left space-y-2">
                <Row label="Bank Sampah" value={info.waste_bank_name} />
                <Row label="Total Berat" value={`${Number(info.total_kg).toFixed(2)} kg`} />
                <Row
                    label="Poin Diperoleh"
                    value={`+${info.total_points.toLocaleString("id-ID")}`}
                    valueClass="font-semibold text-forest"
                />
            </div>

            <button
                type="button"
                onClick={onBack}
                className="rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white
                           transition-colors hover:bg-forest-deep"
            >
                Kembali ke Kartu
            </button>
        </div>
    );
}

function Row({
    label,
    value,
    valueClass = "text-ink",
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

// ── Main view ─────────────────────────────────────────────────────────────

const BALANCE_POLL_MS = 5_000;

export default function SetoranView() {
    const [card, setCard] = useState<MemberCard | null>(null);
    const [token, setToken] = useState<MemberToken | null>(null);
    const [deposits, setDeposits] = useState<DepositRow[]>([]);
    const [loadingCard, setLoadingCard] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [depositSuccess, setDepositSuccess] = useState<DepositSuccess | null>(null);

    const prevBalanceRef = useRef<number | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch kartu member ────────────────────────────────────────────────

    useEffect(() => {
        Promise.all([
            api.get<{ data: MemberCard }>("/user/member-card"),
            api.get<{ data: DepositRow[] }>("/user/deposits"),
        ])
            .then(([cardRes, depRes]) => {
                setCard(cardRes.data);
                prevBalanceRef.current = cardRes.data.points_balance;
                setDeposits(depRes.data.slice(0, 5));
            })
            .catch((err) => setError(firstError(err)))
            .finally(() => setLoadingCard(false));
    }, []);

    // ── Generate token ────────────────────────────────────────────────────

    const generateToken = useCallback(async () => {
        setRefreshing(true);
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

        try {
            const res = await api.post<{ data: MemberToken }>("/user/member-token", {});
            setToken(res.data);

            const msToExpiry = new Date(res.data.expires_at).getTime() - Date.now();
            refreshTimerRef.current = setTimeout(generateToken, Math.max(0, msToExpiry - 30_000));
        } catch {
            // abaikan — user bisa refresh manual
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        generateToken();
        return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Polling saldo tiap 5 detik ────────────────────────────────────────

    useEffect(() => {
        if (loadingCard) return;

        pollTimerRef.current = setInterval(async () => {
            try {
                const [cardRes, notifRes] = await Promise.all([
                    api.get<{ data: MemberCard }>("/user/member-card"),
                    api.get<{
                        data: Array<{
                            data: { waste_bank_name: string; total_kg: number; total_points: number };
                        }>;
                    }>("/user/notifications?per_page=1"),
                ]);

                const newBalance = cardRes.data.points_balance;
                setCard(cardRes.data);

                if (prevBalanceRef.current !== null && newBalance > prevBalanceRef.current) {
                    const n = notifRes.data[0];
                    if (n) {
                        setDepositSuccess({
                            waste_bank_name: n.data.waste_bank_name,
                            total_kg: n.data.total_kg,
                            total_points: n.data.total_points,
                        });
                        // Refresh riwayat setoran
                        api.get<{ data: DepositRow[] }>("/user/deposits")
                            .then((r) => setDeposits(r.data.slice(0, 5)))
                            .catch(() => {});
                    }
                }
                prevBalanceRef.current = newBalance;
            } catch {
                // abaikan error poll
            }
        }, BALANCE_POLL_MS);

        return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
    }, [loadingCard]);


    async function handleCopy() {
        if (!card?.member_code) return;
        await navigator.clipboard.writeText(card.member_code).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }


    if (depositSuccess) {
        return (
            <div className="mx-auto max-w-sm">
                <SuccessScreen
                    info={depositSuccess}
                    onBack={() => setDepositSuccess(null)}
                />
            </div>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────

    if (loadingCard) {
        return (
            <div className="space-y-5">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-line" />
                <div className="h-[420px] animate-pulse rounded-2xl bg-line" />
            </div>
        );
    }


    if (error) {
        return (
            <div className="rounded-2xl border border-line bg-white p-8 text-center">
                <p className="text-sm text-muted">{error}</p>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            <header>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
                    Identitas Member
                </p>
                <h1 className="mt-2 font-serif text-3xl font-medium text-forest sm:text-4xl">
                    Setor Sampah
                </h1>
                <p className="mt-2 text-sm text-muted">
                    Tunjukkan QR di bawah ke petugas bank sampah untuk mencatat setoranmu.
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
                {/* ── Kartu QR ── */}
                <div className="flex flex-col items-center gap-5 rounded-2xl border border-line bg-white p-6 sm:p-8">
                    {/* Avatar + nama + saldo */}
                    <div className="text-center">
                        <div
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full
                                       bg-forest text-xl font-bold text-white"
                            aria-hidden="true"
                        >
                            {(card?.name ?? "U").charAt(0).toUpperCase()}
                        </div>
                        <p className="mt-2 font-semibold text-ink">{card?.name}</p>
                        <p className="flex items-center justify-center gap-1.5 mt-0.5 text-sm text-muted">
                            <Coins className="size-3.5 text-forest" aria-hidden="true" />
                            {card?.points_balance.toLocaleString("id-ID")} poin
                        </p>
                    </div>

                    {/* QR */}
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
                                fgColor="#0b4d36"
                            />
                        ) : (
                            <QrPlaceholder />
                        )}
                    </div>

                    {token && <CountdownBadge expiresAt={token.expires_at} />}

                    {/* Member code + salin */}
                    <div className="flex w-full items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5">
                        <p className="flex-1 text-center font-mono text-base font-semibold tracking-widest text-ink">
                            {card?.member_code ?? "—"}
                        </p>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="text-muted hover:text-forest transition-colors"
                            aria-label="Salin kode member"
                        >
                            {copied
                                ? <Check className="size-4 text-leaf" aria-hidden="true" />
                                : <Copy className="size-4" aria-hidden="true" />}
                        </button>
                    </div>

                    {/* Refresh QR */}
                    <button
                        type="button"
                        onClick={generateToken}
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-xl border border-forest/30 px-4 py-2
                                   text-sm font-semibold text-forest transition-colors hover:bg-mist
                                   disabled:opacity-50"
                        aria-label="Refresh QR Code"
                    >
                        <RefreshCw
                            className={`size-4 ${refreshing ? "animate-spin" : ""}`}
                            aria-hidden="true"
                        />
                        Refresh QR
                    </button>

                    <p className="text-center text-xs text-muted">
                        QR berlaku 5 menit dan hanya bisa dipakai sekali.
                    </p>
                </div>

                {/* ── Riwayat setoran ── */}
                <div className="rounded-2xl border border-line bg-white p-6">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-serif text-xl font-medium text-forest">
                            Setoran Terakhir
                        </h2>
                        <Link
                            href="/deposits"
                            className="flex items-center gap-1 text-xs font-semibold text-forest
                                       hover:underline"
                        >
                            Lihat semua
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    {deposits.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12">
                            <Scale className="size-8 text-line" aria-hidden="true" />
                            <p className="text-sm text-muted">Belum ada setoran.</p>
                        </div>
                    ) : (
                        <ul className="mt-4 divide-y divide-line" role="list">
                            {deposits.map((dep) => (
                                <li key={dep.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-ink truncate">
                                            {dep.waste_bank_name}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {new Date(dep.created_at).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                            {" · "}
                                            {Number(dep.total_weight_kg).toFixed(2)} kg
                                        </p>
                                    </div>
                                    <span className="shrink-0 font-semibold text-forest text-sm">
                                        +{dep.total_points.toLocaleString("id-ID")} poin
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
