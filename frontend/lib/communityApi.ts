// Helper API untuk dashboard komunitas.
// Sesuaikan 2 hal ini dengan project-mu:
//   1) NEXT_PUBLIC_API_URL di .env.local (default: http://localhost:8000/api)
//   2) getToken(): tempat token login Sanctum disimpan (default: localStorage "token")

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token");
}

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface CommunitySubmission {
    id: number;
    user: string;
    guide: string;
    category: string;
    status: SubmissionStatus;
    points: number;
    created_at: string | null;
}

export interface CommunityDashboard {
    user: { id: number; name: string };
    stats: {
        pending: number;
        approved: number;
        rejected: number;
        open_material_requests: number;
    };
    submissions: CommunitySubmission[];
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        cache: "no-store",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...init.headers,
        },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
        const message =
            res.status === 401
                ? "Sesi login berakhir. Silakan login ulang."
                : res.status === 403
                    ? "Akun ini tidak punya akses ke dashboard komunitas."
                    : (body?.message ?? "Terjadi kesalahan pada server.");
        throw new ApiError(message, res.status);
    }

    return body as T;
}

export async function fetchCommunityDashboard(): Promise<CommunityDashboard> {
    const body = await request<{ data: CommunityDashboard }>(
        "/community/dashboard?limit=10",
    );
    return body.data;
}

export async function reviewSubmission(
    id: number,
    status: "approved" | "rejected",
    reviewNote?: string,
): Promise<void> {
    await request(`/community/diy-submissions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, review_note: reviewNote ?? null }),
    });
}