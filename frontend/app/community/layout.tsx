'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

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
import { useAuth } from '@/context/AuthContext';

// ── Nav config ─────────────────────────────────────────────────────────────

const MENU = [
  { label: "Ringkasan", href: "/community/dashboard", Icon: LayoutDashboard },
  { label: "Panduan DIY", href: "/community/guides", Icon: BookOpen },
  { label: "Validasi Karya", href: "/community/submissions", Icon: CheckSquare },
  { label: "Request Bahan", href: "/community/material-requests", Icon: PackagePlus },
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
    <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Menu komunitas">
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

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onNavigate?.();
    }
  };

  return (
    <div className="rounded-2xl bg-mist p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
        >
          {(user?.name ?? "P").charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight text-ink">
            {user?.name ?? "Pengguna"}
          </p>
          <p className="text-xs capitalize leading-tight text-muted">
            Komunitas DIY
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-forest transition-colors hover:bg-white/60"
      >
        <LogOut className="size-3.5" aria-hidden />
        Keluar
      </button>
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

// ── Notification bell ─────────────────────────────────────

interface Notif {
  id: string;
  author: string;
  title: string;
  time: string;
  read: boolean;
}

const DUMMY_NOTIFS: Notif[] = [
  {
    id: "1",
    author: "Budi Santoso",
    title: "Pot Bunga dari Botol Plastik Bekas",
    time: "10 mnt lalu",
    read: false,
  },
  {
    id: "2",
    author: "Siti Rahma",
    title: "Lampu Hias dari Bambu Daur Ulang",
    time: "1 jam lalu",
    read: false,
  },
  {
    id: "3",
    author: "Ahmad Fauzi",
    title: "Kompostor Sederhana Skala Rumah Tangga",
    time: "3 jam lalu",
    read: true,
  },
];

function NotifBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(DUMMY_NOTIFS);

  const unread = notifs.filter((item) => !item.read).length;

  useEffect(() => {
    if (!open) return;

    function handleOutside(event: MouseEvent) {
      const element = document.getElementById("notif-panel");

      if (element && !element.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open]);

  return (
    <div id="notif-panel" className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((previous) => !previous);
          if (!open) {
            setNotifs((previous) =>
              previous.map((item) => ({ ...item, read: true }))
            );
          }
        }}
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
            <p className="text-xs font-bold text-ink">
              Pengajuan Karya
            </p>

            <Link
              href="/community/submissions"
              onClick={() => setOpen(false)}
              className="text-[10px] font-semibold text-leaf hover:underline"
            >
              Lihat semua →
            </Link>
          </div>

          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {notifs.length === 0 ? (
              <li className="py-8 text-center text-xs text-muted">
                Belum ada notifikasi.
              </li>
            ) : (
              notifs.map((item) => (
                <li
                  key={item.id}
                  className={[
                    "flex items-start gap-3 px-4 py-3",
                    !item.read ? "bg-mist/40" : "",
                  ].join(" ")}
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-mint text-forest">
                    <FileText className="size-3.5" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">
                      {item.author}
                    </p>
                    <p className="mt-0.5 text-xs text-muted line-clamp-2">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {item.time}
                    </p>
                  </div>
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
          className="mx-auto w-full max-w-[1400px] p-4 pb-8 sm:p-6 lg:px-8 lg:py-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}