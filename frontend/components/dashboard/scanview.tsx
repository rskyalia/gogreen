"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Camera,
    ImagePlus,
    Leaf,
    Lightbulb,
    Recycle,
    RotateCcw,
    Trash2,
    type LucideIcon,
} from "lucide-react";
import { getTutorial } from "@/lib/tutorials";

type Kind = "daur-ulang" | "organik" | "residu";
type Condition = "bersih" | "kotor" | "rusak";

const kinds: { key: Kind; label: string; hint: string; Icon: LucideIcon }[] = [
    { key: "daur-ulang", label: "Daur ulang", hint: "Botol, galon, kaleng, kardus", Icon: Recycle },
    { key: "organik", label: "Organik", hint: "Sisa sayur, kulit buah", Icon: Leaf },
    { key: "residu", label: "Residu", hint: "Tisu bekas, bungkus berminyak", Icon: Trash2 },
];

const conditions: { key: Condition; label: string; hint: string }[] = [
    { key: "bersih", label: "Bersih", hint: "Siap diolah" },
    { key: "kotor", label: "Kotor", hint: "Perlu dicuci" },
    { key: "rusak", label: "Rusak", hint: "Retak, sobek, atau busuk" },
];

type Potential = { title: string; text: string; tutorialId?: string };

function getPotential(kind: Kind, cond: Condition): Potential {
    if (kind === "residu") {
        return {
            title: "Belum ada potensi olahan",
            text: "Sampah residu sulit diolah ulang. Pisahkan dari sampah lain dan buang ke tempat sampah residu supaya tidak mengotori bahan yang masih bisa dimanfaatkan.",
        };
    }
    if (kind === "organik") {
        return {
            title: "Bisa jadi kompos",
            text:
                cond === "rusak"
                    ? "Sampah organik yang sudah busuk tetap cocok untuk kompos. Campur dengan daun kering atau tanah supaya tidak terlalu basah."
                    : "Sisa organik bisa diolah jadi kompos untuk pupuk tanaman. Potong kecil-kecil dan campur dengan daun kering atau tanah.",
            tutorialId: "organik",
        };
    }
    if (cond === "rusak") {
        return {
            title: "Kurang cocok untuk kerajinan",
            text: "Bahan yang retak atau sobek sulit dipakai ulang dan berisiko saat diolah. Sebaiknya setor ke bank sampah agar didaur ulang.",
        };
    }
    if (cond === "kotor") {
        return {
            title: "Cuci dulu, lalu bisa jadi pot tanaman",
            text: "Bilas dan keringkan bahannya lebih dulu. Setelah bersih, galon atau botol bekas bisa dijadikan pot tanaman.",
            tutorialId: "galon",
        };
    }
    return {
        title: "Bisa jadi pot tanaman",
        text: "Bahan yang bersih dan utuh siap diolah. Galon atau botol bekas bisa dijadikan pot tanaman dengan langkah sederhana.",
        tutorialId: "galon",
    };
}

function Choice({
    name,
    value,
    checked,
    onChange,
    children,
}: {
    name: string;
    value: string;
    checked: boolean;
    onChange: () => void;
    children: ReactNode;
}) {
    return (
        <label className="relative block cursor-pointer">
            <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
            <span className="block h-full rounded-2xl border border-line bg-white p-4 transition-colors hover:bg-mist/60 peer-checked:border-forest peer-checked:bg-mist peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf">
                {children}
            </span>
        </label>
    );
}

const pickBtn =
    "flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-leaf";

