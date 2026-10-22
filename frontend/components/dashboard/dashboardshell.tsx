"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Leaf,
    LogOut,
    ScanLine,
    TrendingUp,
    Users,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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

function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-forest text-mint">
                <Leaf className="size-5" aria-hidden />
            </span>
            <span className="font-serif text-base font-semibold leading-tight text-forest">
                Go Green Innovation
            </span>
        </Link>
    );
}

export default function DashboardShell() {
    const router = useRouter();
    const { user, isLoading, logout } = useAuth();
    const [view, setView] = useState<View>("dashboard");
    const [diyId, setDiyId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !user) router.replace("/login");
    }, [isLoading, user, router]);

    const go = (v: View) => {
        setDiyId(null);
        setView(v);
        window.scrollTo({ top: 0 });
    };

    const openTutorial = (id: string) => {
        setDiyId(id);
        setView("komunitas");
        window.scrollTo({ top: 0 });
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            router.push("/login");
        }
    };

    if (isLoading || !user) {
        return (
            <div className="grid min-h-screen place-items-center bg-paper text-sm text-muted">
                Memuat...
            </div>
        );
    }

    const name = user.name;

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
                    <p className="truncate font-semibold text-ink">{name}</p>
                    <p className="text-xs text-muted">Level Visionary</p>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-3 flex items-center gap-2 text-sm font-semibold text-forest"
                    >
                        <LogOut className="size-4" aria-hidden />
                        Keluar
                    </button>
                </div>
            </aside>

            <div className="min-w-0">
                <header className="flex h-14 items-center justify-between border-b border-line bg-white px-5 lg:hidden">
                    <Logo />
                    <button type="button" onClick={handleLogout} aria-label="Keluar" className="p-2 text-forest">
                        <LogOut className="size-5" aria-hidden />
                    </button>
                </header>

                <main className="mx-auto w-full max-w-[1600px] p-5 pb-28 sm:p-8 lg:px-10 lg:py-8 lg:pb-10">
                    {view === "dashboard" && <OverviewView name={name.split(" ")[0]} onScan={() => go("scan")} />}
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