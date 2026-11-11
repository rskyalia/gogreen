"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, getToken } from "@/lib/api";
import { timeAgo } from "@/lib/timeAgo";

import {
  Bell,
  BookOpen,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Leaf,
  Loader2,
  LogOut,
  Menu,
  PackagePlus,
  X,
} from "lucide-react";

// ── Nav config ─────────────────────────────────────────────────────────────

const MENU = [
  { label: "Ringkasan", href: "/community/dashboard", Icon: LayoutDashboard },
  { label: "Panduan DIY", href: "/community/guides", Icon: BookOpen },
  {
    label: "Validasi Karya",
    href: "/community/submissions",
    Icon: CheckSquare,
  },
  {
    label: "Request Bahan",
    href: "/community/material-requests",
    Icon: PackagePlus,
  },
];

// ── Logo ──────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/community/dashboard" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-full bg-forest text-mint">
        <Leaf className="size-5" aria-hidden />
      </span>

      <span className="font-serif text-base font-semibold leading-tight text-forest">
        Go Green
        <span className="block text-[10px] font-sans font-normal text-muted leading-none">
          Komunitas DIY
        </span>
      </span>
    </Link>
  );
}

// ── Navigation links ──────────────────────────────────────

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="flex-1 space-y-1 overflow-y-auto"
      aria-label="Menu komunitas"
    >
      {MENU.map(({ label, href, Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={[
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "bg-forest text-white"
                : "text-ink/80 hover:bg-mist hover:text-forest",
            ].join(" ")}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Profile card ──────────────────────────────────────────

function ProfileCard({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onNavigate?.();
    }
  };

  const avatarUrl = user.avatar_url || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=15803d&color=fff&bold=true`;

  return (
    <div className="rounded-2xl bg-mist p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="relative flex size-9 shrink-0 overflow-hidden items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
        >
          <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight text-ink">
            {user.name}
          </p>
          <p className="text-xs capitalize leading-tight text-muted">
            Komunitas DIY
          </p>
        </div>
      </div>

      {/* ── Tombol Atas Bawah (Edit Profil & Keluar) ── */}
      <div className="mt-3 flex flex-col gap-1.5">
        <Link
          href="/community/profile"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-mist hover:text-forest"
        >
          Edit Profil
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-forest transition-colors hover:bg-white/60"
        >
          <LogOut className="size-3.5" aria-hidden />
          Keluar
        </button>
      </div>
    </div>
  );
}
// ── Mobile drawer ─────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu komunitas"
        className={[
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl",
          "transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <Logo />

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="grid size-9 place-items-center rounded-xl text-muted hover:bg-mist hover:text-forest"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
          <NavLinks pathname={pathname} onNavigate={onClose} />
        </div>

        <div className="border-t border-line px-4 pb-6 pt-4">
          <ProfileCard onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}

// ── Mobile bottom navigation ──────────────────────────────

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navigasi bawah mobile"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-center gap-1">
        {MENU.map(({ label, href, Icon }) => {
          const active =
            pathname === href ||
            (href !== "/community/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "group flex flex-col items-center justify-center gap-1 rounded-xl py-1 transition-all",
                active
                  ? "text-forest font-bold"
                  : "text-muted hover:text-ink active:scale-95",
              ].join(" ")}
            >
              <div
                className={[
                  "relative grid size-8 place-items-center rounded-full transition-all",
                  active
                    ? "bg-forest text-mint shadow-xs"
                    : "text-ink/60 group-hover:bg-mist",
                ].join(" ")}
              >
                <Icon className="size-4" aria-hidden />
              </div>
              <span
                className={[
                  "truncate text-[10px] leading-none tracking-tight",
                  active ? "font-bold text-forest" : "font-medium text-muted",
                ].join(" ")}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Notification bell ─────────────────────────────────────

interface Notif {
  id: string;
  author: string;
  title: string;
  time: string;
  status: string;
  read: boolean;
}

interface SubmissionItem {
  id: string;
  author: string;
  title: string;
  time: string;
  status: string;
}

let cachedSubmissions: SubmissionItem[] | null = null;
let lastFetchTime = 0;
let inFlightPromise: Promise<SubmissionItem[]> | null = null;

async function fetchDiySubmissions(): Promise<SubmissionItem[]> {
  // 1. Ambil data dari /community/dashboard (endpoint dashboard komunitas yang mengambil dari diy_submissions)
  try {
    const res = await api.get<{
      data: {
        submissions?: Array<{
          id: number;
          user: string;
          guide: string;
          status: string;
          created_at: string | null;
        }>;
      };
    }>("/community/dashboard?limit=10");

    if (res?.data?.submissions && Array.isArray(res.data.submissions)) {
      return res.data.submissions.map((s) => ({
        id: String(s.id),
        author: s.user || "Pengguna",
        title: s.guide || "Karya DIY",
        time: timeAgo(s.created_at),
        status: s.status,
      }));
    }
  } catch {
    // Abaikan jika bukan role community atau endpoint tidak tersedia
  }

  // 2. Fallback: ambil data dari /admin/diy-submissions jika ada akses developer
  try {
    const adminRes = await api.get<{
      data: Array<{
        id: number;
        user?: { name: string } | null;
        diy_guide?: { title: string } | null;
        diyGuide?: { title: string } | null;
        title?: string | null;
        status: string;
        created_at: string | null;
      }>;
    }>("/admin/diy-submissions?per_page=10");

    if (adminRes?.data && Array.isArray(adminRes.data)) {
      return adminRes.data.map((s) => ({
        id: String(s.id),
        author: s.user?.name || "Pengguna",
        title: s.diy_guide?.title ?? s.diyGuide?.title ?? s.title ?? "Karya DIY",
        time: timeAgo(s.created_at),
        status: s.status,
      }));
    }
  } catch {
    // Abaikan jika tidak punya akses ke admin endpoint
  }

  return [];
}

async function getDiySubmissions(force = false): Promise<SubmissionItem[]> {
  const now = Date.now();
  if (!force && cachedSubmissions && now - lastFetchTime < 10000) {
    return cachedSubmissions;
  }
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const items = await fetchDiySubmissions();
      cachedSubmissions = items;
      lastFetchTime = Date.now();
      return items;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

function NotifBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("gg_read_community_submissions");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const readIdsRef = useRef(readIds);
  readIdsRef.current = readIds;

  const loadSubmissions = useCallback(async (force = false) => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const items = await getDiySubmissions(force);
      setNotifs(
        items.map((item) => ({
          ...item,
          read: readIdsRef.current.has(item.id) || item.status !== "pending",
        }))
      );
    } catch (err) {
      console.error("Gagal memuat notifikasi karya:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();

    const handleTick = () => {
      if (document.visibilityState === "visible") {
        loadSubmissions(true);
      }
    };

    const timer = setInterval(handleTick, 30_000);
    document.addEventListener("visibilitychange", handleTick);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleTick);
    };
  }, [loadSubmissions]);

  useEffect(() => {
    if (!open) return;

    function handleOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open]);

  const markAllAsRead = useCallback(() => {
    setNotifs((prev) => prev.map((item) => ({ ...item, read: true })));
    setReadIds((prev) => {
      const next = new Set(prev);
      notifs.forEach((n) => next.add(n.id));
      try {
        localStorage.setItem(
          "gg_read_community_submissions",
          JSON.stringify(Array.from(next))
        );
      } catch {
        // Abaikan jika quota / localStorage error
      }
      return next;
    });
  }, [notifs]);

  const handleToggle = () => {
    setOpen((prev) => {
      const willOpen = !prev;
      if (willOpen) {
        markAllAsRead();
        loadSubmissions(true);
      }
      return willOpen;
    });
  };

  const unread = notifs.filter((item) => !item.read).length;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifikasi"
        className="relative grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-mist hover:text-forest"
      >
        <Bell className="size-5" aria-hidden />

        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-3">
            <p className="text-xs font-bold text-ink">Pengajuan Karya</p>

            <Link
              href="/community/submissions"
              onClick={() => setOpen(false)}
              className="text-[10px] font-semibold text-leaf hover:underline"
            >
              Lihat semua →
            </Link>
          </div>

          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {loading && notifs.length === 0 ? (
              <li className="flex items-center justify-center gap-2 py-8 text-xs text-muted">
                <Loader2 className="size-4 animate-spin text-forest" />
                <span>Memuat notifikasi...</span>
              </li>
            ) : notifs.length === 0 ? (
              <li className="py-8 text-center text-xs text-muted">
                Belum ada notifikasi.
              </li>
            ) : (
              notifs.map((item) => (
                <li
                  key={item.id}
                  className={[
                    "transition-colors hover:bg-mist/40",
                    !item.read ? "bg-mist/30" : "",
                  ].join(" ")}
                >
                  <Link
                    href="/community/submissions"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-mint text-forest">
                      <FileText className="size-3.5" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-semibold text-ink">
                          {item.author}
                        </p>
                        {item.status && (
                          <span
                            className={[
                              "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium",
                              item.status === "pending"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : item.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200",
                            ].join(" ")}
                          >
                            {item.status === "pending"
                              ? "Menunggu"
                              : item.status === "approved"
                              ? "Disetujui"
                              : "Ditolak"}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">{item.time}</p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeItem = MENU.find((item) => item.href === pathname);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-line bg-white p-5 md:flex"
        aria-label="Navigasi komunitas"
      >
        <Logo />

        <div className="mt-8 flex flex-1 flex-col overflow-hidden">
          <NavLinks pathname={pathname} />
        </div>

        <div className="mt-4">
          <ProfileCard />
        </div>
      </aside>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
      />

      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Buka menu navigasi"
        className="fixed left-4 top-3.5 z-30 grid size-9 place-items-center rounded-xl text-ink/70 transition-colors hover:bg-mist hover:text-forest md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Main content */}
      <div className="min-w-0 md:ml-64">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:hidden">
          <div className="w-9 shrink-0" aria-hidden />
          <Logo />
          <NotifBell />
        </header>

        {/* Desktop topbar */}
        <header className="hidden h-14 items-center justify-end border-b border-line bg-white px-6 md:flex">
          <NotifBell />
        </header>

        {/* Active breadcrumb */}
        {activeItem && (
          <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2 md:hidden">
            <activeItem.Icon
              className="size-4 shrink-0 text-leaf"
              aria-hidden
            />
            <span className="text-xs font-semibold text-ink">
              {activeItem.label}
            </span>
          </div>
        )}

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1400px] p-4 pb-24 sm:p-6 sm:pb-8 lg:px-8 lg:py-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav pathname={pathname} />
    </div>
  );
}
  