export default function ScanView({ onOpenTutorial }: { onOpenTutorial: (id: string) => void }) {
    const [preview, setPreview] = useState<string | null>(null);
    const [kind, setKind] = useState<Kind | null>(null);
    const [cond, setCond] = useState<Condition | null>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            setShown(false);
        }
        e.target.value = ""; // supaya foto yang sama bisa dipilih lagi
    };

    const reset = () => {
        setPreview(null);
        setKind(null);
        setCond(null);
        setShown(false);
    };

    const ready = Boolean(preview && kind && cond);
    const potential = kind && cond ? getPotential(kind, cond) : null;
    const tutorial = potential?.tutorialId ? getTutorial(potential.tutorialId) : undefined;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-serif text-3xl font-medium text-forest sm:text-4xl">Scan sampah</h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                    Foto sampahmu, tentukan jenis dan kondisinya, lalu lihat apa yang bisa dibuat darinya.
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <section>
                    <div className="relative grid aspect-3/4 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-forest/30 bg-white lg:aspect-4/3">
                        {preview ? (
                            <Image src={preview} alt="Foto sampah yang dipilih" fill unoptimized className="object-contain p-3" />
                        ) : (
                            <span className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted">
                                <ImagePlus className="size-8 text-leaf" aria-hidden />
                                <span className="font-semibold text-ink">Belum ada foto</span>
                                Ambil foto atau pilih dari galeri
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
                            <input type="file" accept="image/*" onChange={onPick} className="sr-only" />
                        </label>
                    </div>
                </section>

                <section className="space-y-6">
                    <fieldset>
                        <legend className="text-sm font-semibold text-ink">Jenis sampah</legend>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {kinds.map(({ key, label, hint, Icon }) => (
                                <Choice
                                    key={key}
                                    name="kind"
                                    value={key}
                                    checked={kind === key}
                                    onChange={() => {
                                        setKind(key);
                                        setShown(false);
                                    }}
                                >
                                    <Icon className="size-5 text-leaf" aria-hidden />
                                    <span className="mt-2 block text-sm font-semibold text-ink">{label}</span>
                                    <span className="mt-0.5 block text-xs leading-snug text-muted">{hint}</span>
                                </Choice>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-sm font-semibold text-ink">Kondisi</legend>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {conditions.map(({ key, label, hint }) => (
                                <Choice
                                    key={key}
                                    name="condition"
                                    value={key}
                                    checked={cond === key}
                                    onChange={() => {
                                        setCond(key);
                                        setShown(false);
                                    }}
                                >
                                    <span className="block text-sm font-semibold text-ink">{label}</span>
                                    <span className="mt-0.5 block text-xs leading-snug text-muted">{hint}</span>
                                </Choice>
                            ))}
                        </div>
                    </fieldset>

                    <div>
                        <button
                            type="button"
                            disabled={!ready}
                            onClick={() => setShown(true)}
                            className="flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Lightbulb className="size-4" aria-hidden />
                            Lihat potensi olahan
                        </button>
                        {!ready && (
                            <p className="mt-2 text-xs text-muted">Lengkapi foto, jenis sampah, dan kondisinya dulu.</p>
                        )}
                    </div>

                    {shown && potential && (
                        <div aria-live="polite" className="rounded-[28px] border border-line bg-mint p-6">
                            <span className="grid size-10 place-items-center rounded-full bg-white text-forest">
                                <Lightbulb className="size-5" aria-hidden />
                            </span>
                            <h2 className="mt-4 font-serif text-2xl font-medium leading-snug text-forest">{potential.title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-ink/80">{potential.text}</p>
                            {tutorial && (
                                <p className="mt-3 text-xs text-ink/70">Tutorial: {tutorial.title}</p>
                            )}

                            <div className="mt-5 flex flex-wrap gap-3">
                                {tutorial ? (
                                    <button
                                        type="button"
                                        onClick={() => onOpenTutorial(tutorial.id)}
                                        className="rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                                    >
                                        Buka tutorial
                                    </button>
                                ) : (
                                    <Link
                                        href="/#bank-sampah"
                                        className="rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                                    >
                                        Cari bank sampah
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="flex items-center gap-2 rounded-xl border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-white/60"
                                >
                                    <RotateCcw className="size-4" aria-hidden />
                                    Scan lagi
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}