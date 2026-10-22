"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import {
    ArrowLeft,
    ArrowUpRight,
    Award,
    Bookmark,
    Check,
    Clock,
    Heart,
    Lightbulb,
    Search,
} from "lucide-react";
import { firstError } from "@/lib/api";
import { fetchTutorials, type Tutorial } from "@/lib/diy";

const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function toggle(setter: Dispatch<SetStateAction<Set<string>>>, key: string) {
    setter((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    });
}

function Cover({ t, className = "" }: { t: Tutorial; className?: string }) {
    return (
        <div className={`relative overflow-hidden ${t.tone} ${className}`}>
            {t.image ? (
                <Image
                    src={t.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 420px, 100vw"
                    className="object-cover"
                />
            ) : (
                <>
                    <span className="absolute -right-10 -top-10 size-40 rounded-full bg-white/25" />
                    <span className="absolute -bottom-12 -left-8 size-32 rounded-full bg-white/20" />
                    <t.Icon
                        className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 opacity-70"
                        strokeWidth={1.25}
                        aria-hidden
                    />
                </>
            )}
        </div>
    );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={`rounded-full bg-white px-3 py-1 text-xs font-semibold text-forest ${className}`}>
            {children}
        </span>
    );
}

function TutorialCard({
    t,
    saved,
    onSave,
    onOpen,
}: {
    t: Tutorial;
    saved: boolean;
    onSave: () => void;
    onOpen: () => void;
}) {
    return (
        <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-forest/5">
            <div className="relative">
                <button type="button" onClick={onOpen} aria-label={`Buka ${t.title}`} className="block w-full">
                    <Cover t={t} className="aspect-[4/3]" />
                </button>
                <Pill className="pointer-events-none absolute left-3 top-3">{t.category}</Pill>
                <Pill className="pointer-events-none absolute bottom-3 left-3">{t.level}</Pill>
                <button
                    type="button"
                    onClick={onSave}
                    aria-pressed={saved}
                    aria-label={saved ? "Hapus dari tersimpan" : "Simpan tutorial"}
                    className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-forest"
                >
                    <Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} aria-hidden />
                </button>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-full bg-mint text-xs font-bold text-forest">
                        {initials(t.by)}
                    </span>
                    <span className="leading-tight">
                        <span className="block text-sm font-semibold text-ink">{t.by}</span>
                        <span className="block text-xs text-muted">Kreator komunitas</span>
                    </span>
                </div>

                <h3 className="mt-4 font-serif text-xl font-medium leading-snug text-forest">
                    <button type="button" onClick={onOpen} className="text-left">
                        {t.title}
                    </button>
                </h3>

                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden />
                        {t.time}
                    </span>
                    {t.rewardPoints > 0 && (
                        <span className="flex items-center gap-1.5">
                            <Award className="size-3.5" aria-hidden />
                            +{t.rewardPoints} poin
                        </span>
                    )}
                </div>

                <div className="mt-auto pt-4">
                    <button
                        type="button"
                        onClick={onOpen}
                        className="flex w-full items-center justify-between border-t border-line pt-4 text-sm font-semibold text-forest"
                    >
                        Lihat tutorial
                        <ArrowUpRight className="size-4" aria-hidden />
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function DiyView({ initialId = null }: { initialId?: string | null }) {
    const [openId, setOpenId] = useState<string | null>(initialId);
    const [query, setQuery] = useState("");
    const [cat, setCat] = useState<string>("Semua");
    const [saved, setSaved] = useState<Set<string>>(new Set());
    const [liked, setLiked] = useState<Set<string>>(new Set());
    const [done, setDone] = useState<Set<string>>(new Set());

    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let alive = true;
        fetchTutorials()
            .then((data) => {
                if (alive) {
                    setTutorials(data);
                    setError(null);
                }
            })
            .catch((e) => {
                if (alive) setError(firstError(e, "Gagal memuat tutorial."));
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [reload]);

    const retry = () => {
        setLoading(true);
        setError(null);
        setReload((n) => n + 1);
    };

    const open = (id: string | null) => {
        setOpenId(id);
        window.scrollTo({ top: 0 });
    };

    const t = openId ? tutorials.find((x) => x.id === openId) : undefined;

    /* ---------- loading & error ---------- */
    if (loading) {
        return (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-80 animate-pulse rounded-3xl border border-line bg-mist" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[28px] border border-line bg-white p-10 text-center">
                <p className="text-sm text-muted">{error}</p>
                <button
                    type="button"
                    onClick={retry}
                    className="mt-4 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white"
                >
                    Coba lagi
                </button>
            </div>
        );
    }

    /* ---------- detail ---------- */
    if (t) {
        const doneCount = t.steps.filter((_, i) => done.has(`${t.id}:${i}`)).length;
        const percent = t.steps.length ? Math.round((doneCount / t.steps.length) * 100) : 0;
        const related = tutorials
            .filter((x) => x.id !== t.id)
            .sort((a, b) => Number(b.category === t.category) - Number(a.category === t.category))
            .slice(0, 3);

        return (
            <div className="space-y-8">
                <button type="button" onClick={() => open(null)} className="flex items-center gap-2 text-sm font-semibold text-forest">
                    <ArrowLeft className="size-4" aria-hidden />
                    Semua tutorial
                </button>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <div className="relative">
                        <Cover t={t} className="aspect-[4/3] rounded-[28px]" />
                        <Pill className="absolute left-4 top-4">{t.category}</Pill>
                    </div>

                    <div className="self-start rounded-[28px] border border-line bg-white p-6 sm:p-8">
                        <div className="flex items-center gap-2.5">
                            <span className="grid size-9 place-items-center rounded-full bg-mint text-xs font-bold text-forest">
                                {initials(t.by)}
                            </span>
                            <span className="text-sm font-semibold text-ink">
                                {t.by} <span className="font-normal text-muted">Kreator komunitas</span>
                            </span>
                        </div>
                        <h1 className="mt-5 font-serif text-3xl font-medium leading-tight text-forest">{t.title}</h1>
                        <p className="mt-3 text-sm leading-relaxed text-muted">{t.summary}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium">
                            <span className="rounded-full bg-mint px-3 py-1 text-forest">{t.level}</span>
                            <span className="flex items-center gap-1.5 text-muted">
                                <Clock className="size-3.5" aria-hidden />
                                {t.time}
                            </span>
                            {t.rewardPoints > 0 && (
                                <span className="flex items-center gap-1.5 text-muted">
                                    <Award className="size-3.5" aria-hidden />
                                    +{t.rewardPoints} poin
                                </span>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => toggle(setLiked, t.id)}
                                aria-pressed={liked.has(t.id)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                            >
                                <Heart className={`size-4 ${liked.has(t.id) ? "fill-current" : ""}`} aria-hidden />
                                {liked.has(t.id) ? "Disukai" : "Suka"}
                            </button>
                            <button
                                type="button"
                                onClick={() => toggle(setSaved, t.id)}
                                aria-pressed={saved.has(t.id)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                            >
                                <Bookmark className={`size-4 ${saved.has(t.id) ? "fill-current" : ""}`} aria-hidden />
                                {saved.has(t.id) ? "Tersimpan" : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>

                <section>
                    <h2 className="font-serif text-2xl font-medium text-forest">Alat dan bahan</h2>
                    <ul className="mt-4 flex flex-wrap gap-2">
                        {t.materials.map((m) => (
                            <li key={m} className="flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm text-forest">
                                <Check className="size-4" aria-hidden />
                                {m}
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <h2 className="font-serif text-2xl font-medium text-forest">Langkah pembuatan</h2>
                        <p className="text-sm text-muted">
                            {doneCount} dari {t.steps.length} langkah selesai
                        </p>
                    </div>
                    <div
                        className="mt-3 h-2 rounded-full bg-mist"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Progres langkah"
                    >
                        <div className="h-full rounded-full bg-leaf transition-[width]" style={{ width: `${percent}%` }} />
                    </div>

                    <ol className="mt-4 space-y-3">
                        {t.steps.map((s, i) => {
                            const key = `${t.id}:${i}`;
                            const on = done.has(key);
                            return (
                                <li key={key}>
                                    <button
                                        type="button"
                                        onClick={() => toggle(setDone, key)}
                                        aria-pressed={on}
                                        className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${on ? "border-leaf/40 bg-mist" : "border-line bg-white hover:bg-mist/50"
                                            }`}
                                    >
                                        <span
                                            className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${on ? "bg-leaf text-white" : "bg-mint text-forest"
                                                }`}
                                        >
                                            {on ? <Check className="size-4" aria-hidden /> : String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className={`text-sm leading-relaxed ${on ? "text-muted line-through" : "text-ink"}`}>{s}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </section>

                {t.tip && (
                    <aside className="flex items-start gap-4 rounded-2xl bg-sun p-5 text-sun-ink">
                        <Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden />
                        <div>
                            <p className="font-semibold">Tips singkat</p>
                            <p className="mt-1 text-sm leading-relaxed">{t.tip}</p>
                        </div>
                    </aside>
                )}

                {related.length > 0 && (
                    <section>
                        <h2 className="font-serif text-2xl font-medium text-forest">Tutorial lainnya</h2>
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((x) => (
                                <TutorialCard
                                    key={x.id}
                                    t={x}
                                    saved={saved.has(x.id)}
                                    onSave={() => toggle(setSaved, x.id)}
                                    onOpen={() => open(x.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        );
    }

    /* ---------- daftar ---------- */
    const categories = Array.from(new Set(tutorials.map((x) => x.category)));
    const q = query.trim().toLowerCase();
    const shown = tutorials.filter((x) => {
        const inCat = cat === "Semua" || (cat === "Tersimpan" ? saved.has(x.id) : x.category === cat);
        const hay = [x.title, x.by, x.category, ...x.materials].join(" ").toLowerCase();
        return inCat && (!q || hay.includes(q));
    });
    const chips = ["Semua", ...categories, "Tersimpan"];

    return (
        <div className="space-y-6">
            <header>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">Komunitas DIY</p>
                <h1 className="mt-2 font-serif text-3xl font-medium text-forest sm:text-4xl">Cari ide, lalu buat sendiri</h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    Jelajahi tutorial dari komunitas. Cari berdasarkan material, simpan favoritmu, dan ikuti langkahnya satu per satu.
                </p>
            </header>

            <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-60 flex-1 items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:max-w-md">
                    <Search className="size-4 shrink-0 text-muted" aria-hidden />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari judul, kreator, atau material"
                        aria-label="Cari tutorial"
                        className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                    />
                </label>
                <ul className="flex flex-wrap gap-2" aria-label="Filter material">
                    {chips.map((c) => (
                        <li key={c}>
                            <button
                                type="button"
                                onClick={() => setCat(c)}
                                aria-pressed={cat === c}
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${cat === c ? "border-forest bg-forest text-white" : "border-line bg-white text-ink hover:bg-mist"
                                    }`}
                            >
                                {c === "Tersimpan" ? `Tersimpan (${saved.size})` : c}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <p className="text-xs text-muted" aria-live="polite">
                Menampilkan {shown.length} dari {tutorials.length} tutorial
            </p>

            {shown.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-forest/30 bg-white p-10 text-center text-sm text-muted">
                    Belum ada tutorial yang cocok. Coba kata kunci atau filter lain.
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {shown.map((x) => (
                        <TutorialCard
                            key={x.id}
                            t={x}
                            saved={saved.has(x.id)}
                            onSave={() => toggle(setSaved, x.id)}
                            onOpen={() => open(x.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}