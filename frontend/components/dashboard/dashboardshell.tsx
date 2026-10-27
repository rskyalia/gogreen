"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Leaf,
    LogOut,
    Recycle,
    ScanLine,
    TrendingUp,
    Upload,
    Users,
    Bell,
    Settings,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { SAMPLE_SUBMISSIONS, type Submission } from "@/lib/submissons";
import OverviewView from "./overviewView";
import ScanView from "./scanview";
import DiyView from "./DIYview";
import UploadView from "./SetoranView";
import ImpactView from "./impactview";
import EditProfileView from "./EditProfileView";
import SetoranBuatView from "./SetoranBuatView";

export type View =
    | "dashboard"
    | "scan"
    | "komunitas"
    | "upload"
    | "dampak"
    | "setor"
    | "edit-profile";

interface NotificationItem {
    id: string;
    type: string;
    data: {
        deposit_id?: number;
        waste_bank_name?: string;
        total_kg?: number;
        total_points?: number;
    };
    read_at: string | null;
    created_at: string;
}

interface NotifResponse {
    data: NotificationItem[];
    unread_count: number;
}

const nav: { key: View; label: string; Icon: LucideIcon }[] = [
    { key: "dashboard", label: "Dashboard",     Icon: LayoutDashboard },
    { key: "scan",      label: "Scan Sampah",   Icon: ScanLine },
    { key: "setor",     label: "Setor Sampah",  Icon: Recycle },
    { key: "komunitas", label: "Komunitas DIY", Icon: Users },
    { key: "upload",    label: "Upload Karya",  Icon: Upload },
    { key: "dampak",    label: "Dampak Saya",   Icon: TrendingUp },
];

