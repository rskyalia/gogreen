"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import {
    CalendarDays,
    Flame,
    Hammer,
    Recycle,
    ScanLine,
    Sprout,
    Trophy,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";
import NearbyBankMap from "@/components/dashboard/Nearbybankmap";

const POINTS = 650;
const NEXT_AT = 1000;
const STREAK = 7;
const percent = Math.round((POINTS / NEXT_AT) * 100);

const noopSubscribe = () => () => { };
const formatToday = () =>
    new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

function TodayChip() {
    const today = useSyncExternalStore(noopSubscribe, formatToday, () => "");
    return (
        <div className="flex min-w-[14rem] items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink/75">
            <CalendarDays className="size-4 shrink-0 text-forest" aria-hidden />
            <span>{today || "\u00A0"}</span>
        </div>
    );
}

const stats: {
    label: string;
    value: string;
    delta: string;
    Icon: LucideIcon;
    tone: string;
}[] = [
        { label: "Sampah di-scan", value: "28", delta: "+6 minggu ini", Icon: ScanLine, tone: "bg-mint text-forest" },
        { label: "Karya dibuat", value: "7", delta: "+2 minggu ini", Icon: Hammer, tone: "bg-sun text-sun-ink" },
        { label: "Sampah dipilah", value: "12,4 kg", delta: "+3,1 kg minggu ini", Icon: Recycle, tone: "bg-forest text-mint" },
    ];

const activity: {
    text: string;
    when: string;
    points: number;
    Icon: LucideIcon;
    tone: string;
}[] = [
        { text: "Scan botol plastik", when: "Hari ini", points: 10, Icon: ScanLine, tone: "bg-mint text-forest" },
        { text: "Membagikan karya pot dari galon", when: "Kemarin", points: 50, Icon: Hammer, tone: "bg-sun text-sun-ink" },
        { text: "Setor ke bank sampah", when: "2 hari lalu", points: 30, Icon: Recycle, tone: "bg-forest text-mint" },
        { text: `Aktif ${STREAK} hari berturut-turut`, when: "3 hari lalu", points: 5, Icon: Flame, tone: "bg-mist text-leaf" },
    ];
const weekPoints = activity.reduce((sum, a) => sum + a.points, 0);

export default function OverviewView({ name, onScan }: { name: string; onScan: () => void }) {
    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">
                        Ringkasan hari ini
                    </p>
                    <h1 className="mt-2 flex items-center gap-3 font-serif text-3xl font-medium text-forest sm:text-4xl">
                        Halo, {name}!
                        <span className="grid size-9 rotate-12 place-items-center rounded-full bg-mint text-leaf">
                            <Sprout className="size-5" aria-hidden />
                        </span>
                    </h1>
                    <p className="mt-2 text-sm text-muted">
                        {NEXT_AT - POINTS} poin lagi menuju Builder, dan kamu sudah aktif {STREAK} hari berturut-turut.
                    </p>
                </div>
                <TodayChip />
            </header>

            <div className="grid gap-5 lg:grid-cols-3">
                <section className="grid overflow-hidden rounded-xl bg-mint md:grid-cols-[1.1fr_1fr] lg:col-span-2">
                    <div className="p-7 sm:p-8">
                        <p className="font-serif italic text-leaf">Dream It. Build It. Change It.</p>
                        <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-forest">
                            Foto sampahmu, lalu cari tahu bisa jadi apa
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-ink/75">
                            Upload foto, lihat jenis dan skor daur ulangnya, lalu pilih ide yang mau kamu buat.
                        </p>
                        <button
                            type="button"
                            onClick={onScan}
                            className="mt-6 flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                        >
                            <ScanLine className="size-4" aria-hidden />
                            Scan sampah
                        </button>
                    </div>
                    <div className="relative min-h-56">
                        <Image src="/landing.jpg" alt="" fill sizes="(min-width: 768px) 280px, 100vw" className="object-cover" priority />
                    </div>
                </section>

                <section className="flex flex-col rounded-xl border border-line bg-white p-6">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold text-ink">Perjalanan hijaumu</h2>
                        <span className="flex items-center gap-1 rounded-full bg-sun px-3 py-1 text-xs font-semibold text-sun-ink">
                            <Flame className="size-3.5" aria-hidden />{STREAK} hari
                        </span>
                    </div>

                    <div className="mt-5 flex items-center gap-4">
                        <span className="grid size-16 shrink-0 place-items-center rounded-full border border-dashed border-forest/40 bg-mint text-forest">
                            <Sprout className="size-7" aria-hidden />
                        </span>
                        <div>
                            <p className="font-serif text-2xl font-medium text-forest">Visionary</p>
                            <p className="text-xs text-muted">Level sekarang</p>
                        </div>
                    </div>

                    <div className="mb-5 mt-5">
                        <div className="flex justify-between text-xs">
                            <span className="text-ink">
                                <b className="tabular-nums">{POINTS}</b> / {NEXT_AT.toLocaleString("id-ID")} poin
                            </span>
                            <span className="font-semibold text-forest">Builder</span>
                        </div>
                        <div
                            className="mt-2 h-2.5 rounded-full bg-mist"
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Progres menuju level Builder"
                        >
                            <div className="h-full rounded-full bg-leaf" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-muted">{NEXT_AT - POINTS} poin lagi untuk naik ke Builder</p>
                    </div>

                    <p className="mt-auto flex items-center gap-2 border-t border-line pt-4 text-sm text-muted">
                        <Trophy className="size-4 text-forest" aria-hidden />3 badge diraih
                    </p>
                </section>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                {stats.map(({ label, value, delta, Icon, tone }) => (
                    <div
                        key={label}
                        className="rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-md hover:shadow-forest/5"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
                                <Icon className="size-5" aria-hidden />
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-leaf">
                                <TrendingUp className="size-3.5" aria-hidden />
                                {delta}
                            </span>
                        </div>
                        <p className="mt-5 font-serif text-4xl font-medium leading-none text-forest">{value}</p>
                        <p className="mt-2 text-sm text-muted">{label}</p>
                    </div>
                ))}
            </div>
            <NearbyBankMap />

            <section className="rounded-xl border border-line bg-white p-6 sm:p-8 ">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-serif text-xl font-medium text-forest">Aktivitas terbaru</h2>
                    <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">
                        +{weekPoints} poin minggu ini
                    </span>
                </div>

                <ul className="relative mt-5 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-line">
                    {activity.map(({ text, when, points, Icon, tone }) => (
                        <li key={text} className="relative flex items-center gap-4 py-3">
                            <span className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-white ${tone}`}>
                                <Icon className="size-[18px]" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-ink">{text}</span>
                                <span className="block text-xs text-muted">{when}</span>
                            </span>
                            <span className="rounded-full bg-mist px-3 py-1 text-sm font-semibold tabular-nums text-leaf">
                                +{points}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}