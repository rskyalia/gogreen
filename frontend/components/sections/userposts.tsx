import Image from "next/image";
import Link from "next/link";
import {
    Flower2,
    Heart,
    Lamp,
    Leaf,
    Library,
    Pencil,
    Sprout,
    type LucideIcon,
} from "lucide-react";

type Post = {
    title: string;
    material: string;
    author: string;
    likes: number;
    ratio: string;
    tone: string;
    Icon: LucideIcon;
    image?: string; // isi path foto (mis. "/images/karya-1.jpg") kalau sudah ada
};

const posts: Post[] = [
    { title: "Pot bunga dari galon bekas", material: "Galon", author: "Rina", likes: 124, ratio: "aspect-[4/5]", tone: "bg-mint text-forest", Icon: Flower2 },
    { title: "Tempat pensil dari kaleng susu", material: "Kaleng", author: "Dimas", likes: 89, ratio: "aspect-square", tone: "bg-sun text-sun-ink", Icon: Pencil },
    { title: "Rak buku dari kardus tebal", material: "Kardus", author: "Sari", likes: 76, ratio: "aspect-[3/4]", tone: "bg-forest text-mint", Icon: Library },
    { title: "Lampu hias dari botol kaca", material: "Botol kaca", author: "Bagas", likes: 58, ratio: "aspect-square", tone: "bg-mist text-forest", Icon: Lamp },
    { title: "Kompos dari kulit buah", material: "Organik", author: "Nadia", likes: 47, ratio: "aspect-[4/3]", tone: "bg-leaf text-white", Icon: Sprout },
    { title: "Kebun vertikal dari botol PET", material: "Botol plastik", author: "Fajar", likes: 102, ratio: "aspect-[4/5]", tone: "bg-sun text-sun-ink", Icon: Leaf },
];

function PostCard({ post }: { post: Post }) {
    const { title, material, author, likes, ratio, tone, Icon, image } = post;
    return (
        <article className="mb-5 break-inside-avoid overflow-hidden rounded-3xl border border-line bg-white">
            <div className={`relative grid place-items-center ${ratio} ${tone}`}>
                {image ? (
                    <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                    />
                ) : (
                    <Icon className="size-14 opacity-60" strokeWidth={1.5} aria-hidden />
                )}
            </div>
            <div className="p-5">
                <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-forest">
                    {material}
                </span>
                <h3 className="mt-3 font-semibold leading-snug text-ink">{title}</h3>
                <div className="mt-4 flex items-center justify-between text-sm text-muted">
                    <span className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-full bg-forest text-xs font-semibold text-mint">
                            {author[0]}
                        </span>
                        {author}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Heart className="size-4" aria-hidden />
                        {likes}
                    </span>
                </div>
            </div>
        </article>
    );
}

export default function UserPosts() {
    return (
        <section id="postingan">
            <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div className="max-w-xl">
                        <h2 className="font-serif text-3xl font-medium leading-tight text-forest sm:text-4xl">
                            Karya yang sudah dibuat pengguna
                        </h2>
                        <p className="mt-4 leading-relaxed text-muted">
                            Contoh hasil olahan sampah dari orang lain, bisa jadi bahan
                            inspirasi sebelum kamu mulai.
                        </p>
                    </div>
                    <a
                        href="/login"
                        className="rounded-full border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                    >
                        Lihat semua karya
                    </a>
                </div>

                <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
                    {posts.map((p) => (
                        <PostCard key={p.title} post={p} />
                    ))}
                </div>

                <p className="mt-2 text-sm text-muted">
                    Punya karya sendiri?{" "}
                    <Link href="/register" className="font-semibold text-forest underline underline-offset-4">
                        Daftar dan bagikan hasilmu
                    </Link>
                </p>
            </div>
        </section>
    );
}
