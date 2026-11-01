'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, LogOut, Menu, Settings, X } from 'lucide-react';
import { WASTE_BANK_NAV } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  const exact = href.endsWith('dashboard') || href.endsWith('new');
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/');
}

// ── Logo ──────────────────────────────────────────────────────────────────

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

// ── Nav links ─────────────────────────────────────────────────────────────

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Menu bank sampah">
      {WASTE_BANK_NAV.map((item) => {
        const Icon = item.icon;
        const on   = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={on ? 'page' : undefined}
            className={[
              'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
              on ? 'bg-forest text-white' : 'text-ink/80 hover:bg-mist hover:text-forest',
            ].join(' ')}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Profile card ──────────────────────────────────────────────────────────

function ProfileCard({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="rounded-2xl bg-mist p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight text-ink">{user.name}</p>
          <p className="text-xs leading-tight text-muted">
            {user.waste_bank?.name ?? 'Bank Sampah'}
          </p>
        </div>
      </div>

      <Link
        href="/waste-bank/profile"
        onClick={onNavigate}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-2 text-xs font-semibold text-ink transition-colors hover:bg-paper"
      >
        <Settings className="size-3.5 text-muted" aria-hidden />
        Edit Profil
      </Link>

      <button
        type="button"
        onClick={() => { logout(); onNavigate?.(); }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-forest transition-colors hover:bg-white/60"
      >
        <LogOut className="size-3.5" aria-hidden />
        Keluar
      </button>
    </div>
  );
}

// ── Mobile Drawer ─────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Kunci scroll body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi bank sampah"
        className={[
          'fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl',
          'transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Drawer header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
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

        {/* Nav */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
          <NavLinks pathname={pathname} onNavigate={onClose} />
        </div>

        {/* Profile */}
        <div className="border-t border-line px-4 pb-6 pt-4">
          <ProfileCard onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────

export default function WasteBankLayout({ children }: { children: React.ReactNode }) {
  const pathname              = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Nama halaman aktif untuk breadcrumb mobile
  const activeItem = WASTE_BANK_NAV.find((item) => isActive(pathname, item.href));

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Desktop sidebar ── */}
      <aside
        className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-line bg-white p-5 lg:flex"
        aria-label="Navigasi utama"
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
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
      />

      {/* ── Hamburger button (mobile, fixed) ── */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Buka menu navigasi"
        className="fixed left-4 top-3.5 z-30 grid size-9 place-items-center rounded-xl
                   text-ink/70 transition-colors hover:bg-mist hover:text-forest lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* ── Main content ── */}
      <div className="min-w-0 lg:ml-64">

        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
          {/* Spacer kiri (sejajar hamburger) */}
          <div className="w-9 shrink-0" aria-hidden />

          <Logo />

          {/* Spacer kanan agar logo tetap tengah */}
          <div className="w-9 shrink-0" aria-hidden />
        </header>

        {/* Breadcrumb halaman aktif (mobile) */}
        {activeItem && (
          <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-2 lg:hidden">
            <activeItem.icon className="size-4 shrink-0 text-leaf" aria-hidden />
            <span className="text-xs font-semibold text-ink">{activeItem.label}</span>
          </div>
        )}

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1400px] p-4 pb-8 sm:p-6 lg:px-8 lg:py-8 lg:pb-10"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
