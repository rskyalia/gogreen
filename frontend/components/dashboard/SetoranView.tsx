"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { Camera, CircleCheck, ImagePlus } from "lucide-react";
import { fetchTutorials, type Tutorial } from "@/lib/diy";
import type { Submission } from "@/lib/submissons";

const MAX_MB = 5;

const pickBtn =
    "flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-leaf";

export default function UploadView({
    onSubmit,
    onDone,
}: {
    onSubmit: (s: Submission) => void;
    onDone: () => void;
}) {
    const [guides, setGuides] = useState<Tutorial[]>([]);
    const [guidesState, setGuidesState] = useState<"loading" | "ready" | "error">("loading");
    const [guideId, setGuideId] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
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

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!guide || !photo) return;
        onSubmit({
            id: `local-${Date.now()}`,
            guideId: guide.id,
            status: "pending",
            title: guide.title,
            category: guide.category,
            image: URL.createObjectURL(photo), // URL terpisah dari preview supaya tidak ikut dicabut
            createdAt: new Date().toISOString(),
            pointsAwarded: 0,
            rewardPoints: guide.rewardPoints,
            reviewNote: null,
            Icon: guide.Icon,
            tone: guide.tone,
        });
        setSent(true);
    };

    const reset = () => {
        setSent(false);
        setGuideId("");
        setPhoto(null);
        setPreview(null);
    };

    if (sent) {
        return (
            <div className="mx-auto max-w-md rounded-xl border border-line bg-white p-8 text-center">
                <CircleCheck className="mx-auto size-14 text-leaf" aria-hidden />
                <h1 className="mt-4 font-serif text-2xl font-medium text-forest">Karya terkirim</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Karyamu sedang menunggu validasi. Poin masuk setelah karya disetujui.
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
                    Pilih tutorial yang kamu kerjakan, lalu kirim foto hasilnya. Karya divalidasi dulu sebelum poin masuk.
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
                    <div>
                        <label htmlFor="guide" className="block text-sm font-semibold text-ink">
                            Tutorial yang kamu kerjakan
                        </label>
                        <select
                            id="guide"
                            value={guideId}
                            onChange={(e) => setGuideId(e.target.value)}
                            disabled={guidesState !== "ready"}
                            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink disabled:opacity-60"
                        >
                            <option value="">
                                {guidesState === "loading" ? "Memuat tutorial..." : "Pilih tutorial"}
                            </option>
                            {guides.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.title}
                                </option>
                            ))}
                        </select>
                        {guidesState === "error" && (
                            <p className="mt-2 text-xs text-red-700">Daftar tutorial gagal dimuat. Coba muat ulang halaman.</p>
                        )}
                        {guide && (
                            <p className="mt-2 text-xs text-muted">
                                {guide.category}
                                {guide.rewardPoints > 0 && ` · +${guide.rewardPoints} poin kalau disetujui`}
                            </p>
                        )}
                    </div>

                    {error && (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!guideId || !photo}
                        className="rounded-xl bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Kirim karya
                    </button>
                    {(!guideId || !photo) && (
                        <p className="text-xs text-muted">Pilih tutorial dan foto karya dulu.</p>
                    )}
                </section>
            </form>
        </div>
    );
}