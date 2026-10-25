"use client";

import { useEffect, useState } from "react";
import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    RotateCcw,
    Sparkles,
    Wand2,
    Wrench,
    Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

interface CraftRecommendation {
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    materials: string[];
    steps: string[];
    tips: string;
}

interface AiRecommendationResult {
    summary: string;
    recommendations: CraftRecommendation[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

const DIFFICULTY_LABEL: Record<string, { label: string; className: string }> = {
    easy:   { label: "Mudah",  className: "bg-mint text-forest"    },
    medium: { label: "Sedang", className: "bg-sun text-sun-ink"    },
    hard:   { label: "Sulit",  className: "bg-mist text-leaf"      },
};

function buildPrompt(objectName: string, material: string, wasteType: string): string {
    const wasteTypeLabel =
        wasteType === "organic"
            ? "organik"
            : wasteType === "residue"
              ? "residu"
              : "daur ulang (recyclable)";

    return `Kamu adalah asisten kreatif daur ulang sampah. Berikan 3 rekomendasi karya/kerajinan kreatif yang bisa dibuat dari sampah berikut:

Objek terdeteksi: ${objectName}
Material: ${material}
Jenis sampah: ${wasteTypeLabel}

Berikan respons HANYA dalam format JSON berikut (tanpa penjelasan lain):
{
  "summary": "Satu kalimat ringkasan potensi olahan dari sampah ini",
  "recommendations": [
    {
      "title": "Nama karya yang menarik",
      "description": "Penjelasan 1-2 kalimat tentang karya ini dan manfaatnya",
      "difficulty": "easy|medium|hard",
      "materials": ["bahan tambahan 1", "bahan tambahan 2"],
      "steps": ["langkah 1", "langkah 2", "langkah 3"],
      "tips": "Satu tips agar hasilnya maksimal"
    }
  ]
}

Catatan:
- Gunakan Bahasa Indonesia yang ringan dan mudah dipahami
- Karya harus realistis bisa dibuat di rumah tanpa alat khusus
- Difficulty: easy = mudah (< 30 menit), medium = sedang (1-2 jam), hard = butuh keterampilan lebih
- steps maksimal 5 langkah singkat per karya
- Prioritaskan karya yang paling bermanfaat dan populer di Indonesia`;
}

async function fetchFromGemini(
    objectName: string,
    material: string,
    wasteType: string,
): Promise<AiRecommendationResult> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY belum dikonfigurasi.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(objectName, material, wasteType) }] }],
            generationConfig: {
                maxOutputTokens: 1500,
            },
        }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
        throw new Error(`AI API error: ${msg}`);
    }

    const body = await res.json();
    const finishReason = body?.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
        throw new Error(`AI menolak permintaan (${finishReason}). Silakan coba lagi.`);
    }

    // Gemini 3.x punya beberapa parts: thought + text — gabungkan semuanya
    const parts: Array<{ text?: string }> = body?.candidates?.[0]?.content?.parts ?? [];
    const rawText: string = parts.map((p) => p.text ?? "").join("").trim();
    if (!rawText) {
        const blockReason = body?.promptFeedback?.blockReason;
        throw new Error(
            blockReason
                ? `AI memblokir permintaan: ${blockReason}`
                : "AI tidak mengembalikan respons. Silakan coba lagi.",
        );
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Respons AI tidak valid. Silakan coba lagi.");

    let parsed: AiRecommendationResult;
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch {
        throw new Error("Respons AI tidak valid. Silakan coba lagi.");
    }

    if (!parsed.recommendations?.length) {
        throw new Error("AI tidak memberikan rekomendasi. Silakan coba lagi.");
    }

    return {
        summary: parsed.summary ?? "",
        recommendations: parsed.recommendations.slice(0, 3),
    };
}

// ── Loading AI ─────────────────────────────────────────────────────────────

const AI_STEPS = [
    { icon: Zap,      text: "Menganalisis jenis sampah…"     },
    { icon: Wand2,    text: "Merancang ide kreatif…"          },
    { icon: Sparkles, text: "Menyusun langkah pembuatan…"     },
];

