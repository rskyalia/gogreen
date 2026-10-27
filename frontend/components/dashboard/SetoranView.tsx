"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { Camera, CircleCheck, ImagePlus, Loader2 } from "lucide-react";
import { fetchTutorials, type Tutorial } from "@/lib/diy";
import { categories } from "@/lib/tutorials";
import { COMMUNITIES, createSubmission } from "@/lib/submissons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const MAX_MB = 5;
const MAX_NOTES = 300;

type Mode = "guide" | "custom";

const pickBtn =
    "flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-leaf";

function ModeChoice({
    value,
    checked,
    onChange,
    children,
}: {
    value: Mode;
    checked: boolean;
    onChange: () => void;
    children: ReactNode;
}) {
    return (
        <label className="relative block cursor-pointer">
            <input type="radio" name="mode" value={value} checked={checked} onChange={onChange} className="peer sr-only" />
            <span className="block h-full rounded-2xl border border-line bg-white p-4 transition-colors hover:bg-mist/60 peer-checked:border-forest peer-checked:bg-mist peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf">
                {children}
            </span>
        </label>
    );
}

export default function SetoranView({
    onDone,
    onSuccess,
}: {
    onDone: () => void;
    onSuccess?: () => void;
}) {
    const [guides, setGuides] = useState<Tutorial[]>([]);
    const [guidesState, setGuidesState] = useState<"loading" | "ready" | "error">("loading");
    const [mode, setMode] = useState<Mode>("guide");
    const [guideId, setGuideId] = useState("");
    const [customTitle, setCustomTitle] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [communityId, setCommunityId] = useState("");
    const [notes, setNotes] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        fetchTutorials()
            .then((list) => {
                setGuides(list);
                setGuidesState("ready");
            })
            .catch(() => setGuidesState("error"));
    }, []);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const guide = guides.find((g) => g.id === guideId);
    const hasWork = mode === "guide" ? Boolean(guide) : customTitle.trim().length >= 3 && customCategory !== "";
    const ready = hasWork && Boolean(photo) && Boolean(communityId);

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > MAX_MB * 1024 * 1024) {
            setError(`Ukuran foto maksimal ${MAX_MB} MB.`);
            return;
        }
        setError("");
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!ready || !photo) return;

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("proof_image", photo);
            if (notes.trim()) {
                formData.append("notes", notes.trim());
            }

            if (mode === "guide" && guideId) {
                formData.append("diy_guide_id", guideId);
            }

            await createSubmission(formData);
            setSent(true);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err?.message || "Gagal mengunggah karya. Pastikan koneksi internet stabil.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSent(false);
        setMode("guide");
        setGuideId("");
        setCustomTitle("");
        setCustomCategory("");
        setCommunityId("");
        setNotes("");
        setPhoto(null);
        setPreview(null);
    };

    if (sent) {
        return (
            <div className="mx-auto max-w-md rounded-xl border border-line bg-white p-8 text-center">
                <CircleCheck className="mx-auto size-14 text-leaf" aria-hidden />
                <h1 className="mt-4 font-serif text-2xl font-medium text-forest">Karya terkirim</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Karyamu berhasil tersimpan dan sedang menunggu validasi. Poin masuk setelah karya disetujui.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={onDone}
                        className="rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                    >
                        Lihat di Dampak Saya
                    </button>
                    <button
                        type="button"
                        onClick={reset}
                        className="rounded-xl border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                    >
                        Upload lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">Build It</p>
                <h1 className="mt-2 font-serif text-3xl font-medium text-forest sm:text-4xl">Upload karya</h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                    Pilih tutorial yang kamu ikuti atau tulis karyamu sendiri, lalu kirim foto hasilnya. Karya divalidasi dulu sebelum poin masuk.
                </p>
            </header>

            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
                <section>
                    <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border-2 border-dashed border-forest/30 bg-white">
                        {preview ? (
                            <Image src={preview} alt="Foto karya yang dipilih" fill unoptimized className="object-contain p-3" />
                        ) : (
                            <span className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted">
                                <ImagePlus className="size-8 text-leaf" aria-hidden />
                                <span className="font-semibold text-ink">Belum ada foto</span>
                                Foto hasil karyamu, maksimal {MAX_MB} MB
                            </span>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <label className={`${pickBtn} bg-forest text-white hover:bg-forest-deep md:hidden`}>
                            <Camera className="size-4" aria-hidden />
                            Ambil foto
                            <input type="file" accept="image/*" capture="environment" onChange={onPick} className="sr-only" />
                        </label>
                        <label className={`${pickBtn} border border-forest/30 text-forest hover:bg-mist md:bg-forest md:text-white md:hover:bg-forest-deep`}>
                            <ImagePlus className="size-4" aria-hidden />
                            Pilih dari galeri
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} className="sr-only" />
                        </label>
                    </div>
                </section>

                <section className="space-y-5">
                    <fieldset>
                        <legend className="text-sm font-semibold text-ink">Jenis karya</legend>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <ModeChoice value="guide" checked={mode === "guide"} onChange={() => setMode("guide")}>
                                <span className="block text-sm font-semibold text-ink">Dari tutorial</span>
                                <span className="mt-0.5 block text-xs leading-snug text-muted">
                                    Pilih tutorial yang sudah kamu kerjakan
                                </span>
                            </ModeChoice>
                            <ModeChoice value="custom" checked={mode === "custom"} onChange={() => setMode("custom")}>
                                <span className="block text-sm font-semibold text-ink">Tulis karyamu sendiri</span>
                                <span className="mt-0.5 block text-xs leading-snug text-muted">
                                    Karya hasil idemu sendiri
                                </span>
                            </ModeChoice>
                        </div>
                    </fieldset>

                    {mode === "guide" ? (
                        <Select
                            id="guide"
                            label="Karya yang kamu kerjakan"
                            value={guideId}
                            onChange={(e) => setGuideId(e.target.value)}
                            disabled={guidesState !== "ready"}
                            error={guidesState === "error" ? "Daftar tutorial gagal dimuat." : undefined}
                            hint={
                                guide
                                    ? `${guide.category}${guide.rewardPoints > 0 ? ` · +${guide.rewardPoints} poin kalau disetujui` : ""}`
                                    : undefined
                            }
                        >
                            <option value="">{guidesState === "loading" ? "Memuat karya..." : "Pilih karya"}</option>
                            {guides.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.title}
                                </option>
                            ))}
                        </Select>
                    ) : (
                        <div className="space-y-5">
                            <Input
                                id="custom-title"
                                label="Nama karyamu"
                                required
                                maxLength={80}
                                placeholder="Contoh: Lampu hias dari tutup botol"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                hint="Minimal 3 karakter"
                            />
                            <Select
                                id="custom-category"
                                label="Kategori bahan"
                                required
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                            >
                                <option value="">Pilih kategori</option>
                                {[...categories, "Lainnya"].map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    )}

                    <Select
                        id="community"
                        label="Komunitas yang dituju"
                        required
                        value={communityId}
                        onChange={(e) => setCommunityId(e.target.value)}
                    >
                        <option value="">Pilih komunitas</option>
                        {COMMUNITIES.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </Select>

                    <Textarea
                        id="notes"
                        label="Catatan (opsional)"
                        rows={4}
                        maxLength={MAX_NOTES}
                        placeholder="Ceritakan prosesnya, bahan yang dipakai, atau kendala yang kamu temui."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        hint={`${notes.length}/${MAX_NOTES}`}
                    />

                    {error && (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={!ready || loading}
                            className="flex items-center gap-2 rounded-xl bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {loading && <Loader2 className="size-4 animate-spin" />}
                            {loading ? "Mengirim..." : "Kirim karya"}
                        </button>
                    </div>
                </section>
            </form>
        </div>
    );
}