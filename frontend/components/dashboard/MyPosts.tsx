import Image from "next/image";
import {
    Bookmark,
    Container,
    Cylinder,
    Flame,
    GlassWater,
    Heart,
    Lamp,
    Leaf,
    MessageCircle,
    Package,
    type LucideIcon,
} from "lucide-react";

type Post = {
    title: string;
    category: string;
    when: string;
    likes: number;
    saves: number;
    comments: number;
    Icon: LucideIcon;
    tone: string;
    image?: string; // (mis. "/images/karya-1.jpg")
};

const posts: Post[] = [
    { title: "Pot bunga dari galon bekas", category: "Plastik", when: "Kemarin", likes: 48, saves: 12, comments: 6, Icon: Container, tone: "bg-sun text-sun-ink" },
    { title: "Tempat pensil dari kaleng susu", category: "Logam", when: "5 hari lalu", likes: 31, saves: 9, comments: 3, Icon: Cylinder, tone: "bg-mist text-forest" },
    { title: "Kebun vertikal dari botol plastik", category: "Plastik", when: "2 minggu lalu", likes: 62, saves: 18, comments: 9, Icon: GlassWater, tone: "bg-mint text-forest" },
    { title: "Kompos dari kulit buah", category: "Organik", when: "3 minggu lalu", likes: 27, saves: 8, comments: 2, Icon: Leaf, tone: "bg-leaf text-white" },
    { title: "Rak buku dari kardus tebal", category: "Kertas", when: "1 bulan lalu", likes: 19, saves: 5, comments: 1, Icon: Package, tone: "bg-forest text-mint" },
    { title: "Lampu hias dari botol kaca", category: "Kaca", when: "1 bulan lalu", likes: 24, saves: 7, comments: 4, Icon: Lamp, tone: "bg-sun text-sun-ink" },
];

const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
const topLikes = Math.max(...posts.map((p) => p.likes));

export default function MyPosts() {
    return (
        <section className="rounded-xl border border-line bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-serif text-xl font-medium text-forest">Karya yang kamu bagikan</h2>
                    <p className="mt-1 text-sm text-muted">Hasil olahan sampahmu yang sudah tampil di komunitas.</p>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-mint px-3 py-1 text-forest">{posts.length} karya</span>
                    <span className="flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-leaf">
                        <Heart className="size-3.5" aria-hidden />
                        {totalLikes} suka
                    </span>
                </div>
            </div>

            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map(({ title, category, when, likes, saves, comments, Icon, tone, image }) => (
                    <li key={title} className="overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-md hover:shadow-forest/5">
                        <div className={`relative aspect-[4/3] overflow-hidden ${tone}`}>
                            {image ? (
                                <Image src={image} alt={title} fill sizes="(min-width: 1024px) 320px, 50vw" className="object-cover" />
                            ) : (
                                <>
                                    <span className="absolute -right-8 -top-8 size-32 rounded-full bg-white/25" />
                                    <span className="absolute -bottom-10 -left-6 size-28 rounded-full bg-white/20" />
                                    <Icon
                                        className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 opacity-70"
                                        strokeWidth={1.25}
                                        aria-hidden
                                    />
                                </>
                            )}
                            <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-forest">
                                {category}
                            </span>
                            {likes === topLikes && (
                                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-sun px-3 py-1 text-xs font-semibold text-sun-ink">
                                    <Flame className="size-3.5" aria-hidden />
                                    Terpopuler
                                </span>
                            )}
                        </div>

                        <div className="p-4">
                            <h3 className="font-serif text-lg font-medium leading-snug text-forest">{title}</h3>
                            <p className="mt-1 text-xs text-muted">Dibagikan {when}</p>
                            <dl className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs text-muted">
                                <div className="flex items-center gap-1.5">
                                    <Heart className="size-3.5" aria-hidden />
                                    <dt className="sr-only">Suka</dt>
                                    <dd>{likes}</dd>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Bookmark className="size-3.5" aria-hidden />
                                    <dt className="sr-only">Tersimpan</dt>
                                    <dd>{saves}</dd>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MessageCircle className="size-3.5" aria-hidden />
                                    <dt className="sr-only">Komentar</dt>
                                    <dd>{comments}</dd>
                                </div>
                            </dl>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}