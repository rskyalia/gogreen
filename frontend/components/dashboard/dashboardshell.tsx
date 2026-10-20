"use client";

import { useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    Leaf,
    LogOut,
    ScanLine,
    TrendingUp,
    Users,
    type LucideIcon,
} from "lucide-react";
import OverviewView from "./overviewView";
import ScanView from "./scanview";
import DiyView from "./DIYview";
import ImpactView from "./impactview";

export type View = "dashboard" | "scan" | "komunitas" | "dampak";

const nav: { key: View; label: string; Icon: LucideIcon }[] = [
    { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { key: "scan", label: "Scan Sampah", Icon: ScanLine },
    { key: "komunitas", label: "Komunitas DIY", Icon: Users },
    { key: "dampak", label: "Dampak Saya", Icon: TrendingUp },
];

const DUMMY_NAME = "Sinta Pratama";

function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-forest text-mint">
                <Leaf className="size-5" aria-hidden />
            </span>
            <span className="font-serif text-lg font-semibold leading-5 text-forest">
                Go Green Innovation
            </span>
        </Link>
    );
}

export default function DashboardShell() {
    const [view, setView] = useState<View>("dashboard");
    const [diyId, setDiyId] = useState<string | null>(null);

    const go = (v: View) => {
        setDiyId(null);
        setView(v);
        window.scrollTo({ top: 0 });
    };

    // dari hasil scan langsung ke tutorial tertentu di Komunitas DIY
    const openTutorial = (id: string) => {
        setDiyId(id);
        setView("komunitas");
        window.scrollTo({ top: 0 });
    };

    return (
        <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
            <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-white p-5 lg:flex">
                <Logo />
                <nav className="mt-8 space-y-1" aria-label="Menu dashboard">
                    {nav.map(({ key, label, Icon }) => {
                        const on = view === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => go(key)}
                                aria-current={on ? "page" : undefined}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${on ? "bg-forest text-white" : "text-ink/80 hover:bg-mist"
                                    }`}
                            >
                                <Icon className="size-5" aria-hidden />
                                {label}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto rounded-2xl bg-mist p-4">
                    <p className="truncate font-semibold text-ink">{DUMMY_NAME}</p>
                    <p className="text-xs text-muted">Level Visionary</p>
                    <Link
                        href="/"
                        className="mt-3 flex items-center gap-2 text-sm font-semibold text-forest"
                    >
                        <LogOut className="size-4" aria-hidden />
                        Keluar
                    </Link>
                </div>
            </aside>

            <div className="min-w-0">
                <header className="flex h-14 items-center justify-between border-b border-line bg-white px-5 lg:hidden">
                    <Logo />
                    <Link href="/" aria-label="Keluar" className="p-2 text-forest">
                        <LogOut className="size-5" aria-hidden />
                    </Link>
                </header>

                <main className="mx-auto w-full max-w-[1600px] p-5 pb-28 sm:p-8 lg:px-10 lg:py-8 lg:pb-10">
                    {view === "dashboard" && (
                        <OverviewView name={DUMMY_NAME.split(" ")[0]} onScan={() => go("scan")} />
                    )}
                    {view === "scan" && <ScanView onOpenTutorial={openTutorial} />}
                    {view === "komunitas" && <DiyView initialId={diyId} />}
                    {view === "dampak" && <ImpactView />}
                </main>
            </div>

            <nav
                aria-label="Menu dashboard"
                className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 backdrop-blur lg:hidden"
            >
                {nav.map(({ key, label, Icon }) => {
                    const on = view === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => go(key)}
                            aria-current={on ? "page" : undefined}
                            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${on ? "text-forest" : "text-muted"}`}
                        >
                            <Icon className="size-5" aria-hidden />
                            {label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}