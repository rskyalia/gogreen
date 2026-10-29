import { api, uploadForm } from "@/lib/api";

export type SubmissionStatus = "pending" | "approved" | "rejected";

// Foto dilayani lewat rewrite "/storage/*" di next.config.ts (diteruskan ke backend),
// jadi cukup path relatif; tidak bergantung pada NEXT_PUBLIC_API_URL.
function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `/storage/${path.replace(/^\/?(storage\/)?/, "")}`;
}

// bentuk data dari GET/POST /api/user/diy-submissions (User\DiySubmissionController)
export interface ApiSubmissionResponse {
  id: number | string;
  user_id: number;
  diy_guide_id?: number | null;
  title?: string | null; // belum disimpan backend (disiapkan untuk karya mandiri)
  custom_title?: string | null;
  category?: string | null;
  proof_image: string;
  notes: string | null;
  status: SubmissionStatus;
  rejection_reason?: string | null;
  review_note?: string | null;
  points_awarded?: number | null;
  created_at: string;
  diy_guide?: {
    id: number;
    title: string;
    points_reward: number;
  } | null;
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

export async function fetchMySubmissions(): Promise<Submission[]> {
  const res = await api.get<{ data: ApiSubmissionResponse[] }>("/user/diy-submissions");
  const data = res.data ?? [];

  return data.map((item) => ({
    id: item.id,
    title: item.title || item.custom_title || item.diy_guide?.title || "Karya DIY",
    category: item.category || (item.diy_guide_id ? "Dari Tutorial" : "Karya Mandiri"),
    status: item.status,
    image: imageUrl(item.proof_image),
    createdAt: item.created_at,
    pointsAwarded: item.status === "approved" ? (item.points_awarded || item.diy_guide?.points_reward || 0) : 0,
    rewardPoints: item.diy_guide?.points_reward ?? 0,
    reviewNote: item.rejection_reason || item.review_note || null,
    notes: item.notes,
  }));
}

export async function createSubmission(formData: FormData) {
  const res = await uploadForm<{ data: ApiSubmissionResponse }>("/user/diy-submissions", formData);
  return res.data;
}

export const COMMUNITIES = [
  { id: "c1", name: "Komunitas Daur Ulang Plastik" },
  { id: "c2", name: "Komunitas Kerajinan Kardus" },
  { id: "c3", name: "Komunitas Pegiat Kompos" },
];