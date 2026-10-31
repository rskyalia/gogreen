import type { Tutorial } from "@/lib/diy";

export type GuideOption = Pick<Tutorial, "id" | "title" | "category" | "rewardPoints">;

// SEMENTARA: dipakai form Upload Karya selama backend belum punya endpoint daftar
// tutorial untuk user (GET /api/user/diy-guides). Hapus file ini setelah endpoint ada.
//
// ID di bawah ASUMSI mengikuti urutan DiyGuideSeeder (1..6). Pastikan cocok dengan
// database di Laravel Cloud: login sebagai developer lalu buka /admin/diy-guides,
// dan sesuaikan nilai `id` kalau berbeda.
export const TEMP_GUIDES: GuideOption[] = [
  { id: "1", title: "Pot Gantung dari Botol PET", category: "Plastik", rewardPoints: 20 },
  { id: "2", title: "Celengan Botol Plastik", category: "Plastik", rewardPoints: 15 },
  { id: "3", title: "Organizer Meja dari Kardus", category: "Kardus", rewardPoints: 20 },
  { id: "4", title: "Lampion dari Kaleng Bekas", category: "Kaleng", rewardPoints: 30 },
  { id: "5", title: "Kompos dari Sampah Dapur", category: "Organik", rewardPoints: 25 },
  { id: "6", title: "Kertas Daur Ulang Buatan Sendiri", category: "Kertas", rewardPoints: 40 },
];