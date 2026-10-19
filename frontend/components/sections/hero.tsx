import Link from "next/link";
import Image from "next/image";

function ScanIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
            <path d="M8 12h8" />
        </svg>
    );
}

function IdeaIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 18h6M10 21h4" />
            <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
        </svg>
    );
}

function Leaf({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" className={className} fill="currentColor" aria-hidden>
            <path d="M6 34C6 17 16 6 34 6c0 18-10 28-28 28Z" />
            <path d="M6 34c6-8 12-14 20-18" stroke="#f5faf7" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
    );
}

function ScanCard() {
    return (
        <div className="animate-rise absolute -bottom-4 left-0 w-48 rounded-xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur sm:-left-6 sm:w-52">
            <div className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint text-forest">
                    <ScanIcon />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">Botol plastik</p>
                    <p className="truncate text-[10px] text-muted">Bisa didaur ulang</p>
                </div>
            </div>
            <div className="mt-2">
                <div className="flex justify-between text-[10px]">
                    <span className="text-muted">Skor kelayakan</span>
                    <span className="font-semibold text-forest">86 / 100</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-mist">
                    <div className="h-full w-[86%] rounded-full bg-leaf" />
                </div>
            </div>
            <p className="mt-2 text-[10px] leading-tight text-ink/80">
                Bisa dibuat pot tanaman atau tempat pensil.
            </p>
        </div>
    );
}

const highlights = [
    {
        title: "Pilah otomatis",
        desc: "Foto sampahmu, sistem menentukan jenisnya secara otomatis.",
        Icon: ScanIcon,
    },
    {
        title: "Ide olahan",
        desc: "Dapatkan ide DIY kreatif AI dan panduan komunitas.",
        Icon: IdeaIcon,
    },
];

export default function Hero() {
    return (
        <section id="beranda" className="relative flex min-h-[95vh] items-center overflow-hidden py-8 lg:py-0">
            <Leaf className="absolute left-[5%] top-8 hidden size-7 -rotate-12 text-leaf/35 sm:block" />
            <Leaf className="absolute left-[10%] top-20 hidden size-4 rotate-12 text-leaf/25 sm:block" />

            <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
                <div className="flex flex-col justify-center">
                    <p className="font-serif text-sm italic text-leaf sm:text-base">
                        Dream It. Build It. Change It.
                    </p>
                    <h1 className="mt-2 max-w-xl font-serif text-3xl font-medium leading-tight text-forest sm:text-4xl lg:text-5xl">
                        Sampah di rumahmu masih bisa jadi sesuatu
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                        Go Green Innovation membantu memilah sampah dengan machine learning
                        dan memberi ide olahan kreatif. Sisanya disetor ke bank sampah terdekat.
                    </p>

                    <ul className="mt-6 space-y-3 sm:space-y-4">
                        {highlights.map(({ title, desc, Icon }) => (
                            <li key={title} className="flex items-start gap-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-leaf text-white">
                                    <Icon />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-ink sm:text-base">{title}</p>
                                    <p className="max-w-sm text-xs leading-relaxed text-muted sm:text-sm">{desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/login"
                            className="rounded-full bg-forest px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-deep sm:px-6 sm:py-3 sm:text-sm"
                        >
                            Scan sampah
                        </Link>
                        <a
                            href="#postingan"
                            className="rounded-full border border-forest/30 px-5 py-2.5 text-xs font-semibold text-forest transition-colors hover:bg-mist sm:px-6 sm:py-3 sm:text-sm"
                        >
                            Lihat karya komunitas
                        </a>
                    </div>
                </div>

                <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        <div className="relative row-span-2 overflow-hidden rounded-t-full rounded-b-[24px] bg-mint">
                            <Image
                                src="/hero-botol.svg"
                                alt="Botol bekas yang dijadikan pot tanaman"
                                fill
                                priority
                                sizes="(min-width: 640px) 250px, 45vw"
                                className="object-cover"
                            />
                        </div>

                        <div className="relative aspect-square overflow-hidden rounded-[999px_999px_999px_0] bg-sun">
                            <Image
                                src="/hero-tumbuhan.svg"
                                alt="Daun dan kompos dari sampah organik"
                                fill
                                sizes="(min-width: 640px) 250px, 45vw"
                                className="object-cover"
                            />
                        </div>

                        <div className="relative aspect-square overflow-hidden rounded-[0_999px_999px_999px] bg-forest">
                            <Image
                                src="/hero-kaleng.svg"
                                alt="Kaleng bekas yang dijadikan tempat pensil"
                                fill
                                sizes="(min-width: 640px) 250px, 45vw"
                                className="object-cover"
                            />
                        </div>
                    </div>
                    <ScanCard />
                </div>
            </div>
        </section>
    );
}