/**
 * lib/waste-categories.ts
 * Fetch kategori sampah dari database (tanpa hardcode)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export interface WasteCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_recyclable: boolean;
    is_upcyclable: boolean;
    points_per_kg: number;
    icon: string | null;
}

export async function fetchWasteCategories(): Promise<WasteCategory[]> {
    const res = await fetch(`${API_BASE}/waste-categories`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Gagal memuat kategori sampah (HTTP ${res.status})`);
    }

    const body = await res.json();
    return body.data ?? [];
}
