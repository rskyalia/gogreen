/**
 * proxy.ts  (Next.js 16)
 * Route protection + role-based redirect berdasarkan cookie gg_token & gg_user.
 *
 * Roles: user | waste_bank | developer | community
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Config ────────────────────────────────────────────────────────────────

/** Route yang butuh login (prefix) */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/waste-bank',
  '/admin',
  '/community',
  '/profile',
  '/scan',
];

/** Route yang hanya boleh diakses saat BELUM login */
const AUTH_PREFIXES = ['/login', '/register'];

/**
 * Prefix → role yang diizinkan.
 * Jika user masuk ke prefix yang bukan miliknya → redirect ke dashboardnya sendiri.
 */
const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard':  ['user'],
  '/waste-bank': ['waste_bank'],
  '/admin':      ['developer'],
  '/community':  ['community'],
  '/profile':    ['user', 'waste_bank', 'developer', 'community'],
  '/scan':       ['user'],
};

// ── Proxy ─────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token    = request.cookies.get('gg_token')?.value;
  const userJson = request.cookies.get('gg_user')?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // ── Sudah login → coba buka halaman auth → redirect ke dashboard ──────
  if (isAuthRoute && token && userJson) {
    try {
      const u = JSON.parse(decodeURIComponent(userJson)) as { role: string };
      return NextResponse.redirect(new URL(dashboardFor(u.role), request.url));
    } catch {
      // cookie rusak, biarkan lanjut ke /login
    }
  }

  // ── Belum login → coba buka halaman protected → ke /login ─────────────
  if (isProtected && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ── Sudah login → validasi role sesuai prefix ──────────────────────────
  if (isProtected && token && userJson) {
    try {
      const u = JSON.parse(decodeURIComponent(userJson)) as { role: string };

      for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(prefix) && !allowedRoles.includes(u.role)) {
          return NextResponse.redirect(
            new URL(dashboardFor(u.role), request.url),
          );
        }
      }
    } catch {
      // cookie rusak, AuthContext akan handle di client
    }
  }

  return NextResponse.next();
}

// ── Helpers ───────────────────────────────────────────────────────────────

function dashboardFor(role: string): string {
  const map: Record<string, string> = {
    user:       '/dashboard',
    waste_bank: '/waste-bank/dashboard',
    developer:  '/admin/dashboard',
    community:  '/community/dashboard',
  };
  return map[role] ?? '/dashboard';
}

// ── Matcher ───────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)',
  ],
};
