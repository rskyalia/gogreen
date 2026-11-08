"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
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
    TriangleAlert,
} from "lucide-react";
import { fetchTutorials, type Tutorial } from "@/lib/diy";

// ── Helpers ───────────────────────────────────────────────────────────────

const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function toggle(setter: Dispatch<SetStateAction<Set<string>>>, key: string) {
    setter((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
    });
}

/** Warna chip berdasarkan slug kategori */
function categoryTone(slug: string): string {
    const map: Record<string, string> = {
        plastik:  "bg-mint text-forest",
        logam:    "bg-mist text-forest",
        organik:  "bg-leaf text-white",
        kaca:     "bg-sun text-sun-ink",
        kertas:   "bg-forest text-mint",
        tekstil:  "bg-mist text-forest",
        kardus:   "bg-forest text-mint",
    };
    for (const key of Object.keys(map)) {
        if (slug.includes(key)) return map[key];
    }
    return "bg-mint text-forest";
}

// ── Cover image ───────────────────────────────────────────────────────────

function Cover({ t, className = "" }: { t: Tutorial; className?: string }) {
    const tone = categoryTone(t.categorySlug);
    return (
        <div className={`relative overflow-hidden ${className}`}>
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
                <div className={`absolute inset-0 ${tone}`}>
                    <span className="absolute -right-10 -top-10 size-40 rounded-full bg-white/25" />
                    <span className="absolute -bottom-12 -left-8 size-32 rounded-full bg-white/20" />
                </div>
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

// ── Difficulty badge ──────────────────────────────────────────────────────

function DiffBadge({ level }: { level: string }) {
    const cls: Record<string, string> = {
        Mudah:  "bg-mint text-forest",
        Sedang: "bg-sun text-sun-ink",
        Sulit:  "bg-mist text-leaf",
    };
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls[level] ?? "bg-mist text-forest"}`}>
            {level}
        </span>
    );
}

// ── Tutorial card ─────────────────────────────────────────────────────────

function TutorialCard({
    t, saved, onSave, onOpen,
}: {
    t: Tutorial; saved: boolean; onSave: () => void; onOpen: () => void;
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
                    aria-label={saved ? "Hapus dari tersimpan" : "Simpan panduan"}
                    className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-forest shadow-sm"
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
                    <button type="button" onClick={onOpen} className="text-left hover:underline">
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
                        Lihat panduan
                        <ArrowUpRight className="size-4" aria-hidden />
                    </button>
                </div>
            </div>
        </article>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
            <div className="aspect-[4/3] animate-pulse bg-mist" />
            <div className="space-y-3 p-5">
                <div className="flex items-center gap-2.5">
                    <div className="size-9 animate-pulse rounded-full bg-mist" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-28 animate-pulse rounded bg-mist" />
                        <div className="h-3 w-20 animate-pulse rounded bg-mist" />
                    </div>
                </div>
                <div className="h-5 w-3/4 animate-pulse rounded bg-mist" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-mist" />
            </div>
        </div>
    );
}

// ── Main view ─────────────────────────────────────────────────────────────

export default function DiyView({ initialId = null }: { initialId?: string | null }) {
    const [openId, setOpenId]   = useState<string | null>(initialId);
    const [query, setQuery]     = useState("");
    const [cat, setCat]         = useState("Semua");
    const [saved, setSaved]     = useState<Set<string>>(new Set());
    const [liked, setLiked]     = useState<Set<string>>(new Set());
    const [done, setDone]       = useState<Set<string>>(new Set());

    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [total, setTotal]         = useState(0);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchTutorials({ per_page: 50 });
            setTutorials(res.tutorials);
            setTotal(res.total);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal memuat panduan.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const open = (id: string | null) => {
        setOpenId(id);
        window.scrollTo({ top: 0 });
    };

    const t = openId ? tutorials.find((x) => x.id === openId) : undefined;

    // ── Error ─────────────────────────────────────────────────────────

    if (!loading && error) {
        return (
            <div className="rounded-[28px] border border-line bg-white p-10 text-center">
                <TriangleAlert className="mx-auto mb-4 size-8 text-muted" aria-hidden />
                <p className="text-sm text-muted">{error}</p>
                <button
                    type="button"
                    onClick={load}
                    className="mt-4 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                >
                    Coba lagi
                </button>
            </div>
        );
    }

    // ── Detail view ───────────────────────────────────────────────────

    if (t) {
        const doneCount = t.steps.filter((_, i) => done.has(`${t.id}:${i}`)).length;
        const percent   = t.steps.length ? Math.round((doneCount / t.steps.length) * 100) : 0;
        const related   = tutorials
            .filter((x) => x.id !== t.id)
            .sort((a, b) => Number(b.categorySlug === t.categorySlug) - Number(a.categorySlug === t.categorySlug))
            .slice(0, 3);

        return (
            <div className="space-y-8">
                <button type="button" onClick={() => open(null)} className="flex items-center gap-2 text-sm font-semibold text-forest">
                    <ArrowLeft className="size-4" aria-hidden />
                    Semua panduan
                </button>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <div className="relative">
                        <Cover t={t} className="aspect-[4/3] rounded-[28px]" />
                        <Pill className="absolute left-4 top-4">{t.category}</Pill>
                    </div>

                    <div className="self-start rounded-[28px] border border-line bg-white p-5 sm:p-8">
                        <div className="flex items-center gap-2.5">
                            <span className="grid size-9 place-items-center rounded-full bg-mint text-xs font-bold text-forest">
                                {initials(t.by)}
                            </span>
                            <span className="text-sm font-semibold text-ink">
                                {t.by}{" "}
                                <span className="font-normal text-muted">Kreator komunitas</span>
                            </span>
                        </div>
<<<<<<< Updated upstream
                        <h1 className="mt-4 font-serif text-2xl font-medium leading-tight text-forest sm:text-3xl">{t.title}</h1>
=======

                        <h1 className="mt-5 font-serif text-3xl font-medium leading-tight text-forest">{t.title}</h1>
>>>>>>> Stashed changes
                        <p className="mt-3 text-sm leading-relaxed text-muted">{t.summary}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium">
                            <DiffBadge level={t.level} />
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

                        <div className="mt-5 grid grid-cols-2 gap-3">
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

                {/* Alat dan bahan */}
                {t.materials.length > 0 && (
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
                )}

                {/* Langkah */}
                {t.steps.length > 0 && (
                    <section>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <h2 className="font-serif text-2xl font-medium text-forest">Langkah pembuatan</h2>
                            <p className="text-sm text-muted">{doneCount} dari {t.steps.length} selesai</p>
                        </div>
                        <div
                            className="mt-3 h-2 rounded-full bg-mist"
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Progres langkah"
                        >
                            <div className="h-full rounded-full bg-leaf transition-[width] duration-300" style={{ width: `${percent}%` }} />
                        </div>
                        <ol className="mt-4 space-y-3">
                            {t.steps.map((s, i) => {
                                const key = `${t.id}:${i}`;
                                const on  = done.has(key);
                                return (
                                    <li key={key}>
                                        <button
                                            type="button"
                                            onClick={() => toggle(setDone, key)}
                                            aria-pressed={on}
                                            className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${on ? "border-leaf/40 bg-mist" : "border-line bg-white hover:bg-mist/50"}`}
                                        >
                                            <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${on ? "bg-leaf text-white" : "bg-mint text-forest"}`}>
                                                {on ? <Check className="size-4" aria-hidden /> : String(i + 1).padStart(2, "0")}
                                            </span>
                                            <span className={`text-sm leading-relaxed ${on ? "text-muted line-through" : "text-ink"}`}>{s}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                )}

                {/* Tips */}
                {t.summary && t.steps.length > 0 && (
                    <aside className="flex items-start gap-4 rounded-2xl bg-sun p-5 text-sun-ink">
                        <Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden />
                        <div>
                            <p className="font-semibold">Tips singkat</p>
                            <p className="mt-1 text-sm leading-relaxed">{t.summary}</p>
                        </div>
                    </aside>
                )}

                {/* Related */}
                {related.length > 0 && (
                    <section>
                        <h2 className="font-serif text-2xl font-medium text-forest">Panduan lainnya</h2>
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

    // ── Daftar panduan ────────────────────────────────────────────────

    const categories = Array.from(new Set(tutorials.map((x) => x.category)));
    const q    = query.trim().toLowerCase();
    const shown = tutorials.filter((x) => {
        const inCat = cat === "Semua" || (cat === "Tersimpan" ? saved.has(x.id) : x.category === cat);
        const hay   = [x.title, x.by, x.category, ...x.materials].join(" ").toLowerCase();
        return inCat && (!q || hay.includes(q));
    });
    const chips = ["Semua", ...categories, "Tersimpan"];

    return (
        <div className="space-y-6">
            <header>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">Komunitas DIY</p>
                <h1 className="mt-2 font-serif text-3xl font-medium text-forest sm:text-4xl">
                    Cari ide, lalu buat sendiri
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    Jelajahi panduan dari komunitas. Cari berdasarkan material, simpan favoritmu, dan ikuti langkahnya.
                </p>
            </header>

<<<<<<< Updated upstream
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <label className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:max-w-sm">
=======
            {/* Search + filter */}
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-60 flex-1 items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:max-w-md">
>>>>>>> Stashed changes
                    <Search className="size-4 shrink-0 text-muted" aria-hidden />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari judul, kreator, atau material"
                        aria-label="Cari panduan DIY"
                        className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                    />
                </label>
                <ul className="flex flex-wrap gap-2" aria-label="Filter kategori">
                    {chips.map((c) => (
                        <li key={c}>
                            <button
                                type="button"
                                onClick={() => setCat(c)}
                                aria-pressed={cat === c}
<<<<<<< Updated upstream
                                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:py-2.5 sm:text-sm ${cat === c ? "border-forest bg-forest text-white" : "border-line bg-white text-ink hover:bg-mist"
                                    }`}
=======
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${cat === c ? "border-forest bg-forest text-white" : "border-line bg-white text-ink hover:bg-mist"}`}
>>>>>>> Stashed changes
                            >
                                {c === "Tersimpan" ? `Tersimpan (${saved.size})` : c}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Count */}
            {!loading && (
                <p className="text-xs text-muted" aria-live="polite">
                    Menampilkan {shown.length} dari {total} panduan
                </p>
            )}

            {/* Grid */}
            {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Memuat panduan...">
                    {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : shown.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-forest/30 bg-white p-10 text-center text-sm text-muted">
                    {tutorials.length === 0
                        ? "Belum ada panduan DIY yang dipublikasikan."
                        : "Tidak ada panduan yang cocok. Coba kata kunci atau filter lain."}
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
