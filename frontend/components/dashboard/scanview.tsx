"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowUpRight,
    Camera,
    Clock,
    ImagePlus,
    Leaf,
    Lightbulb,
    MapPin,
    Recycle,
    RotateCcw,
    Sparkles,
    Trash2,
    Users,
    type LucideIcon,
} from "lucide-react";
import { getTutorial } from "@/lib/tutorials";
import AiRecommendationPanel from "./AiRecommendationPanel";

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

const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/** Judul kolom hasil (dipakai untuk kolom AI dan kolom Komunitas) */
function ColumnHeading({
    icon: Icon,
    title,
    note,
}: {
    icon: LucideIcon;
    title: string;
    note: string;
}) {
    return (
        <div className="mb-3 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint text-forest">
                <Icon className="size-4" aria-hidden />
            </span>
            <div className="leading-tight">
                <h2 className="font-serif text-xl font-medium text-forest">{title}</h2>
                <p className="text-xs text-muted">{note}</p>
            </div>
        </div>
    );
}

type TutorialItem = NonNullable<ReturnType<typeof getTutorial>>;

function CommunityTutorialCard({ tutorial, onOpen }: { tutorial: TutorialItem; onOpen: () => void }) {
    const extra = tutorial.materials.length - 4;

    return (
        <article className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className={`relative grid h-36 place-items-center overflow-hidden ${tutorial.tone}`}>
                {tutorial.image ? (
                    <Image
                        src={tutorial.image}
                        alt=""
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 420px, 100vw"
                        className="object-cover"
                    />
                ) : (
                    <tutorial.Icon className="size-14 opacity-70" strokeWidth={1.25} aria-hidden />
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-forest">
                    {tutorial.category}
                </span>
            </div>

            <div className="space-y-4 p-5">
                <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-full bg-mint text-[11px] font-bold text-forest">
                        {initials(tutorial.by)}
                    </span>
                    <span className="leading-tight">
                        <span className="block text-sm font-semibold text-ink">{tutorial.by}</span>
                        <span className="block text-xs text-muted">Kreator komunitas</span>
                    </span>
                </div>

                <div>
                    <h3 className="font-serif text-xl font-medium leading-snug text-forest">{tutorial.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{tutorial.summary}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                    <span className="rounded-full bg-mint px-3 py-1 font-semibold text-forest">{tutorial.level}</span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden />
                        {tutorial.time}
                    </span>
                    <span>{tutorial.steps.length} langkah</span>
                </div>

                <ul className="flex flex-wrap gap-1.5" aria-label="Bahan">
                    {tutorial.materials.slice(0, 4).map((m) => (
                        <li key={m} className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink">
                            {m}
                        </li>
                    ))}
                    {extra > 0 && (
                        <li className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-muted">+{extra} lagi</li>
                    )}
                </ul>

                <button
                    type="button"
                    onClick={onOpen}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                >
                    Buka tutorial
                    <ArrowUpRight className="size-4" aria-hidden />
                </button>
            </div>
        </article>
    );
}

export default function ScanView({ onOpenTutorial }: { onOpenTutorial: (id: string) => void }) {
    const [preview, setPreview] = useState<string | null>(null);
    const [kind, setKind] = useState<Kind | null>(null);
    const [cond, setCond] = useState<Condition | null>(null);
    const [shown, setShown] = useState(false);
    // Key dipakai untuk reset AiRecommendationPanel saat scan baru dimulai
    const [aiKey, setAiKey] = useState(0);
    const resultRef = useRef<HTMLElement>(null);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    // Geser layar ke hasil setelah "Lihat potensi olahan" diklik
    useEffect(() => {
        if (!shown) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, [shown]);

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            setShown(false);
            setAiKey((k) => k + 1);
        }
        e.target.value = ""; // supaya foto yang sama bisa dipilih lagi
    };

    const reset = () => {
        setPreview(null);
        setKind(null);
        setCond(null);
        setShown(false);
        setAiKey((k) => k + 1);
    };

    const ready = Boolean(preview && kind && cond);
    const potential = kind && cond ? getPotential(kind, cond) : null;
    const tutorial = potential?.tutorialId ? getTutorial(potential.tutorialId) : undefined;

    const showAi = kind !== "residu";
    const showBank = kind !== "organik";

    /** Mapping kind → waste_type untuk API AI */
    const aiWasteType = kind === "organik" ? "organic" : kind === "residu" ? "residue" : "recyclable";

    /** Nama objek deskriptif untuk AI berdasarkan pilihan user */
    const aiObjectName =
        kind === "organik"
            ? "sisa organik (sayur/buah)"
            : kind === "residu"
              ? "sampah residu"
              : cond === "bersih"
                ? "botol/galon plastik bersih"
                : cond === "kotor"
                  ? "botol/galon plastik kotor"
                  : "bahan daur ulang rusak";

    /** Material sampah untuk AI */
    const aiMaterial =
        kind === "organik" ? "organik" : kind === "residu" ? "campuran" : "plastik";

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
                </section>
            </div>

            {/* Hasil: ringkasan potensi di atas, lalu tutorial AI + Komunitas DIY berdampingan */}
            {shown && potential && (
                <section ref={resultRef} className="scroll-mt-20 space-y-6">
                    <div
                        aria-live="polite"
                        className="flex flex-col gap-5 rounded-[28px] border border-line bg-mint p-6 sm:p-8 md:flex-row md:items-center md:justify-between"
                    >
                        <div className="flex items-start gap-4">
                            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-forest">
                                <Lightbulb className="size-5" aria-hidden />
                            </span>
                            <div className="max-w-2xl">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-leaf">Potensi olahan</p>
                                <h2 className="mt-1 font-serif text-2xl font-medium leading-snug text-forest">{potential.title}</h2>
                                <p className="mt-2 text-sm leading-relaxed text-ink/80">{potential.text}</p>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3">
                            {showBank && (
                                <Link
                                    href="/waste-banks"
                                    className={
                                        tutorial
                                            ? "flex items-center gap-1.5 rounded-xl border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-white/60"
                                            : "flex items-center gap-1.5 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                                    }
                                >
                                    <MapPin className="size-4" aria-hidden />
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

                    {(showAi || tutorial) && (
                        <div className={`grid items-start gap-6 ${showAi && tutorial ? "lg:grid-cols-2" : ""}`}>
                            {showAi && (
                                <div>
                                    <ColumnHeading icon={Sparkles} title="Ide dari AI" note="Dibuat otomatis oleh Gemini" />
                                    <AiRecommendationPanel
                                        key={aiKey}
                                        objectName={aiObjectName}
                                        material={aiMaterial}
                                        wasteType={aiWasteType}
                                    />
                                </div>
                            )}

                            {tutorial && (
                                // Di HP tampil lebih dulu (singkat), di desktop berada di kanan
                                <div className="order-first lg:order-none">
                                    <ColumnHeading icon={Users} title="Dari Komunitas DIY" note="Tutorial dari kreator komunitas" />
                                    <CommunityTutorialCard tutorial={tutorial} onOpen={() => onOpenTutorial(tutorial.id)} />
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}