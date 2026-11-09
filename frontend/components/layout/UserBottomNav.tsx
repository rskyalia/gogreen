'use client';

/**
 * UserBottomNav — navigasi bawah untuk halaman user (mobile-first).
 * Tampil hanya di sm ke bawah pada layar kecil; tersembunyi di sm ke atas.
 *
 * Hanya menampilkan 5 item utama agar tidak penuh di layar sempit.
 * Item lain tetap tersedia via sidebar desktop.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { USER_NAV } from '@/lib/navigation';

// 5 item paling sering dipakai di mobile
const BOTTOM_NAV_HREFS = [
  '/dashboard',
  '/scan',
  '/member-card',
  '/setor',
  '/deposits',
];

export function UserBottomNav() {
  const pathname = usePathname();
  const bottomItems = USER_NAV.filter((item) => BOTTOM_NAV_HREFS.includes(item.href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white
                 px-2 pb-safe sm:hidden"
      aria-label="Navigasi utama"
    >
      <ul className="flex items-center justify-around" role="list">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const exact = item.href === '/dashboard' || item.href === '/member-card';
          const isActive = exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-medium',
                  'transition-colors',
                  isActive ? 'text-forest' : 'text-muted hover:text-forest',
                ].join(' ')}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
