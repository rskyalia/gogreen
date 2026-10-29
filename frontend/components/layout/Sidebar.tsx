'use client';

/**
 * Sidebar — komponen navigasi lateral (desktop).
 *
 * Menerima prop `variant` (string plain) bukan array NavItem yang berisi
 * LucideIcon, karena LucideIcon adalah function/class yang tidak bisa
 * dilewatkan sebagai prop dari Server Component ke Client Component.
 *
 * Nav item di-resolve di sini (client side) berdasarkan variant.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, LogOut } from 'lucide-react';
import { WASTE_BANK_NAV, DEVELOPER_NAV, USER_NAV } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';
import type { NavItem } from '@/lib/navigation';

// ── Types ─────────────────────────────────────────────────────────────────

export type SidebarVariant = 'waste_bank' | 'developer' | 'user';

interface SidebarProps {
  variant: SidebarVariant;
  section?: string;
}

// ── Nav map ────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────

export function Sidebar({ variant, section }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const nav = NAV_MAP[variant];
  const label = section ?? SECTION_MAP[variant];

  return (
    <aside
      className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-line bg-white p-5 lg:flex"
      aria-label="Navigasi utama"
    >
      <Logo />

      {/* ── Nav links ── */}
      <nav
        className="mt-8 flex-1 space-y-1 overflow-y-auto"
        aria-label={`Menu ${label}`}
      >
        {nav.map((item) => {
          const Icon = item.icon;

          const exact = item.href.endsWith('dashboard') || item.href.endsWith('new');
          const isActive = exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${isActive ? 'bg-forest text-white' : 'text-ink/80 hover:bg-mist'
                }`}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Profile card + logout ── */}
      {user && (
        <div className="mt-4 rounded-2xl bg-mist p-4">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight text-ink">
                {user.name}
              </p>
              <p className="text-xs capitalize leading-tight text-muted">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-forest transition-colors hover:bg-white/60"
          >
            <LogOut className="size-3.5" aria-hidden />
            Keluar
          </button>
        </div>
      )}
    </aside>
  );
}