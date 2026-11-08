'use client';

import "../globals.css";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function firstError(err: unknown, fallback = "Terjadi kesalahan."): string {
  const error = err as { message?: string; errors?: Record<string, string[]> };

  if (error?.errors) {
    const first = Object.values(error.errors)[0];
    if (Array.isArray(first) && first.length > 0) return first[0];
  }

  return error?.message ?? fallback;
}
import {
  Bell,
  BookOpen,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  PackagePlus,
  X,
} from 'lucide-react';

// ── Nav config ─────────────────────────────────────────────────────────────

const MENU = [
  { label: 'Ringkasan',       href: '/community/dashboard',         Icon: LayoutDashboard },
  { label: 'Panduan DIY',     href: '/community/guides',            Icon: BookOpen        },
  { label: 'Validasi Karya',  href: '/community/submissions',       Icon: CheckSquare     },
  { label: 'Request Bahan',   href: '/community/material-requests', Icon: PackagePlus     },
];

// ── Dummy notifikasi (ganti dengan API saat siap) ──────────────────────────

interface Notif {
  id: string;
  author: string;
  title: string;
  time: string;
  read: boolean;
}

const DUMMY_NOTIFS: Notif[] = [
  { id: '1', author: 'Budi Santoso',  title: 'Pot Bunga dari Botol Plastik Bekas',       time: '10 mnt lalu', read: false },
  { id: '2', author: 'Siti Rahma',    title: 'Lampu Hias dari Bambu Daur Ulang',          time: '1 jam lalu',  read: false },
  { id: '3', author: 'Ahmad Fauzi',   title: 'Kompostor Sederhana Skala Rumah Tangga',    time: '3 jam lalu',  read: true  },
];

// ── Logo ───────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/community/dashboard" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-full bg-forest text-mint">
        <Leaf className="size-5" aria-hidden />
      </span>
      <span className="font-serif text-base font-semibold leading-tight text-forest">
        Go Green<span className="block text-[10px] font-sans font-normal text-muted leading-none">Komunitas DIY</span>
      </span>
    </Link>
  );
}

