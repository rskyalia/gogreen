import Link from "next/link";
import {
    ArrowRight,
    Check,
    Leaf,
    Lightbulb,
    Recycle,
    ScanSearch,
    Sprout,
    Trash2,
} from "lucide-react";

const bins = [
    { label: "Organik", example: "Sisa sayur, kulit buah, daun", Icon: Leaf },
    { label: "Daur ulang", example: "Botol, galon, kaleng", Icon: Recycle },
    { label: "Residu", example: "Tisu bekas, bungkus berminyak", Icon: Trash2 },
];

const ideas = [
    { from: "Botol bekas", to: "Pot bunga" },
    { from: "Kaleng", to: "Tempat pensil" },
    { from: "Galon", to: "Rak belajar" },
];

const benefits = [
    "Sampah organik jadi pupuk untuk tanaman di rumah",
    "Barang bekas jadi barang pakai, tanpa beli baru",
    "Sampah yang berakhir di tempat pembuangan berkurang",
];

export default function Categories() {
    return (
        <section id="kategori" className="bg-mist/50">
            <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
                <div className="max-w-2xl">
                    <h2 className="font-serif text-3xl font-medium leading-tight text-forest sm:text-4xl">
                        Dari memilah sampah sampai jadi karya
                    </h2>
                    <p className="mt-4 leading-relaxed text-muted">
                        Tiga fitur utama yang saling terhubung: brpilah sampahmu, cari ide
                        olahannya, lalu lihat manfaatnya.
                    </p>
                </div>

                <div className="mt-10 grid gap-5 lg:grid-cols-5">
                    <article className="rounded-[28px] bg-forest p-7 text-white sm:p-8 lg:col-span-3">
                        <span className="grid size-11 place-items-center rounded-full bg-white/15">
                            <ScanSearch className="size-5" aria-hidden />
                        </span>
                        <h3 className="mt-5 font-serif text-2xl font-medium">
                            Pemilahan sampah
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-mint">
                            Upload foto sampah, lalu sistem menentukan jenisnya dan memberi
                            skor kelayakan daur ulang.
                        </p>

                        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                            {bins.map(({ label, example, Icon }) => (
                                <li key={label} className="rounded-2xl bg-white/10 p-4">
                                    <Icon className="size-5 text-mint" aria-hidden />
                                    <p className="mt-3 font-semibold">{label}</p>
                                    <p className="mt-1 text-xs leading-snug text-mint/90">
                                        {example}
                                    </p>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/login"
                            className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mint"
                        >
                            Coba pilah sampah
                        </Link>
                    </article>

                    <article className="rounded-[28px] bg-sun p-7 text-ink sm:p-8 lg:col-span-2">
                        <span className="grid size-11 place-items-center rounded-full bg-white/60 text-sun-ink">
                            <Lightbulb className="size-5" aria-hidden />
                        </span>
                        <h3 className="mt-5 font-serif text-2xl font-medium">
                            Rekomendasi karya
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink/75">
                            Ide kerajinan dari AI dan tutorial komunitas DIY, lengkap dengan
                            bahan dan langkahnya.
                        </p>

                        <ul className="mt-6 space-y-2.5">
                            {ideas.map(({ from, to }) => (
                                <li
                                    key={from}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-4 py-3 text-sm"
                                >
                                    <span>{from}</span>
                                    <ArrowRight className="size-4 shrink-0 text-sun-ink" aria-hidden />
                                    <span className="font-semibold">{to}</span>
                                </li>
                            ))}
                        </ul>

                        <a
                            href="#komunitas"
                            className="mt-6 inline-block text-sm font-semibold text-sun-ink underline underline-offset-4"
                        >
                            Lihat tutorial komunitas
                        </a>
                    </article>

                    <article className="grid gap-6 rounded-[28px] border border-line bg-white p-7 sm:p-8 lg:col-span-5 lg:grid-cols-2 lg:items-center lg:gap-12">
                        <div>
                            <span className="grid size-11 place-items-center rounded-full bg-mist text-forest">
                                <Sprout className="size-5" aria-hidden />
                            </span>
                            <h3 className="mt-5 font-serif text-2xl font-medium text-forest">
                                Manfaat yang bisa dibuat
                            </h3>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                                Lihat hasil akhirnya sebelum mulai: sampahmu bisa dipakai lagi,
                                bukan cuma dibuang.
                            </p>
                        </div>

                        <ul className="space-y-3">
                            {benefits.map((b) => (
                                <li key={b} className="flex items-start gap-3 text-sm text-ink">
                                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-leaf text-white">
                                        <Check className="size-3" aria-hidden />
                                    </span>
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </article>
                </div>
            </div>
        </section>
    );
}