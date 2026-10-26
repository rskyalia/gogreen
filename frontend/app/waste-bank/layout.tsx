'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, LogOut, Settings } from 'lucide-react';
import { WASTE_BANK_NAV } from '@/lib/navigation';
import { useAuth } from '@/context/AuthContext';

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

function isActivePath(pathname: string, href: string) {
  const exact = href.endsWith('dashboard') || href.endsWith('new');
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/');
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
    <div className="min-h-screen bg-paper">
      {/* ── Sidebar desktop ── */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-line bg-white p-5 lg:flex">
        <div className="flex items-center justify-between">
          <Logo />
        </div>

        <nav className="mt-8 space-y-1" aria-label="Menu bank sampah">
          {WASTE_BANK_NAV.map((item) => {
            const Icon = item.icon;
            const on = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${on ? 'bg-forest text-white' : 'text-ink/80 hover:bg-mist'
                  }`}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile card & actions */}
        {user && (
          <div className="mt-auto rounded-2xl bg-mist p-4">
            <div className="mb-2 flex items-center gap-3">
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

            <Link
              href="/waste-bank/profile"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-2 text-xs font-semibold text-ink transition-colors hover:bg-paper"
            >
              <Settings className="size-3.5 text-muted" aria-hidden />
              Edit Profil
            </Link>

            <button
              type="button"
              onClick={logout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-forest transition-colors hover:bg-white/60"
            >
              <LogOut className="size-3.5" aria-hidden />
              Keluar
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="min-w-0 lg:ml-64">
        {/* Topbar mobile */}
        <header className="flex h-14 items-center justify-between border-b border-line bg-white px-5 lg:hidden">
          <Logo />
          {user && (
            <div className="flex items-center gap-2">
              <Link
                href="/waste-bank/profile"
                aria-label="Edit Profil"
                className="p-2 text-ink/70 hover:text-forest"
              >
                <Settings className="size-5" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label="Keluar"
                className="p-2 text-forest"
              >
                <LogOut className="size-5" aria-hidden />
              </button>
            </div>
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
        className="fixed inset-x-0 bottom-0 z-30 grid grid-flow-col auto-cols-fr border-t border-line bg-white/95 backdrop-blur lg:hidden"
      >
        {WASTE_BANK_NAV.map((item) => {
          const Icon = item.icon;
          const on = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 px-0.5 py-2.5 text-center text-[10px] font-semibold leading-tight ${on ? 'text-forest' : 'text-muted'
                }`}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}