// ── NavLinks ───────────────────────────────────────────────────────────────

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Menu komunitas">
      {MENU.map(({ label, href, Icon }) => {
        const on = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={on ? 'page' : undefined}
            className={[
              'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
              on ? 'bg-forest text-white' : 'text-ink/80 hover:bg-mist hover:text-forest',
            ].join(' ')}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── ProfileCard ────────────────────────────────────────────────────────────

  // Tutup menu mobile secara otomatis saat berpindah halaman
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // State Notifikasi
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const formatRelativeTime = (isoDate: string | null) => {
    if (!isoDate) return "baru saja";

    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam yang lalu`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} hari yang lalu`;
  };

  const mapSubmissionToNotification = (submission: any): NotificationItem => ({
    id: String(submission.id),
    authorName: submission.user?.name ?? "Pengguna",
    title: `Mengajukan karya: ${submission.diy_guide?.title ?? submission.diyGuide?.title ?? "Karya DIY"}`,
    time: formatRelativeTime(submission.created_at),
    isRead: submission.status !== "pending",
    status: submission.status,
  });

  const fetchNotifications = async (silent = false) => {
    if (!silent) setIsNotificationsLoading(true);
    setNotificationsError(null);

    try {
      const res = await api.get<{ data: any[] }>('/admin/diy-submissions?per_page=100');
      const items = Array.isArray(res.data) ? res.data : [];
      setNotifications(items.map(mapSubmissionToNotification));
    } catch (error) {
      setNotificationsError(firstError(error, "Gagal memuat notifikasi karya."));
      setNotifications([]);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Hitung berapa notifikasi yang belum dibaca
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  // Sembunyikan dropdown saat klik di luar area bel/dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handler untuk menandai semua notifikasi sudah dibaca
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true }))
    );
  };

  // Handler aksi validasi karya langsung dari notifikasi
  const handleAction = async (id: string, action: "approved" | "rejected") => {
    try {
      await api.patch(`/admin/diy-submissions/${id}/review`, {
        status: action,
        review_note:
          action === "rejected"
            ? "Karya tidak memenuhi kriteria validasi komunitas."
            : undefined,
      });

      await fetchNotifications(true);
    } catch (error) {
      console.error("Error saat validasi notifikasi:", error);
      setNotificationsError(firstError(error, "Gagal memproses validasi karya."));
    }
  };

  // 🔴 PERBAIKAN LOGOUT MENGGUNAKAN AUTHCONTEXT
  const confirmLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error("Error saat proses logout:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      window.location.href = "/";
    }
  };

  const menuItems = [
    { name: "Ringkasan", href: "/community/dashboard", icon: LayoutDashboard },
    { name: "Panduan DIY", href: "/community/guides", icon: BookOpen },
    { name: "Validasi Karya", href: "/community/submissions", icon: CheckSquare },
    { name: "Request Bahan", href: "/community/material-requests", icon: PackagePlus },
  ];

  const renderNotificationContent = () => {
    if (isNotificationsLoading) {
      return (
        <div className="p-6 text-center text-xs text-[#6b8279]">
          Memuat notifikasi...
        </div>
      );
    }

    if (notificationsError) {
      return (
        <div className="p-4 text-center text-xs text-red-600">
          {notificationsError}
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="p-6 text-center text-xs text-[#6b8279]">
          Belum ada pengajuan karya dari warga.
        </div>
      );
    }

    return notifications.map((item) => (
      <div
        key={item.id}
        className={`p-3 sm:p-3.5 transition-all ${
          !item.isRead ? "bg-[#e1f3e9]/40" : "bg-white"
        }`}
      >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded-full bg-[#cfeedd] text-[#0b4d36] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-[#0b4d36]" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-bold text-[#1d3b2f] break-words">
                {item.authorName}
              </p>
              <span className="text-[9px] sm:text-[10px] text-[#6b8279] whitespace-nowrap">
                {item.time}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#426355] leading-snug break-words">
              {item.title}
            </p>

            <div className="pt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {item.status === "pending" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAction(item.id, "approved")}
                    className="px-2.5 py-1 bg-[#0b4d36] hover:bg-[#1f8a5b] text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Terima
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "rejected")}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-red-200"
                  >
                    <XCircle className="w-3 h-3" /> Tolak
                  </button>
                </div>
              ) : (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.status === "approved" ? "Disetujui" : "Ditolak"}
                </span>
              )}

              <Link
                href="/community/submissions"
                onClick={() => setShowNotifications(false)}
                className="text-[10px] sm:text-[10px] text-[#1f8a5b] font-bold hover:underline whitespace-nowrap self-start"
              >
                Tinjau Detail →
              </Link>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="rounded-2xl bg-mist p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight text-ink">{user.name}</p>
          <p className="text-xs capitalize leading-tight text-muted">Komunitas DIY</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => { logout(); onNavigate?.(); }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-forest transition-colors hover:bg-white/60"
      >
        <LogOut className="size-3.5" aria-hidden />
        Keluar
      </button>
    </div>
  );
}

