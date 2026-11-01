'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, LogOut, Menu, X } from 'lucide-react';
import { WASTE_BANK_NAV, DEVELOPER_NAV, USER_NAV } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';
import type { NavItem } from '@/lib/navigation';

// ── Types ─────────────────────────────────────────────────────────────────

export type SidebarVariant = 'waste_bank' | 'developer' | 'user';

interface SidebarProps {
  variant: SidebarVariant;
  section?: string;
}

// ── Config maps ───────────────────────────────────────────────────────────

const NAV_MAP: Record<SidebarVariant, NavItem[]> = {
  waste_bank: WASTE_BANK_NAV,
  developer:  DEVELOPER_NAV,
  user:       USER_NAV,
};

const SECTION_MAP: Record<SidebarVariant, string> = {
  waste_bank: 'Bank Sampah',
  developer:  'Developer',
  user:       'Masyarakat',
};

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

// ── Nav links (shared antara desktop sidebar & mobile drawer) ─────────────

function NavLinks({
  nav,
  pathname,
  label,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto" aria-label={`Menu ${label}`}>
      {nav.map((item) => {
        const Icon = item.icon;
        const exact    = item.href.endsWith('dashboard') || item.href.endsWith('new');
        const isActive = exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
              isActive ? 'bg-forest text-white' : 'text-ink/80 hover:bg-mist hover:text-forest',
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

// ── Profile card (shared) ─────────────────────────────────────────────────

function ProfileCard({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="mt-4 rounded-2xl bg-mist p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight text-ink">{user.name}</p>
          <p className="text-xs capitalize leading-tight text-muted">
            {user.role.replace('_', ' ')}
          </p>
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

// ── Mobile Drawer ─────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  nav,
  pathname,
  label,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavItem[];
  pathname: string;
  label: string;
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
        aria-label="Menu navigasi"
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
          <NavLinks nav={nav} pathname={pathname} label={label} onNavigate={onClose} />
        </div>

        {/* Profile */}
        <div className="border-t border-line px-4 pb-6 pt-4">
          <ProfileCard onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}

// ── Sidebar (desktop) + Hamburger trigger (mobile) ────────────────────────

export function Sidebar({ variant, section }: SidebarProps) {
  const pathname         = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const nav              = NAV_MAP[variant];
  const label            = section ?? SECTION_MAP[variant];

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-line bg-white p-5 lg:flex"
        aria-label="Navigasi utama"
      >
        <Logo />
        <div className="mt-8 flex flex-1 flex-col overflow-hidden">
          <NavLinks nav={nav} pathname={pathname} label={label} />
        </div>
        <ProfileCard />
      </aside>

      {/* ── Mobile: hamburger button (disisipkan di topbar via portal trick) ── */}
      {/* Kita render tombol ini sebagai fixed element yang hanya muncul di mobile */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Buka menu navigasi"
        className="fixed left-4 top-3.5 z-30 grid size-9 place-items-center rounded-xl
                   text-ink/70 transition-colors hover:bg-mist hover:text-forest lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* ── Mobile drawer ── */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        nav={nav}
        pathname={pathname}
        label={label}
      />
    </>
  );
}
