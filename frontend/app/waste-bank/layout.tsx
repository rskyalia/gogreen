'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, LogOut } from 'lucide-react';
import { WASTE_BANK_NAV } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-full bg-forest text-mint">
        <Leaf className="size-5" aria-hidden />
      </span>
      <span className="font-serif text-base font-semibold leading-5 text-forest">
        Go Green
      </span>
    </Link>
  );
}

export default function WasteBankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <WasteBankLayoutContent>{children}</WasteBankLayoutContent>
    </Suspense>
  );
}

function WasteBankLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">

      {/* ── Sidebar desktop ── */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-white p-5 lg:flex">
        <Logo />

        <nav className="mt-8 flex-1 space-y-1" aria-label="Menu bank sampah">
          {WASTE_BANK_NAV.map((item) => {
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
                className={[
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-forest text-white'
                    : 'text-ink/80 hover:bg-mist hover:text-forest',
                ].join(' ')}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        {user && (
          <div className="mt-auto rounded-2xl bg-mist p-4">
            <p className="truncate font-semibold text-ink">{user.name}</p>
            <p className="text-xs text-muted capitalize">
              {user.waste_bank?.name ?? 'Bank Sampah'}
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex items-center gap-2 text-sm font-semibold text-forest hover:text-forest-deep"
            >
              <LogOut className="size-4" aria-hidden />
              Keluar
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="min-w-0">
        {/* Topbar mobile */}
        <header className="flex h-14 items-center justify-between border-b border-line bg-white px-5 lg:hidden">
          <Logo />
          {user && (
            <button
              type="button"
              onClick={logout}
              aria-label="Keluar dari akun"
              className="p-2 text-forest"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          )}
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1600px] p-5 pb-28 sm:p-8 lg:px-10 lg:py-8 lg:pb-10"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* ── Bottom nav mobile ── */}
      <nav
        aria-label="Menu bank sampah"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:hidden"
      >
        <ul className="flex items-center justify-around" role="list">
          {WASTE_BANK_NAV.map((item) => {
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
                    'flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-medium transition-colors',
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
    </div>
  );
}
