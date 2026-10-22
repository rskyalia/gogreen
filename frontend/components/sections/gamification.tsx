import Link from "next/link";
import { Flame, Hammer, Recycle, ScanLine, Trophy } from "lucide-react";

const earnWays = [
    { label: "Memilah sampah lewat scan", points: "+10", Icon: ScanLine },
    { label: "Membagikan karya buatanmu", points: "+50", Icon: Hammer },
    { label: "Setor ke bank sampah (divalidasi)", points: "+30", Icon: Recycle },
    { label: "Aktif setiap hari", points: "+5", Icon: Flame },
];

const levels = [
    { name: "Visionary", from: "0 poin" },
    { name: "Builder", from: "200 poin" },
    { name: "Architect of Change", from: "1.000 poin" },
];
const CURRENT_LEVEL = 1;

const stats = [
    { value: "12,4 kg", label: "Sampah dipilah" },
    { value: "7", label: "Karya dibuat" },
    { value: "3", label: "Setoran bank sampah" },
];

const leaderboard = [
    { rank: 1, name: "Rina", level: "Architect of Change", points: "1.240" },
    { rank: 2, name: "Fajar", level: "Builder", points: "980" },
    { rank: 3, name: "Nadia", level: "Builder", points: "860" },
];

export default function Gamification() {
    return (
        <section id="gamifikasi" className="bg-forest text-white">
            <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
                <div className="max-w-xl">
                    <h2 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
                        Kumpulkan poin, naik level
                    </h2>
                    <p className="mt-4 leading-relaxed text-mint">
                        Poin datang dari aksi nyata: memilah, membuat karya, dan menyetor
                        sampah. Makin banyak aksimu, makin tinggi levelmu.
                    </p>
                </div>

                <div className="mt-10 grid gap-5 lg:grid-cols-5">
                    <div className="rounded-[28px] bg-white/10 p-7 sm:p-8 lg:col-span-2">
                        <h3 className="font-serif text-2xl font-medium">Cara dapat poin</h3>
                        <ul className="mt-6 space-y-4">
                            {earnWays.map(({ label, points, Icon }) => (
                                <li key={label} className="flex items-center gap-4">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
                                        <Icon className="size-5" aria-hidden />
                                    </span>
                                    <span className="flex-1 text-sm leading-snug">{label}</span>
                                    <span className="font-semibold tabular-nums text-sun">
                                        {points}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-[28px] bg-white p-7 text-ink sm:p-8 lg:col-span-3">
                        <p className="text-sm text-muted">Contoh progres pengguna</p>
                        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="font-serif text-3xl font-medium text-forest">
                                {levels[CURRENT_LEVEL].name}
                            </h3>
                            <p className="font-semibold tabular-nums text-forest">620 poin</p>
                        </div>

                        <div className="mt-5">
                            <div
                                className="h-2.5 rounded-full bg-mist"
                                role="progressbar"
                                aria-valuenow={53}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Progres menuju level berikutnya"
                            >
                                <div className="h-full w-[53%] rounded-full bg-leaf" />
                            </div>
                            <p className="mt-2 text-sm text-muted">
                                380 poin lagi menuju {levels[CURRENT_LEVEL + 1].name}
                            </p>
                        </div>

                        <ol className="mt-6 grid gap-2 sm:grid-cols-3">
                            {levels.map((l, i) => {
                                const on = i === CURRENT_LEVEL;
                                const done = i < CURRENT_LEVEL;
                                return (
                                    <li
                                        key={l.name}
                                        className={`rounded-2xl border px-4 py-3 ${on
                                            ? "border-forest bg-forest text-white"
                                            : done
                                                ? "border-line bg-mist text-forest"
                                                : "border-line text-muted"
                                            }`}
                                    >
                                        <p className="text-sm font-semibold leading-snug">{l.name}</p>
                                        <p className={`mt-0.5 text-xs ${on ? "text-mint" : ""}`}>
                                            {l.from}
                                        </p>
                                    </li>
                                );
                            })}
                        </ol>

                        <dl className="mt-6 grid grid-cols-3 divide-x divide-line border-t border-line pt-5">
                            {stats.map((s) => (
                                <div key={s.label} className="px-3 first:pl-0 last:pr-0">
                                    <dd className="font-serif text-2xl font-medium text-forest">
                                        {s.value}
                                    </dd>
                                    <dt className="mt-0.5 text-xs leading-snug text-muted">
                                        {s.label}
                                    </dt>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                <div className="mt-5 rounded-[28px] bg-white/10 p-7 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h3 className="flex items-center gap-2.5 font-serif text-2xl font-medium">
                            <Trophy className="size-6 text-sun" aria-hidden />
                            Papan peringkat
                        </h3>
                        <Link
                            href="/register"
                            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mint"
                        >
                            Mulai kumpulkan poin
                        </Link>
                    </div>

                    <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                        {leaderboard.map((p) => {
                            const first = p.rank === 1;
                            return (
                                <li
                                    key={p.name}
                                    className={`flex items-center gap-4 rounded-2xl px-5 py-4 ${first ? "bg-sun text-ink" : "bg-white/10"
                                        }`}
                                >
                                    <span
                                        className={`font-serif text-3xl font-medium ${first ? "text-sun-ink" : "text-mint"}`}
                                    >
                                        {p.rank}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold leading-tight">{p.name}</p>
                                        <p className={`truncate text-xs ${first ? "text-ink/70" : "text-mint"}`}>
                                            {p.level}
                                        </p>
                                    </div>
                                    <span className="font-semibold tabular-nums">{p.points}</span>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </section>
    );
}