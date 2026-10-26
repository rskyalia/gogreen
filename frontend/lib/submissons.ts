import { Container, Cylinder, Leaf, type LucideIcon } from "lucide-react";

export type SubmissionStatus = "pending" | "approved" | "rejected";

// Dummy: ganti dengan data dari backend saat endpoint komunitas sudah ada
export const COMMUNITIES = [
    { id: "umum", name: "Semua komunitas DIY" },
    { id: "bank-sampah-melati", name: "Komunitas Bank Sampah Melati" },
];

// Sementara hanya tampilan (belum terhubung ke backend).
// Nanti bentuk ini bisa dipetakan dari respons endpoint karya milik user.
export type Submission = {
    id: string;
    guideId: string;
    status: SubmissionStatus;
    title: string;
    category: string;
    image: string | null; // URL foto; kosong = pakai sampul ikon
    createdAt: string; // ISO
    pointsAwarded: number;
    rewardPoints: number;
    reviewNote: string | null;
    community?: string | null; // nama komunitas tujuan
    notes?: string | null;
    isCustom?: boolean; // true = karya tulisan sendiri (bukan dari tutorial)
    Icon: LucideIcon;
    tone: string;
};

// data contoh supaya ketiga status kelihatan
export const SAMPLE_SUBMISSIONS: Submission[] = [
    {
        id: "s1",
        guideId: "galon",
        status: "approved",
        title: "Pot bunga dari galon bekas",
        category: "Plastik",
        image: null,
        createdAt: "2026-10-21T08:30:00.000Z",
        pointsAwarded: 50,
        rewardPoints: 50,
        reviewNote: null,
        Icon: Container,
        tone: "bg-sun text-sun-ink",
    },
    {
        id: "s2",
        guideId: "kaleng",
        status: "pending",
        title: "Tempat pensil dari kaleng susu",
        category: "Logam",
        image: null,
        createdAt: "2026-10-23T14:10:00.000Z",
        pointsAwarded: 0,
        rewardPoints: 40,
        reviewNote: null,
        Icon: Cylinder,
        tone: "bg-mist text-forest",
    },
    {
        id: "s3",
        guideId: "organik",
        status: "rejected",
        title: "Kompos dari kulit buah",
        category: "Organik",
        image: null,
        createdAt: "2026-10-18T10:00:00.000Z",
        pointsAwarded: 0,
        rewardPoints: 30,
        reviewNote: "Foto kurang jelas, kompos belum terlihat.",
        Icon: Leaf,
        tone: "bg-leaf text-white",
    },
];