// ── Mobile Drawer ──────────────────────────────────────────────────────────

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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu komunitas"
        className={[
          'fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl',
          'transition-transform duration-300 ease-in-out md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="grid size-9 place-items-center rounded-xl text-muted hover:bg-mist hover:text-forest transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#0b4d36]" /> : <Menu className="w-5 h-5 text-[#0b4d36]" />}
          </button>

          <Link href="/community/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0b4d36] text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center tracking-tight shadow-xs group-hover:bg-[#0a3f2d] transition-all">
              GG
            </div>
            <div className="flex flex-col justify-center leading-none">
              <span className="font-sans font-bold text-sm sm:text-base text-[#0b4d36] tracking-wide uppercase">
                GO GREEN
              </span>
              <span className="text-[10px] sm:text-xs text-[#6b8279] font-normal mt-0.5">
                Komunitas DIY
              </span>
            </div>
          </Link>
        </div>

        {/* Profile, Notifikasi & Tombol Keluar */}
        <div className="flex items-center gap-4">
          {/* Container Tombol & Pop-up Notifikasi */}
          <div className="relative z-40" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              title="Notifikasi Pengajuan Karya"
              className="relative flex-shrink-0 p-2 text-[#6b8279] hover:bg-[#e1f3e9] hover:text-[#0b4d36] rounded-full transition-all cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {/* Badge Jumlah Notifikasi Belum Dibaca */}
              {unreadCount > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full absolute -top-0.5 -right-0.5 flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Menu Pop-up Dropdown Notifikasi */}
            {showNotifications && (
              <div className="fixed inset-x-3 top-16 z-[60] w-auto max-w-sm bg-white rounded-2xl border border-[#d7e6dd] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[calc(100vw-2rem)] sm:max-w-sm">
                <div className="p-3 sm:p-4 border-b border-[#d7e6dd] flex items-center justify-between gap-2 bg-[#f5faf7]">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-[11px] sm:text-xs font-bold text-[#1d3b2f] uppercase tracking-wider truncate">
                      Pengajuan Karya Warga
                    </h4>
                    {unreadCount > 0 && (
                      <span className="bg-[#1f8a5b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] sm:text-[11px] text-[#1f8a5b] hover:underline font-semibold cursor-pointer whitespace-nowrap"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-[#edf4f0]">
                  {renderNotificationContent()}
                </div>

                <div className="p-2.5 border-t border-[#d7e6dd] bg-[#f5faf7] text-center">
                  <Link
                    href="/community/submissions"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] sm:text-xs font-bold text-[#0b4d36] hover:underline block py-1"
                  >
                    Lihat Semua Validasi Karya
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-[#d7e6dd]">
            <div className="w-9 h-9 bg-[#cfeedd] text-[#0b4d36] font-bold text-xs rounded-full flex items-center justify-center border border-[#d7e6dd] shadow-2xs">
              DIY
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#1d3b2f] flex items-center gap-1">
                Komunitas DIY <ShieldCheck className="w-3.5 h-3.5 text-[#1f8a5b]" />
              </p>
              <p className="text-[10px] text-[#6b8279] font-medium">
                Kurator & Kreator Karya
              </p>
            </div>
          </div>

          {/* Tombol Membuka Modal Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Keluar Sesi"
            className="flex items-center gap-2 pl-3 border-l border-[#d7e6dd] text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
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

// ── Bell + notif panel ─────────────────────────────────────────────────────

function NotifBell() {
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(DUMMY_NOTIFS);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      const el = document.getElementById('notif-panel');
      if (el && !el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div id="notif-panel" className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) setNotifs((p) => p.map((n) => ({ ...n, read: true }))); }}
        aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ''}`}
        className="relative grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-mist hover:text-forest"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white" aria-hidden>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-3">
            <p className="text-xs font-bold text-ink">Pengajuan Karya</p>
            <Link href="/community/submissions" onClick={() => setOpen(false)} className="text-[10px] font-semibold text-leaf hover:underline">
              Lihat semua →
            </Link>
          </div>
          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {notifs.length === 0
              ? <li className="py-8 text-center text-xs text-muted">Belum ada notifikasi.</li>
              : notifs.map((n) => (
                <li key={n.id} className={['flex items-start gap-3 px-4 py-3', !n.read ? 'bg-mist/40' : ''].join(' ')}>
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-mint text-forest">
                    <FileText className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">{n.author}</p>
                    <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.title}</p>
                    <p className="mt-1 text-[10px] text-muted">{n.time}</p>
                  </div>
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const pathname              = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeItem = MENU.find((m) => m.href === pathname);

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Desktop sidebar ── */}
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

      {/* ── Mobile drawer ── */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname} />

      {/* ── Hamburger button (mobile) ── */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Buka menu navigasi"
        className="fixed left-4 top-3.5 z-30 grid size-9 place-items-center rounded-xl text-ink/70 transition-colors hover:bg-mist hover:text-forest md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* ── Main ── */}
      <div className="min-w-0 md:ml-64">

        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:hidden">
          <div className="w-9 shrink-0" aria-hidden />
          <Logo />
          <NotifBell />
        </header>

        {/* Topbar desktop — hanya bell */}
        <header className="hidden h-14 items-center justify-end border-b border-line bg-white px-6 md:flex">
          <NotifBell />
        </header>

        {/* Breadcrumb aktif (mobile) */}
        {activeItem && (
          <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2 md:hidden">
            <activeItem.Icon className="size-4 shrink-0 text-leaf" aria-hidden />
            <span className="text-xs font-semibold text-ink">{activeItem.label}</span>
          </div>
        )}

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1400px] p-4 pb-8 sm:p-6 lg:px-8 lg:py-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
