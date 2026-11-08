/**
 * lib/diy.ts
 * Fetch panduan DIY dari endpoint publik backend.
 * Tidak ada data hardcode — semua dari database.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api');

// ── Types ─────────────────────────────────────────────────────────────────

export interface Tutorial {
    id: string;
    title: string;
    category: string;         // nama waste_category
    categorySlug: string;
    by: string;               // nama creator
    time: string;             // "45 menit" atau "1 jam 30 menit"
    level: string;            // "Mudah" | "Sedang" | "Sulit"
    difficulty: string;       // "easy" | "medium" | "hard"
    summary: string;
    materials: string[];
    steps: string[];
    rewardPoints: number;
    videoUrl: string | null;
    image: string | null;
    createdAt: string;
}

interface ApiGuide {
    id: number;
    title: string;
    description: string | null;
    difficulty: string | null;
    estimated_minutes: number | null;
    materials: string[];
    steps: string[];
    cover_image: string | null;
    video_url: string | null;
    reward_points: number;
    waste_category: { id: number; name: string; slug: string } | null;
    creator: { id: number; name: string } | null;
    created_at: string;
}

interface ApiListResponse {
    data: ApiGuide[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

interface ApiSingleResponse {
    data: ApiGuide;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<string, string> = {
    easy:   'Mudah',
    medium: 'Sedang',
    hard:   'Sulit',
};

function formatTime(min: number | null | undefined): string {
    if (!min) return '-';
    if (min < 60) return `${min} menit`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} jam ${m} menit` : `${h} jam`;
}

function toTutorial(d: ApiGuide): Tutorial {
    return {
        id:           String(d.id),
        title:        d.title,
        category:     d.waste_category?.name ?? 'Lainnya',
        categorySlug: d.waste_category?.slug ?? 'lainnya',
        by:           d.creator?.name ?? 'Komunitas',
        time:         formatTime(d.estimated_minutes),
        level:        d.difficulty ? (LEVEL_LABEL[d.difficulty] ?? d.difficulty) : '-',
        difficulty:   d.difficulty ?? '',
        summary:      d.description ?? '',
        materials:    d.materials ?? [],
        steps:        d.steps ?? [],
        rewardPoints: d.reward_points ?? 0,
        videoUrl:     d.video_url ?? null,
        image:        d.cover_image ?? null,
        createdAt:    d.created_at,
    };
}

// ── API functions ─────────────────────────────────────────────────────────

export async function fetchTutorials(params?: {
    search?: string;
    category_id?: number;
    difficulty?: string;
    per_page?: number;
    page?: number;
}): Promise<{ tutorials: Tutorial[]; total: number; lastPage: number }> {
    const url = new URL(`${API_BASE}/diy-guides`);
    if (params?.search)      url.searchParams.set('search', params.search);
    if (params?.category_id) url.searchParams.set('category_id', String(params.category_id));
    if (params?.difficulty)  url.searchParams.set('difficulty', params.difficulty);
    if (params?.per_page)    url.searchParams.set('per_page', String(params.per_page));
    if (params?.page)        url.searchParams.set('page', String(params.page));

    const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`Gagal memuat panduan DIY (HTTP ${res.status})`);

    const body: ApiListResponse = await res.json();
    return {
        tutorials: body.data.map(toTutorial),
        total:     body.meta.total,
        lastPage:  body.meta.last_page,
    };
}

export async function fetchTutorialById(id: string): Promise<Tutorial> {
    const res = await fetch(`${API_BASE}/diy-guides/${id}`, {
        headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`Panduan tidak ditemukan (HTTP ${res.status})`);

    const body: ApiSingleResponse = await res.json();
    return toTutorial(body.data);
}