function AiLoadingState() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setStep((s) => (s < AI_STEPS.length - 1 ? s + 1 : s));
        }, 1400);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {/* Header gradient bar */}
            <div className="relative h-1.5 w-full overflow-hidden bg-mist">
                <div className="animate-shimmer absolute inset-0" />
            </div>

            <div className="p-6">
                {/* Icon orbit + label */}
                <div className="flex items-center gap-5">
                    {/* Orbital icon */}
                    <div className="relative flex size-14 shrink-0 items-center justify-center">
                        {/* Ring */}
                        <span className="absolute inset-0 rounded-full border-2 border-dashed border-mint opacity-80" />
                        {/* Center */}
                        <span className="grid size-8 place-items-center rounded-full bg-forest text-mint">
                            <Sparkles className="size-4 animate-ai-pulse" aria-hidden />
                        </span>
                        {/* Orbiting dots */}
                        <span className="animate-orbit-1 absolute size-2 rounded-full bg-leaf" />
                        <span className="animate-orbit-2 absolute size-2 rounded-full bg-leaf/70" />
                        <span className="animate-orbit-3 absolute size-2 rounded-full bg-leaf/40" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-forest">
                            AI sedang bekerja
                            <span className="ml-1 inline-flex gap-0.5 align-middle">
                                <span className="dot-1 inline-block size-1.5 rounded-full bg-leaf" />
                                <span className="dot-2 inline-block size-1.5 rounded-full bg-leaf" />
                                <span className="dot-3 inline-block size-1.5 rounded-full bg-leaf" />
                            </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                            Gemini AI sedang menganalisis & membuat ide daur ulang untukmu
                        </p>
                    </div>
                </div>

                {/* Step progress */}
                <div className="mt-5 space-y-2">
                    {AI_STEPS.map(({ icon: Icon, text }, i) => {
                        const done    = i < step;
                        const active  = i === step;
                        return (
                            <div
                                key={text}
                                className={[
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-500",
                                    active  ? "animate-step-fade bg-mint text-forest font-semibold" : "",
                                    done    ? "text-muted" : "",
                                    !active && !done ? "text-line" : "",
                                ].join(" ")}
                            >
                                <span
                                    className={[
                                        "grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-all duration-500",
                                        active  ? "bg-forest text-white" : "",
                                        done    ? "bg-mist text-leaf"   : "",
                                        !active && !done ? "bg-mist/40 text-muted" : "",
                                    ].join(" ")}
                                >
                                    {done ? "✓" : <Icon className="size-3" />}
                                </span>
                                {text}
                            </div>
                        );
                    })}
                </div>

                {/* Shimmer cards */}
                <div className="mt-5 space-y-3">
                    {[100, 75, 55].map((w, i) => (
                        <div
                            key={i}
                            className="overflow-hidden rounded-xl border border-line"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        >
                            <div className="flex items-center gap-3 p-4">
                                <div className="animate-shimmer size-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div
                                        className="animate-shimmer h-3 rounded-full"
                                        style={{ width: `${w}%` }}
                                    />
                                    <div
                                        className="animate-shimmer h-2.5 rounded-full"
                                        style={{ width: `${w - 20}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── CraftCard ─────────────────────────────────────────────────────────────

function CraftCard({ craft, index }: { craft: CraftRecommendation; index: number }) {
    const [expanded, setExpanded] = useState(index === 0);
    const diff = DIFFICULTY_LABEL[craft.difficulty] ?? DIFFICULTY_LABEL.easy;

    return (
        <div className="animate-step-fade overflow-hidden rounded-2xl border border-line bg-white"
            style={{ animationDelay: `${index * 0.12}s` }}>
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-mist/50"
                aria-expanded={expanded}
            >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint font-serif text-sm font-medium text-forest">
                    {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold leading-snug text-ink">{craft.title}</span>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${diff.className}`}>
                            {diff.label}
                        </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{craft.description}</p>
                </div>
                <span className="mt-0.5 shrink-0 text-muted">
                    {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </span>
            </button>

            {expanded && (
                <div className="space-y-4 border-t border-line px-5 pb-5 pt-4">
                    {craft.materials.length > 0 && (
                        <div>
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                                <Wrench className="size-3.5 text-leaf" aria-hidden />
                                Bahan tambahan
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {craft.materials.map((m) => (
                                    <span key={m} className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink">
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {craft.steps.length > 0 && (
                        <div>
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                                <BookOpen className="size-3.5 text-leaf" aria-hidden />
                                Langkah pembuatan
                            </div>
                            <ol className="space-y-2">
                                {craft.steps.map((step, i) => (
                                    <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-ink/80">
                                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-mist text-[10px] font-semibold text-forest">
                                            {i + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {craft.tips && (
                        <div className="flex gap-2 rounded-xl bg-sun/60 px-4 py-3">
                            <Lightbulb className="mt-0.5 size-4 shrink-0 text-sun-ink" aria-hidden />
                            <p className="text-xs leading-relaxed text-sun-ink">{craft.tips}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────

interface AiRecommendationPanelProps {
    objectName: string;
    material:   string;
    wasteType:  string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function AiRecommendationPanel({
    objectName,
    material,
    wasteType,
}: AiRecommendationPanelProps) {
    const [status,   setStatus]   = useState<Status>("loading");
    const [result,   setResult]   = useState<AiRecommendationResult | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const handleFetch = async () => {
        setStatus("loading");
        setErrorMsg("");
        try {
            const data = await fetchFromGemini(objectName, material, wasteType);
            setResult(data);
            setStatus("success");
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
            setStatus("error");
        }
    };

    // Auto-fetch saat pertama mount
    useEffect(() => { handleFetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Loading ── */
    if (status === "loading") return <AiLoadingState />;

    /* ── Error ── */
    if (status === "error") {
        return (
            <div className="rounded-2xl border border-danger-soft bg-danger-soft/40 p-6">
                <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
                        <Sparkles className="size-4" aria-hidden />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-danger">Gagal mendapat rekomendasi AI</p>
                        <p className="mt-1 text-xs text-danger/80">{errorMsg}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleFetch}
                    className="mt-4 flex items-center gap-2 rounded-xl border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                >
                    <RotateCcw className="size-4" aria-hidden />
                    Coba lagi
                </button>
            </div>
        );
    }

    /* ── Success ── */
    return (
        <div className="space-y-4" aria-live="polite">
            {/* Header hasil */}
            <div className="flex items-start gap-4 rounded-2xl bg-mint p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-forest">
                    <Sparkles className="size-5" aria-hidden />
                </span>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-leaf">
                        Rekomendasi AI · Gemini
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-medium leading-snug text-forest">
                        Ide Kreatif dari AI
                    </h3>
                    {result?.summary && (
                        <p className="mt-1 text-sm leading-relaxed text-ink/80">{result.summary}</p>
                    )}
                </div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
                {result?.recommendations.map((craft, i) => (
                    <CraftCard key={i} craft={craft} index={i} />
                ))}
            </div>

            <button
                type="button"
                onClick={handleFetch}
                className="flex items-center gap-2 rounded-xl border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
            >
                <RotateCcw className="size-4" aria-hidden />
                Minta rekomendasi lain
            </button>
        </div>
    );
}
