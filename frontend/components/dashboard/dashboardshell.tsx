"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    LayoutDashboard,
    Leaf,
    LogOut,
    Menu,
    Recycle,
    ScanLine,
    Settings,
    TrendingUp,
    Upload,
    Users,
    X,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { fetchMySubmissions, type Submission } from "@/lib/submissons";
import OverviewView from "./overviewView";
import ScanView from "./scanview";
import DiyView from "./DIYview";
import UploadView from "./SetoranView";
import ImpactView from "./impactview";
import EditProfileView from "./EditProfileView";
import SetoranBuatView from "./SetoranBuatView";

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Nav config ─────────────────────────────────────────────────────────────

const nav: { key: View; label: string; Icon: LucideIcon }[] = [
    { key: "dashboard",  label: "Dashboard",     Icon: LayoutDashboard },
    { key: "scan",       label: "Scan Sampah",   Icon: ScanLine        },
    { key: "setor",      label: "Setor Sampah",  Icon: Recycle         },
    { key: "komunitas",  label: "Komunitas DIY", Icon: Users           },
    { key: "upload",     label: "Upload Karya",  Icon: Upload          },
    { key: "dampak",     label: "Dampak Saya",   Icon: TrendingUp      },
];

const POLL_INTERVAL_MS = 15_000;

// ── Logo ───────────────────────────────────────────────────────────────────

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

// ── Mobile Drawer ──────────────────────────────────────────────────────────

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    view: View;
    onGo: (v: View) => void;
    name: string;
    role: string;
    unread: number;
    notifs: NotificationItem[];
    onMarkAllRead: () => void;
    onMarkRead: (id: string) => void;
    onLogout: () => void;
}

