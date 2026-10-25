"use client";

import { useState } from "react";
import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Loader2,
    RotateCcw,
    Sparkles,
    Wrench,
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
    easy:   { label: "Mudah",   className: "bg-mint text-forest" },
    medium: { label: "Sedang",  className: "bg-sun text-sun-ink" },
    hard:   { label: "Sulit",   className: "bg-mist text-leaf" },
};

function buildPrompt(objectName: string, material: string, wasteType: string): string {
    const wasteTypeLabel =
        wasteType === "organic" ? "organik" : wasteType === "residue" ? "residu" : "daur ulang (recyclable)";

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
    if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GEMINI_API_KEY belum dikonfigurasi.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(objectName, material, wasteType) }] }],
            generationConfig: {
                temperature: 0.7,
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
    console.log("[Gemini raw response]", JSON.stringify(body, null, 2));

    // Cek finish reason — safety filter atau error dari model
    const finishReason = body?.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
        throw new Error(`AI menolak permintaan (${finishReason}). Silakan coba lagi.`);
    }

    const rawText: string = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("[Gemini rawText]", rawText);

    if (!rawText) {
        // Tidak ada teks sama sekali — bisa jadi promptFeedback block
        const blockReason = body?.promptFeedback?.blockReason;
        throw new Error(
            blockReason
                ? `AI memblokir permintaan: ${blockReason}`
                : "AI tidak mengembalikan respons. Silakan coba lagi.",
        );
    }

    // Ekstrak JSON dari dalam teks — cari blok {...} pertama yang valid
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    console.log("[Gemini jsonMatch]", jsonMatch?.[0]?.slice(0, 200));
    if (!jsonMatch) {
        throw new Error("Respons AI tidak valid. Silakan coba lagi.");
    }

    let parsed: AiRecommendationResult;
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("[Gemini parse error]", e, "raw:", jsonMatch[0]?.slice(0, 300));
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

// ── CraftCard ─────────────────────────────────────────────────────────────

function CraftCard({ craft, index }: { craft: CraftRecommendation; index: number }) {
    const [expanded, setExpanded] = useState(index === 0);
    const diff = DIFFICULTY_LABEL[craft.difficulty] ?? DIFFICULTY_LABEL.easy;

    return (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
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
                                    <span
                                        key={m}
                                        className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink"
                                    >
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
    /** Nama objek dari hasil scan ML atau pilihan user */
    objectName: string;
    /** Material sampah (misal "plastik", "kertas") */
    material: string;
    /** Jenis sampah: recyclable | organic | residue */
    wasteType: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function AiRecommendationPanel({
    objectName,
    material,
    wasteType,
}: AiRecommendationPanelProps) {
    const [status, setStatus] = useState<Status>("idle");
    const [result, setResult] = useState<AiRecommendationResult | null>(null);
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

    if (status === "idle") {
        return (
            <div className="rounded-[28px] border border-line bg-white p-6">
                <div className="flex items-start gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint text-forest">
                        <Sparkles className="size-5" aria-hidden />
                    </span>
                    <div>
                        <h3 className="text-sm font-semibold leading-snug text-ink">Rekomendasi Karya AI</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                            Dapatkan 3 ide kreatif yang bisa kamu buat dari sampah ini — lengkap dengan bahan, langkah, dan tips.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleFetch}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                >
                    <Sparkles className="size-4" aria-hidden />
                    Minta rekomendasi AI
                </button>
            </div>
        );
    }

    if (status === "loading") {
        return (
            <div className="rounded-[28px] border border-line bg-white p-6">
                <div className="flex items-center gap-3 text-muted">
                    <Loader2 className="size-5 animate-spin text-leaf" aria-hidden />
                    <span className="text-sm">AI sedang menyiapkan rekomendasi karya untukmu…</span>
                </div>
                <div className="mt-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-2xl bg-mist/60" />
                    ))}
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="rounded-[28px] border border-line bg-white p-6">
                <p className="text-sm text-danger">{errorMsg}</p>
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

    return (
        <div className="space-y-4" aria-live="polite">
            <div className="flex items-start gap-4 rounded-[28px] bg-mint p-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-forest">
                    <Sparkles className="size-5" aria-hidden />
                </span>
                <div>
                    <h3 className="font-serif text-lg font-medium leading-snug text-forest">Ide Kreatif dari AI</h3>
                    {result?.summary && (
                        <p className="mt-1 text-sm leading-relaxed text-ink/80">{result.summary}</p>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {result?.recommendations.map((craft, i) => (
                    <CraftCard key={i} craft={craft} index={i} />
                ))}
            </div>

            <button
                type="button"
                onClick={() => {
                    setResult(null);
                    setStatus("idle");
                }}
                className="flex items-center gap-2 rounded-xl border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
            >
                <RotateCcw className="size-4" aria-hidden />
                Minta rekomendasi lain
            </button>
        </div>
    );
}
