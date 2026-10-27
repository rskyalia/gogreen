"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    ChevronDown,
    MapPin,
    Minus,
    Plus,
    RotateCcw,
    Search,
    Trash2,
} from "lucide-react";
import { api, firstError } from "@/lib/api";
import { useToast } from "@/components/ui";

// ── Types ─────────────────────────────────────────────────────────────────

interface AcceptedCategory {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    points_per_kg: number;
}

interface WasteBankOption {
    id: number;
    name: string;
    address: string;
    distance_km: number | null;
    is_open_now: boolean;
    today_hours: string | null;
    accepted_categories: AcceptedCategory[];
}

interface DepositItem {
    waste_category_id: number;
    category_name: string;
    points_per_kg: number;
    weight_kg: string; // string agar input terkontrol
}

interface WasteBankListResponse {
    data: WasteBankOption[];
}

interface SubmitResult {
    waste_bank_name: string;
    total_weight_kg: number;
    total_points: number;
}

// ── Step indicator ─────────────────────────────────────────────────────────

function Step({
    n,
    label,
    active,
    done,
}: {
    n: number;
    label: string;
    active: boolean;
    done: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
                    done
                        ? "bg-forest text-white"
                        : active
                          ? "bg-forest text-white"
                          : "bg-line text-muted"
                }`}
            >
                {done ? <CheckCircle2 className="size-4" /> : n}
            </span>
            <span
                className={`text-xs font-semibold ${active || done ? "text-ink" : "text-muted"}`}
            >
                {label}
            </span>
        </div>
    );
}

// ── Bank card ──────────────────────────────────────────────────────────────

function BankCard({
    bank,
    selected,
    onSelect,
}: {
    bank: WasteBankOption;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                selected
                    ? "border-forest bg-mist"
                    : "border-line bg-white hover:bg-mist/40"
            }`}
        >
            <div className="flex items-start gap-3">
                <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${
                        selected ? "bg-forest text-white" : "bg-mist text-leaf"
                    }`}
                >
                    <Building2 className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{bank.name}</span>
                        <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                bank.is_open_now
                                    ? "bg-mint text-forest"
                                    : "bg-line text-muted"
                            }`}
                        >
                            {bank.is_open_now ? "Buka" : "Tutup"}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted leading-snug">{bank.address}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                        {bank.distance_km !== null && (
                            <span className="flex items-center gap-1">
                                <MapPin className="size-3" aria-hidden />
                                {bank.distance_km.toFixed(1)} km
                            </span>
                        )}
                        {bank.today_hours && <span>Hari ini: {bank.today_hours}</span>}
                    </div>
                    {bank.accepted_categories.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {bank.accepted_categories.slice(0, 5).map((c) => (
                                <span
                                    key={c.id}
                                    className="rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] text-ink"
                                >
                                    {c.name}
                                </span>
                            ))}
                            {bank.accepted_categories.length > 5 && (
                                <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] text-muted">
                                    +{bank.accepted_categories.length - 5}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {selected && (
                    <CheckCircle2 className="size-5 shrink-0 text-forest" aria-hidden />
                )}
            </div>
        </button>
    );
}

// ── Item row ───────────────────────────────────────────────────────────────

