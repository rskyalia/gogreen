'use client';

/**
 * Sidebar — komponen navigasi lateral.
 *
 * Menerima prop `variant` (string plain) bukan array NavItem yang berisi
 * LucideIcon, karena LucideIcon adalah function/class yang tidak bisa
 * dilewatkan sebagai prop dari Server Component ke Client Component.
 *
 * Nav item di-resolve di sini (client side) berdasarkan variant.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { WASTE_BANK_NAV, DEVELOPER_NAV } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';
import type { NavItem } from '@/lib/navigation';

// ── Types ─────────────────────────────────────────────────────────────────

export type SidebarVariant = 'waste_bank' | 'developer';

interface SidebarProps {
  variant:  SidebarVariant;
  section?: string;
}

// ── Nav map ────────────────────────────────────────────────────────────────

const NAV_MAP: Record<SidebarVariant, NavItem[]> = {
  waste_bank: WASTE_BANK_NAV,
  developer:  DEVELOPER_NAV,
};

const SECTION_MAP: Record<SidebarVariant, string> = {
  waste_bank: 'Bank Sampah',
  developer:  'Developer',
};

// ── Component ─────────────────────────────────────────────────────────────

export function Sidebar({ variant, section }: SidebarProps) {
  const pathname        = usePathname();
  const { user, logout } = useAuth();
  const nav             = NAV_MAP[variant];
  const label           = section ?? SECTION_MAP[variant];

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-white"
      aria-label="Navigasi utama"
    >
      {/* ── Brand ── */}
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest text-white"
          aria-hidden="true"
        >
          <span className="text-xs font-bold leading-none">GG</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-forest">GO GREEN</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5" role="list">
          {nav.map((item) => {
            const Icon = item.icon;

            const exact = item.href.endsWith('dashboard') || item.href.endsWith('new');
            const isActive = exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                    'transition-colors',
                    isActive
                      ? 'bg-mist text-forest'
                      : 'text-muted hover:bg-mist hover:text-forest',
                  ].join(' ')}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User info + logout ── */}
      {user && (
        <div className="border-t border-line px-3 py-3">
          <div className="mb-1.5 flex items-center gap-2.5 px-2 py-1">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center
                         rounded-full bg-mist text-xs font-semibold text-forest"
              aria-hidden="true"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[11px] capitalize text-muted">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
                       font-medium text-muted transition-colors
                       hover:bg-danger-soft hover:text-danger"
          >
            <LogOut size={16} aria-hidden="true" className="shrink-0" />
            Keluar
          </button>
        </div>
      )}
    </aside>
  );
}