function MobileDrawer({
    open,
    onClose,
    view,
    onGo,
    name,
    role,
    unread,
    notifs,
    onMarkAllRead,
    onMarkRead,
    onLogout,
}: DrawerProps) {
    // Tutup dengan tombol Escape
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Kunci scroll body saat drawer terbuka
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={[
                    "fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                ].join(" ")}
                aria-hidden
                onClick={onClose}
            />

            {/* Drawer panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Menu navigasi"
                className={[
                    "fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl",
                    "transition-transform duration-300 ease-in-out lg:hidden",
                    open ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
            >
                {/* Header drawer */}
                <div className="flex h-14 items-center justify-between border-b border-line px-5">
                    <Logo />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup menu"
                        className="grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-mist hover:text-forest"
                    >
                        <X className="size-5" aria-hidden />
                    </button>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Menu dashboard">
                    <ul className="space-y-1" role="list">
                        {nav.map(({ key, label, Icon }) => {
                            const on = view === key;
                            return (
                                <li key={key}>
                                    <button
                                        type="button"
                                        onClick={() => { onGo(key); onClose(); }}
                                        aria-current={on ? "page" : undefined}
                                        className={[
                                            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                                            on ? "bg-forest text-white" : "text-ink/80 hover:bg-mist hover:text-forest",
                                        ].join(" ")}
                                    >
                                        <Icon className="size-5 shrink-0" aria-hidden />
                                        {label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Notifikasi */}
                    {notifs.length > 0 && (
                        <div className="mt-5 border-t border-line pt-4">
                            <div className="mb-2 flex items-center justify-between px-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted">
                                    Notifikasi
                                </p>
                                {unread > 0 && (
                                    <button
                                        type="button"
                                        onClick={onMarkAllRead}
                                        className="text-[10px] font-semibold text-leaf hover:underline"
                                    >
                                        Tandai semua
                                    </button>
                                )}
                            </div>
                            <ul className="max-h-48 overflow-y-auto rounded-xl border border-line divide-y divide-line">
                                {notifs.slice(0, 5).map((n) => (
                                    <NotifItem key={n.id} notif={n} onRead={onMarkRead} />
                                ))}
                            </ul>
                        </div>
                    )}
                </nav>

                {/* Profile card + actions */}
                <div className="border-t border-line p-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-mist px-4 py-3">
                        <div
                            aria-hidden
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
                        >
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight text-ink">{name}</p>
                            <p className="text-xs capitalize leading-tight text-muted">{role.replace("_", " ")}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => { onGo("edit-profile"); onClose(); }}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-mist"
                    >
                        <Settings className="size-4 text-muted" aria-hidden />
                        Edit Profil
                    </button>
                    <button
                        type="button"
                        onClick={() => { onLogout(); onClose(); }}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                    >
                        <LogOut className="size-4" aria-hidden />
                        Keluar
                    </button>
                </div>
            </aside>
        </>
    );
}

// ── Main Shell ─────────────────────────────────────────────────────────────

export default function DashboardShell() {
    const router = useRouter();
    const { user, isLoading, logout } = useAuth();
    const [view, setView] = useState<View>("dashboard");
    const [diyId, setDiyId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [notifs, setNotifs] = useState<NotificationItem[]>([]);
    const [unread, setUnread] = useState(0);
    const [panelOpen, setPanelOpen] = useState(false);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const panelRef    = useRef<HTMLDivElement>(null);

    const isUserRole = user?.role === "user";

    // ── Data fetchers ──────────────────────────────────────────────────────

    const loadSubmissions = useCallback(async () => {
        if (!isUserRole) return;
        try { setSubmissions(await fetchMySubmissions()); } catch { /* silent */ }
    }, [isUserRole]);

    const fetchNotifications = useCallback(async () => {
        if (!isUserRole) return;
        try {
            const res = await api.get<NotifResponse>("/user/notifications");
            setNotifs(res.data);
            setUnread(res.unread_count);
        } catch { /* ignore */ }
    }, [isUserRole]);

    useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

    useEffect(() => {
        if (!isUserRole) return;
        fetchNotifications();
        intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isUserRole, fetchNotifications]);

    // Tutup notif popover saat klik di luar (desktop)
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setPanelOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── Notification handlers ──────────────────────────────────────────────

    async function handleMarkAllRead() {
        try {
            await api.patch("/user/notifications/read-all", {});
            setUnread(0);
            setNotifs((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
        } catch { /* ignore */ }
    }

    async function handleMarkRead(id: string) {
        try {
            await api.patch(`/user/notifications/${id}/read`, {});
            setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnread((c) => Math.max(0, c - 1));
        } catch { /* ignore */ }
    }

    // ── Auth guard ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isLoading && !user) router.replace("/login");
    }, [isLoading, user, router]);

    // ── Navigation ─────────────────────────────────────────────────────────

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
        try { await logout(); } catch { router.push("/login"); }
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

            {/* ── Desktop Sidebar ────────────────────────────────────────── */}
            <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-line bg-white p-5 lg:flex">
                <div className="flex items-center justify-between">
                    <Logo />

                    {/* Notifikasi desktop */}
                    {isUserRole && (
                        <div className="relative" ref={panelRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setPanelOpen((o) => !o);
                                    if (!panelOpen && unread > 0) handleMarkAllRead();
                                }}
                                className="relative flex items-center justify-center rounded-lg p-1.5 text-muted transition-colors hover:bg-mist hover:text-forest"
                                aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ""}`}
                            >
                                <Bell size={18} aria-hidden="true" />
                                {unread > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white" aria-hidden="true">
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </button>

                            {panelOpen && (
                                <div className="absolute left-full top-0 z-50 ml-3 w-80 rounded-2xl border border-line bg-white shadow-xl" role="dialog" aria-label="Daftar notifikasi">
                                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                                        <p className="text-sm font-semibold text-ink">Notifikasi</p>
                                        {unread > 0 && (
                                            <button type="button" onClick={handleMarkAllRead} className="text-xs text-leaf hover:underline">
                                                Tandai semua dibaca
                                            </button>
                                        )}
                                    </div>
                                    <ul className="max-h-80 divide-y divide-line overflow-y-auto" role="list">
                                        {notifs.length === 0
                                            ? <li className="py-8 text-center text-sm text-muted">Belum ada notifikasi</li>
                                            : notifs.map((n) => <NotifItem key={n.id} notif={n} onRead={handleMarkRead} />)
                                        }
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Nav desktop */}
                <nav className="mt-8 space-y-1" aria-label="Menu dashboard">
                    {nav.map(({ key, label, Icon }) => {
                        const on = view === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => go(key)}
                                aria-current={on ? "page" : undefined}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${on ? "bg-forest text-white" : "text-ink/80 hover:bg-mist"}`}
                            >
                                <Icon className="size-5" aria-hidden />
                                {label}
                            </button>
                        );
                    })}
                </nav>

                {/* Profile card desktop */}
                <div className="mt-auto rounded-2xl bg-mist p-4">
                    <div className="mb-2 flex items-center gap-3">
                        <div aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold leading-tight text-ink">{name}</p>
                            <p className="text-xs capitalize leading-tight text-muted">{user.role.replace("_", " ")}</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => go("edit-profile")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-2 text-xs font-semibold text-ink transition-colors hover:bg-paper">
                        <Settings className="size-3.5 text-muted" /> Edit Profil
                    </button>
                    <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-forest transition-colors hover:bg-white/60">
                        <LogOut className="size-3.5" aria-hidden /> Keluar
                    </button>
                </div>
            </aside>

            {/* ── Mobile Drawer ──────────────────────────────────────────── */}
            <MobileDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                view={view}
                onGo={go}
                name={name}
                role={user.role}
                unread={unread}
                notifs={notifs}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
                onLogout={handleLogout}
            />

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="min-w-0 lg:ml-60">

                {/* Mobile header */}
                <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
                    {/* Hamburger button */}
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Buka menu"
                        className="grid size-9 place-items-center rounded-xl text-ink/70 transition-colors hover:bg-mist hover:text-forest"
                    >
                        <Menu className="size-5" aria-hidden />
                    </button>

                    <Logo />

                    {/* Bell notifikasi mobile + badge */}
                    {isUserRole ? (
                        <button
                            type="button"
                            onClick={() => { setDrawerOpen(true); }}
                            aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ""}`}
                            className="relative grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-mist hover:text-forest"
                        >
                            <Bell className="size-5" aria-hidden />
                            {unread > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white" aria-hidden>
                                    {unread > 9 ? "9+" : unread}
                                </span>
                            )}
                        </button>
                    ) : (
                        /* spacer agar Logo tetap tengah */
                        <div className="size-9" aria-hidden />
                    )}
                </header>

                {/* Breadcrumb aktif halaman (mobile, di bawah header) */}
                <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2 lg:hidden">
                    {(() => {
                        const current = nav.find((n) => n.key === view);
                        if (!current) return null;
                        const Icon = current.Icon;
                        return (
                            <>
                                <Icon className="size-4 shrink-0 text-leaf" aria-hidden />
                                <span className="text-xs font-semibold text-ink">{current.label}</span>
                            </>
                        );
                    })()}
                </div>

                {/* Views */}
                <main className="mx-auto w-full max-w-[1400px] p-4 pb-8 sm:p-6 lg:px-8 lg:py-8 lg:pb-10">
                    {view === "dashboard" && <OverviewView name={name.split(" ")[0]} onScan={() => go("scan")} />}
                    {view === "scan" && <ScanView onOpenTutorial={openTutorial} />}
                    {view === "komunitas" && <DiyView initialId={diyId} />}
                    {view === "upload" && <UploadView onDone={() => go("dampak")} onSuccess={loadSubmissions} />}
                    {view === "dampak" && <ImpactView submissions={submissions} onUpload={() => go("upload")} />}
                    {view === "setor" && <SetoranBuatView onGoHistory={() => go("dampak")} />}
                    {view === "edit-profile" && <EditProfileView onBack={() => go("dashboard")} />}
                </main>
            </div>
        </div>
    );
}

// ── NotifItem ──────────────────────────────────────────────────────────────

function NotifItem({ notif, onRead }: { notif: NotificationItem; onRead: (id: string) => void }) {
    const d = notif.data;
    const isUnread = !notif.read_at;

    return (
        <li className={["flex items-start gap-3 px-4 py-3 transition-colors", isUnread ? "bg-mist/50" : ""].join(" ")}>
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest/10">
                <Bell size={13} className="text-forest" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink">Setoran berhasil dicatat</p>
                {d.waste_bank_name && (
                    <p className="mt-0.5 text-xs text-muted">
                        {d.waste_bank_name} · {d.total_kg?.toFixed(2)} kg · +{d.total_points?.toLocaleString("id-ID")} poin
                    </p>
                )}
                <p className="mt-1 text-[10px] text-muted">
                    {notif.created_at
                        ? new Date(notif.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : ""}
                </p>
            </div>
            {isUnread && (
                <button type="button" onClick={() => onRead(notif.id)} className="mt-0.5 shrink-0 text-[10px] text-leaf hover:underline" aria-label="Tandai dibaca">
                    Baca
                </button>
            )}
        </li>
    );
}