function ItemRow({
    item,
    onWeightChange,
    onRemove,
}: {
    item: DepositItem;
    onWeightChange: (v: string) => void;
    onRemove: () => void;
}) {
    const weightNum = parseFloat(item.weight_kg) || 0;
    const estimatedPoints = Math.round(weightNum * item.points_per_kg);

    const increment = () => {
        const next = Math.round((weightNum + 0.5) * 10) / 10;
        onWeightChange(String(next));
    };
    const decrement = () => {
        const next = Math.max(0, Math.round((weightNum - 0.5) * 10) / 10);
        onWeightChange(next > 0 ? String(next) : "");
    };

    return (
        <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-ink">{item.category_name}</p>
                    <p className="text-xs text-muted">{item.points_per_kg} poin/kg</p>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="mt-0.5 text-muted transition-colors hover:text-danger"
                    aria-label={`Hapus ${item.category_name}`}
                >
                    <Trash2 className="size-4" aria-hidden />
                </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
                {/* Stepper berat */}
                <div className="flex items-center gap-2 rounded-xl border border-line">
                    <button
                        type="button"
                        onClick={decrement}
                        className="grid size-9 place-items-center text-muted transition-colors hover:text-forest disabled:opacity-40"
                        disabled={weightNum <= 0}
                        aria-label="Kurangi 0.5 kg"
                    >
                        <Minus className="size-4" aria-hidden />
                    </button>
                    <input
                        type="number"
                        min="0.01"
                        step="0.1"
                        value={item.weight_kg}
                        onChange={(e) => onWeightChange(e.target.value)}
                        placeholder="0"
                        className="w-16 bg-transparent py-2 text-center text-sm font-semibold text-ink outline-none"
                        aria-label={`Berat ${item.category_name} dalam kg`}
                    />
                    <span className="pr-2 text-xs text-muted">kg</span>
                    <button
                        type="button"
                        onClick={increment}
                        className="grid size-9 place-items-center text-muted transition-colors hover:text-forest"
                        aria-label="Tambah 0.5 kg"
                    >
                        <Plus className="size-4" aria-hidden />
                    </button>
                </div>

                {/* Preview poin */}
                {estimatedPoints > 0 && (
                    <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">
                        +{estimatedPoints.toLocaleString("id-ID")} poin
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Category picker dropdown ───────────────────────────────────────────────

function CategoryPicker({
    categories,
    addedIds,
    onAdd,
}: {
    categories: AcceptedCategory[];
    addedIds: Set<number>;
    onAdd: (cat: AcceptedCategory) => void;
}) {
    const [open, setOpen] = useState(false);
    const available = categories.filter((c) => !addedIds.has(c.id));

    if (available.length === 0) return null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-dashed border-forest/40 bg-white px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
            >
                <Plus className="size-4" aria-hidden />
                Tambah jenis sampah
                <ChevronDown
                    className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-10 mt-1 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
                    {available.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                                onAdd(cat);
                                setOpen(false);
                            }}
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

// ── Success screen ─────────────────────────────────────────────────────────

function SuccessScreen({
    result,
    onReset,
    onHistory,
}: {
    result: SubmitResult;
    onReset: () => void;
    onHistory: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-6 py-12 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-mint text-forest">
                <CheckCircle2 className="size-10" aria-hidden />
            </span>
            <div>
                <h2 className="font-serif text-2xl font-medium text-forest">
                    Setoran berhasil dicatat!
                </h2>
                <p className="mt-2 text-sm text-muted">
                    Sampahmu sudah dicatat di {result.waste_bank_name}
                </p>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-3 rounded-2xl bg-mint p-5">
                <div className="flex justify-between text-sm">
                    <span className="text-muted">Total berat</span>
                    <span className="font-semibold text-ink">
                        {result.total_weight_kg.toFixed(2)} kg
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted">Poin didapat</span>
                    <span className="font-semibold text-forest">
                        +{result.total_points.toLocaleString("id-ID")} poin
                    </span>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onHistory}
                    className="rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                >
                    Lihat riwayat
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center gap-2 rounded-xl border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                >
                    <RotateCcw className="size-4" aria-hidden />
                    Setor lagi
                </button>
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────

interface SetoranBuatViewProps {
    onGoHistory: () => void;
}

export default function SetoranBuatView({ onGoHistory }: SetoranBuatViewProps) {
    const { toast } = useToast();

    // ── Step state ─────────────────────────────────────────────────────
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // ── Step 1: bank selection ─────────────────────────────────────────
    const [banks, setBanks] = useState<WasteBankOption[]>([]);
    const [banksLoading, setBanksLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedBank, setSelectedBank] = useState<WasteBankOption | null>(null);

    // ── Step 2: items ──────────────────────────────────────────────────
    const [items, setItems] = useState<DepositItem[]>([]);
    const [notes, setNotes] = useState("");

    // ── Step 3: result ─────────────────────────────────────────────────
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitResult | null>(null);

    // ── Load banks ─────────────────────────────────────────────────────
    const loadBanks = useCallback(async () => {
        setBanksLoading(true);
        try {
            const res = await api.get<WasteBankListResponse>("/user/waste-banks?per_page=50");
            setBanks(res.data);
        } catch (err) {
            toast(firstError(err), "error");
        } finally {
            setBanksLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadBanks();
    }, [loadBanks]);

    // ── Derived ────────────────────────────────────────────────────────
    const filteredBanks = banks.filter(
        (b) =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.address.toLowerCase().includes(search.toLowerCase()),
    );

    const totalPoints = items.reduce((sum, item) => {
        const w = parseFloat(item.weight_kg) || 0;
        return sum + Math.round(w * item.points_per_kg);
    }, 0);

    const totalWeight = items.reduce((sum, item) => {
        return sum + (parseFloat(item.weight_kg) || 0);
    }, 0);

    const itemsValid = items.length > 0 && items.every((i) => parseFloat(i.weight_kg) >= 0.01);

    // ── Handlers ───────────────────────────────────────────────────────
    const handleSelectBank = (bank: WasteBankOption) => {
        setSelectedBank(bank);
        setItems([]); // reset items saat ganti bank
    };

    const handleAddCategory = (cat: AcceptedCategory) => {
        setItems((prev) => [
            ...prev,
            {
                waste_category_id: cat.id,
                category_name: cat.name,
                points_per_kg: cat.points_per_kg,
                weight_kg: "",
            },
        ]);
    };

    const handleWeightChange = (idx: number, val: string) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, weight_kg: val } : it)));
    };

    const handleRemoveItem = (idx: number) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!selectedBank || !itemsValid) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: SubmitResult }>("/user/deposits", {
                waste_bank_id: selectedBank.id,
                notes: notes.trim() || null,
                items: items.map((it) => ({
                    waste_category_id: it.waste_category_id,
                    weight_kg: parseFloat(it.weight_kg),
                })),
            });
            setResult(res.data);
            setStep(3);
        } catch (err) {
            toast(firstError(err), "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setSelectedBank(null);
        setItems([]);
        setNotes("");
        setResult(null);
        setSearch("");
    };

    // ── Render success ─────────────────────────────────────────────────
    if (step === 3 && result) {
        return (
            <div className="space-y-6">
                <header>
                    <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
                        Setor Sampah
                    </h1>
                </header>
                <SuccessScreen
                    result={result}
                    onReset={handleReset}
                    onHistory={onGoHistory}
                />
            </div>
        );
    }

    const addedIds = new Set(items.map((i) => i.waste_category_id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">
                    Setor Sampah
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                    Pilih bank sampah, masukkan jenis dan berat sampah, lalu konfirmasi
                    setoran.
                </p>
            </header>

            {/* Step indicator */}
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4">
                <Step n={1} label="Pilih bank sampah" active={step === 1} done={step > 1} />
                <div className="h-px flex-1 bg-line" aria-hidden />
                <Step n={2} label="Tambah sampah" active={step === 2} done={step > 2} />
                <div className="h-px flex-1 bg-line" aria-hidden />
                <Step n={3} label="Konfirmasi" active={false} done={step > 2} />
            </div>

            {/* ── STEP 1: Pilih bank sampah ── */}
            {step === 1 && (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                            aria-hidden
                        />
                        <input
                            type="search"
                            placeholder="Cari bank sampah..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="field-base pl-10"
                        />
                    </div>

                    {/* Bank list */}
                    {banksLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-24 animate-pulse rounded-2xl bg-mist"
                                />
                            ))}
                        </div>
                    ) : filteredBanks.length === 0 ? (
                        <div className="rounded-2xl border border-line bg-white py-12 text-center text-sm text-muted">
                            Tidak ada bank sampah ditemukan.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredBanks.map((bank) => (
                                <BankCard
                                    key={bank.id}
                                    bank={bank}
                                    selected={selectedBank?.id === bank.id}
                                    onSelect={() => handleSelectBank(bank)}
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            disabled={!selectedBank}
                            onClick={() => setStep(2)}
                            className="rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Lanjut →
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Tambah item sampah ── */}
            {step === 2 && selectedBank && (
                <div className="space-y-4">
                    {/* Selected bank info */}
                    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
                        <Building2 className="size-5 shrink-0 text-leaf" aria-hidden />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink">{selectedBank.name}</p>
                            <p className="text-xs text-muted">{selectedBank.address}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                        >
                            <ArrowLeft className="size-3" aria-hidden />
                            Ganti
                        </button>
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <ItemRow
                                    key={item.waste_category_id}
                                    item={item}
                                    onWeightChange={(v) => handleWeightChange(idx, v)}
                                    onRemove={() => handleRemoveItem(idx)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Add category */}
                    <CategoryPicker
                        categories={selectedBank.accepted_categories}
                        addedIds={addedIds}
                        onAdd={handleAddCategory}
                    />

                    {/* Notes */}
                    <div>
                        <label
                            htmlFor="notes"
                            className="mb-1.5 block text-xs font-semibold text-ink"
                        >
                            Catatan{" "}
                            <span className="font-normal text-muted">(opsional)</span>
                        </label>
                        <textarea
                            id="notes"
                            rows={2}
                            placeholder="Contoh: sampah dari rumah tangga, botol sudah dibersihkan..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            maxLength={500}
                            className="field-base resize-none"
                        />
                    </div>

                    {/* Summary + submit */}
                    {items.length > 0 && (
                        <div className="rounded-2xl bg-mint p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Total berat</span>
                                <span className="font-semibold text-ink">
                                    {totalWeight.toFixed(2)} kg
                                </span>
                            </div>
                            <div className="mt-1 flex justify-between text-sm">
                                <span className="text-muted">Estimasi poin</span>
                                <span className="font-semibold text-forest">
                                    +{totalPoints.toLocaleString("id-ID")} poin
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mist"
                        >
                            <ArrowLeft className="size-4" aria-hidden />
                            Kembali
                        </button>
                        <button
                            type="button"
                            disabled={!itemsValid || submitting}
                            onClick={handleSubmit}
                            className="flex-1 rounded-xl bg-forest py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {submitting ? "Menyimpan..." : "Konfirmasi Setoran"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
