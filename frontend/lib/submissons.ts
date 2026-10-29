import { api, uploadForm } from "@/lib/api";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface ApiSubmissionResponse {
    id: number | string;
    user_id: number;
    diy_guide_id: number;
    proof_image: string;
    notes: string | null;
    status: SubmissionStatus;
    rejection_reason?: string | null;
    review_note?: string | null;
    points_awarded?: number;
    created_at: string;
    diy_guide?: {
        id: number;
        title: string;
        points_reward: number;
        reward_points?: number;
    };
}

export interface Submission {
    id: string | number;
    title: string;
    category: string;
    status: SubmissionStatus;
    image: string | null;
    createdAt: string;
    pointsAwarded: number;
    rewardPoints: number;
    reviewNote: string | null;
    notes?: string | null;
}

// 1. Ambil daftar karya milik user dari backend
export async function fetchMySubmissions(): Promise<Submission[]> {
    const res = await api.get<{ data: ApiSubmissionResponse[] }>("/user/diy-submissions");
    const data = res.data ?? [];

    return data.map((item) => {
        const proof = item.proof_image || "";
        const image = proof
            ? proof.startsWith("http")
                ? proof
                : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "")}/storage/${proof}`
            : null;

        return {
            id: item.id,
            title: item.diy_guide?.title || "Karya DIY",
            category: "Karya Saya",
            status: item.status,
            image,
            createdAt: item.created_at,
            pointsAwarded: item.status === "approved" ? (item.points_awarded || item.diy_guide?.points_reward || 0) : 0,
            rewardPoints: item.diy_guide?.points_reward || 0,
            reviewNote: item.rejection_reason || item.review_note || null,
            notes: item.notes,
        };
    });
}

// 2. Kirim formdata karya ke backend
export async function createSubmission(formData: FormData) {
    const res = await uploadForm<{ data: ApiSubmissionResponse }>("/user/diy-submissions", formData);
    return res.data;
}

export const COMMUNITIES = [
    { id: "c1", name: "Komunitas Daur Ulang Plastik" },
    { id: "c2", name: "Komunitas Kerajinan Kardus" },
    { id: "c3", name: "Komunitas Pegiat Kompos" },
];