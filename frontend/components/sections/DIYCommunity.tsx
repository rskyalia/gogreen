"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Clock,
    Container,
    Cylinder,
    GlassWater,
    Leaf,
    Package,
    type LucideIcon,
} from "lucide-react";

type Tutorial = {
    key: string;
    label: string;
    Icon: LucideIcon;
    tone: string;
    title: string;
    by: string;
    time: string;
    level: string;
    materials: string[];
    steps: string[];
};

const tutorials: Tutorial[] = [
    {
        key: "botol",
        label: "Botol plastik",
        Icon: GlassWater,
        tone: "bg-mint text-forest",
        title: "Kebun vertikal dari botol plastik",
        by: "Fajar",
        time: "45 menit",
        level: "Mudah",
        materials: ["3 sampai 4 botol plastik 1,5 L", "Tali atau kawat", "Tanah dan bibit", "Cutter"],
        steps: [
            "Cuci botol sampai bersih, lalu potong salah satu sisi badan botol membentuk jendela.",
            "Buat beberapa lubang kecil di dasar botol agar air bisa keluar.",
            "Isi dengan tanah dan tanam bibit.",
            "Ikat botol berjajar ke dinding atau pagar dengan tali.",
        ],
    },
    {
        key: "galon",
        label: "Galon",
        Icon: Container,
        tone: "bg-sun text-sun-ink",
        title: "Pot bunga dari galon bekas",
        by: "Rina",
        time: "30 menit",
        level: "Mudah",
        materials: ["1 galon bekas", "Cutter", "Cat (opsional)", "Tanah dan tanaman"],
        steps: [
            "Bilas galon sampai bersih dan keringkan.",
            "Potong bagian atas galon dengan cutter, sisakan badannya.",
            "Buat 4 sampai 5 lubang kecil di dasar untuk drainase.",
            "Cat sesuai selera, lalu isi dengan tanah dan tanam.",
        ],
    },
    {
        key: "kaleng",
        label: "Kaleng",
        Icon: Cylinder,
        tone: "bg-mist text-forest",
        title: "Tempat pensil dari kaleng susu",
        by: "Dimas",
        time: "20 menit",
        level: "Mudah",
        materials: ["Kaleng bekas", "Amplas", "Kertas warna atau kain", "Lem"],
        steps: [
            "Cuci dan keringkan kaleng, lalu amplas tepi atasnya supaya tidak tajam.",
            "Ukur kertas atau kain sesuai keliling kaleng.",
            "Tempelkan dengan lem sampai rata.",
            "Tambahkan hiasan, lalu isi dengan pensil atau alat tulis.",
        ],
    },
    {
        key: "kardus",
        label: "Kardus",
        Icon: Package,
        tone: "bg-forest text-mint",
        title: "Rak buku dari kardus tebal",
        by: "Sari",
        time: "2 jam",
        level: "Sedang",
        materials: ["Kardus tebal", "Cutter dan penggaris", "Lem", "Kertas pelapis atau cat"],
        steps: [
            "Potong kardus untuk dua sisi, alas, dan sekat sesuai ukuran rak.",
            "Rekatkan 2 sampai 3 lapis kardus pada tiap bagian agar kuat.",
            "Pasang sekat dan alas ke sisi rak, tunggu lem kering.",
            "Lapisi dengan kertas atau cat supaya rapi.",
        ],
    },
    {
        key: "organik",
        label: "Sampah organik",
        Icon: Leaf,
        tone: "bg-leaf text-white",
        title: "Kompos dari kulit buah",
        by: "Nadia",
        time: "15 menit, lalu ditunggu",
        level: "Mudah",
        materials: ["Kulit buah dan sisa sayur", "Ember atau wadah berlubang", "Daun kering atau tanah"],
        steps: [
            "Potong kecil-kecil sisa kulit buah dan sayur.",
            "Masukkan ke wadah berlubang, selang-seling dengan daun kering atau tanah.",
            "Aduk secara berkala dan jaga agar tetap lembap, jangan sampai becek.",
            "Setelah beberapa minggu, kompos yang sudah gelap dan tidak berbau bisa dipakai untuk tanaman.",
        ],
    },
];

export default function DiyCommunity() {
    const [active, setActive] = useState(tutorials[0].key);
    const t = tutorials.find((x) => x.key === active) ?? tutorials[0];

    return (
        <section id="komunitas" className="bg-mist/50">
            <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
                <div className="max-w-xl">
                    <h2 className="font-serif text-3xl font-medium leading-tight text-forest sm:text-4xl">
                        Cari ide dari komunitas DIY
                    </h2>
                    <p className="mt-4 leading-relaxed text-muted">
                        Pilih jenis sampahmu, lalu lihat tutorial yang dibagikan anggota
                        komunitas, lengkap dengan bahan dan langkahnya.
                    </p>
                </div>

                <div className="mt-10 grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
                    <div
                        role="tablist"
                        aria-label="Jenis sampah"
                        className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
                    >
                        {tutorials.map(({ key, label, Icon }) => {
                            const on = key === active;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    role="tab"
                                    id={`tab-${key}`}
                                    aria-selected={on}
                                    aria-controls="diy-panel"
                                    onClick={() => setActive(key)}
                                    className={`flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${on
                                            ? "border-forest bg-forest text-white"
                                            : "border-line bg-white text-ink hover:bg-mist"
                                        }`}
                                >
                                    <Icon className="size-5" aria-hidden />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div
                        role="tabpanel"
                        id="diy-panel"
                        aria-labelledby={`tab-${t.key}`}
                        className="rounded-[28px] border border-line bg-white p-6 sm:p-8"
                    >
                        <div className="flex items-start gap-4">
                            <span
                                className={`grid size-14 shrink-0 place-items-center rounded-2xl ${t.tone}`}
                            >
                                <t.Icon className="size-7" aria-hidden />
                            </span>
                            <div>
                                <h3 className="font-serif text-2xl font-medium leading-snug text-forest">
                                    {t.title}
                                </h3>
                                <p className="mt-1 text-sm text-muted">
                                    Tutorial oleh {t.by}, komunitas DIY
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
                            <span className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-forest">
                                <Clock className="size-3.5" aria-hidden />
                                {t.time}
                            </span>
                            <span className="rounded-full bg-sun px-3 py-1 text-sun-ink">
                                {t.level}
                            </span>
                        </div>

                        <div className="mt-7 grid gap-8 sm:grid-cols-[2fr_3fr]">
                            <div>
                                <h4 className="text-sm font-semibold text-ink">Bahan</h4>
                                <ul className="mt-3 space-y-2 text-sm text-ink/80">
                                    {t.materials.map((m) => (
                                        <li key={m} className="flex items-start gap-2.5">
                                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-leaf" />
                                            {m}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-ink">Langkah</h4>
                                <ol className="mt-3 space-y-3 text-sm text-ink/80">
                                    {t.steps.map((s, i) => (
                                        <li key={s} className="flex items-start gap-3">
                                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-forest text-xs font-semibold text-mint">
                                                {i + 1}
                                            </span>
                                            <span className="pt-0.5 leading-relaxed">{s}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-sm text-muted">
                    Punya tutorial sendiri?{" "}
                    <Link
                        href="/register"
                        className="font-semibold text-forest underline underline-offset-4"
                    >
                        Daftar sebagai komunitas DIY
                    </Link>
                </p>
            </div>
        </section>
    );
}