const POLL_INTERVAL_MS = 15_000;

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
    const [submissions, setSubmissions] = useState<Submission[]>(SAMPLE_SUBMISSIONS);

    const [notifs, setNotifs] = useState<NotificationItem[]>([]);
    const [unread, setUnread] = useState(0);
    const [panelOpen, setPanelOpen] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const isUserRole = user?.role === "user";

    const fetchNotifications = useCallback(async () => {
        if (!isUserRole) return;
        try {
            const res = await api.get<NotifResponse>("/user/notifications");
            setNotifs(res.data);
            setUnread(res.unread_count);
        } catch {
            // ignore
        }
    }, [isUserRole]);

    useEffect(() => {
        if (!isUserRole) return;
        fetchNotifications();
        intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isUserRole, fetchNotifications]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setPanelOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleMarkAllRead() {
        try {
            await api.patch("/user/notifications/read-all", {});
            setUnread(0);
            setNotifs((prev) =>
                prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
            );
        } catch {
            // ignore
        }
    }

    async function handleMarkRead(id: string) {
        try {
            await api.patch(`/user/notifications/${id}/read`, {});
            setNotifs((prev) =>
                prev.map((n) =>
                    n.id === id ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
            setUnread((c) => Math.max(0, c - 1));
        } catch {
            // ignore
        }
    }

    // ── Auth Guard & Handlers ──────────────────────────────────────────────
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
        <div className="min-h-screen bg-paper">
            <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-line bg-white p-5 lg:flex">
                <div className="flex items-center justify-between">
                    <Logo />

                    {/* Icon Notifikasi & Popover Panel */}
                    {isUserRole && (
                        <div className="relative" ref={panelRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setPanelOpen((o) => !o);
                                    if (!panelOpen && unread > 0) handleMarkAllRead();
                                }}
                                className="relative flex items-center justify-center rounded-lg p-1.5 text-muted transition-colors hover:bg-mist hover:text-forest"
                                aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ""
                                    }`}
                            >
                                <Bell size={18} aria-hidden="true" />
                                {unread > 0 && (
                                    <span
                                        className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
                                        aria-hidden="true"
                                    >
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </button>

                            {panelOpen && (
                                <div
                                    className="absolute left-full top-0 z-50 ml-3 w-80 rounded-2xl border border-line bg-white shadow-xl"
                                    role="dialog"
                                    aria-label="Daftar notifikasi"
                                >
                                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                                        <p className="text-sm font-semibold text-ink">Notifikasi</p>
                                        {unread > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleMarkAllRead}
                                                className="text-xs text-leaf hover:underline"
                                            >
                                                Tandai semua dibaca
                                            </button>
                                        )}
                                    </div>

                                    <ul
                                        className="max-h-80 overflow-y-auto divide-y divide-line"
                                        role="list"
                                    >
                                        {notifs.length === 0 ? (
                                            <li className="py-8 text-center text-sm text-muted">
                                                Belum ada notifikasi
                                            </li>
                                        ) : (
                                            notifs.map((n) => (
                                                <NotifItem
                                                    key={n.id}
                                                    notif={n}
                                                    onRead={handleMarkRead}
                                                />
                                            ))
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigasi Utama */}
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

                {/* Profile Card & Action */}
                <div className="mt-auto rounded-2xl bg-mist p-4">
                    <div className="mb-2 flex items-center gap-3">
                        <div
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
                        >
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold leading-tight text-ink">
                                {name}
                            </p>
                            <p className="text-xs capitalize leading-tight text-muted">
                                {user.role.replace("_", " ")}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => go("edit-profile")}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-2 text-xs font-semibold text-ink transition-colors hover:bg-paper"
                    >
                        <Settings className="size-3.5 text-muted" />
                        Edit Profil
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-forest transition-colors hover:bg-white/60"
                    >
                        <LogOut className="size-3.5" aria-hidden />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT AREA (DIBERI MARGIN KIRIlg:ml-64) ── */}
            <div className="min-w-0 lg:ml-64">
                {/* Mobile Header */}
                <header className="flex h-14 items-center justify-between border-b border-line bg-white px-5 lg:hidden">
                    <Logo />
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => go("edit-profile")}
                            aria-label="Edit Profil"
                            className="p-2 text-ink/70 hover:text-forest"
                        >
                            <Settings className="size-5" aria-hidden />
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Keluar"
                            className="p-2 text-forest"
                        >
                            <LogOut className="size-5" aria-hidden />
                        </button>
                    </div>
                </header>

                {/* Dynamic Content Views */}
                <main className="mx-auto w-full max-w-[1600px] p-5 pb-28 sm:p-8 lg:px-10 lg:py-8 lg:pb-10">
                    {view === "dashboard" && (
                        <OverviewView
                            name={name.split(" ")[0]}
                            onScan={() => go("scan")}
                        />
                    )}
                    {view === "scan" && <ScanView onOpenTutorial={openTutorial} />}
                    {view === "komunitas" && <DiyView initialId={diyId} />}
                    {view === "upload" && (
                        <UploadView
                            onSubmit={(item) => setSubmissions((prev) => [item, ...prev])}
                            onDone={() => go("dampak")}
                        />
                    )}
                    {view === "dampak" && (
                        <ImpactView
                            submissions={submissions}
                            onUpload={() => go("upload")}
                        />
                    )}
                    {view === "setor" && (
                        <SetoranBuatView onGoHistory={() => go("dampak")} />
                    )}
                    {view === "edit-profile" && (
                        <EditProfileView onBack={() => go("dashboard")} />
                    )}
                </main>
            </div>

            {/* ── MOBILE BOTTOM NAV ── */}
            <nav
                aria-label="Menu dashboard"
                className="fixed inset-x-0 bottom-0 z-30 grid grid-flow-col auto-cols-fr border-t border-line bg-white/95 backdrop-blur lg:hidden"
            >
                {nav.map(({ key, label, Icon }) => {
                    const on = view === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => go(key)}
                            aria-current={on ? "page" : undefined}
                            className={`flex flex-col items-center gap-1 px-0.5 py-2.5 text-center text-[10px] font-semibold leading-tight ${on ? "text-forest" : "text-muted"
                                }`}
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

// ── Sub-komponen Notifikasi ──────────────────────────────────────────────

function NotifItem({
    notif,
    onRead,
}: {
    notif: NotificationItem;
    onRead: (id: string) => void;
}) {
    const d = notif.data;
    const isUnread = !notif.read_at;

    return (
        <li
            className={[
                "flex items-start gap-3 px-4 py-3 transition-colors",
                isUnread ? "bg-mist/50" : "",
            ].join(" ")}
        >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest/10">
                <Bell size={13} className="text-forest" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink">
                    Setoran berhasil dicatat
                </p>
                {d.waste_bank_name && (
                    <p className="mt-0.5 text-xs text-muted">
                        {d.waste_bank_name} · {d.total_kg?.toFixed(2)} kg · +
                        {d.total_points?.toLocaleString("id-ID")} poin
                    </p>
                )}
                <p className="mt-1 text-[10px] text-muted">
                    {notif.created_at
                        ? new Date(notif.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : ""}
                </p>
            </div>
            {isUnread && (
                <button
                    type="button"
                    onClick={() => onRead(notif.id)}
                    className="mt-0.5 shrink-0 text-[10px] text-leaf hover:underline"
                    aria-label="Tandai dibaca"
                >
                    Baca
                </button>
            )}
        </li>
    );
}