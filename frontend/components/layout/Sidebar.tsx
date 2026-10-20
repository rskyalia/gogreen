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
import { WASTE_BANK_NAV, DEVELOPER_NAV } from '@/lib/navigation';
import type { NavItem } from '@/lib/navigation';

// ── Types ─────────────────────────────────────────────────────────────────

export type SidebarVariant = 'waste_bank' | 'developer';

interface SidebarProps {
  variant:   SidebarVariant;
  /** Sub-label di bawah brand "GO GREEN" */
  section?:  string;
}

// ── Nav map (resolved di client, tidak di-serialize dari server) ───────────

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
  const pathname  = usePathname();
  const nav       = NAV_MAP[variant];
  const label     = section ?? SECTION_MAP[variant];

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

            /*
             * exact-match untuk dashboard (agar tidak aktif di semua sub-route)
             * dan untuk /new (agar tidak bentrok dengan parent /deposits).
             */
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
    </aside>
  );
}
