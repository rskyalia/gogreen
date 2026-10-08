/**
 * proxy.ts  (Next.js 16 — pengganti middleware.ts)
 * Route protection berdasarkan cookie `gg_token` dan `gg_user`.
 *
 * Token + user disimpan sebagai cookie client-side saat login
 * (lihat lib/api.ts → setToken dan lib/auth.ts → saveUser).
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Konfigurasi ────────────────────────────────────────────────────────────

/** Prefix yang butuh login (apapun role-nya) */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/waste-bank',
  '/admin',
  '/profile',
  '/scan',
];

/** Prefix yang hanya boleh diakses saat BELUM login */
const AUTH_PREFIXES = ['/login', '/register'];

/** Prefix → role yang diizinkan */
const ROLE_ROUTES: Record<string, string> = {
  '/admin':      'admin',
  '/waste-bank': 'waste_bank',
  '/dashboard':  'citizen',
  '/scan':       'citizen',
  '/profile':    'citizen',
};

// ── Proxy handler ─────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token    = request.cookies.get('gg_token')?.value;
  const userJson = request.cookies.get('gg_user')?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute  = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // ── Sudah login + coba buka halaman auth → redirect ke dashboard ──────
  if (isAuthRoute && token && userJson) {
    try {
      const user = JSON.parse(decodeURIComponent(userJson)) as { role: string };
      return NextResponse.redirect(new URL(dashboardFor(user.role), request.url));
    } catch {
      // cookie rusak → biarkan lanjut ke /login
    }
  }

  // ── Belum login + coba buka halaman protected → redirect ke /login ────
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Sudah login + cek role sesuai prefix ─────────────────────────────
  if (isProtected && token && userJson) {
    try {
      const user = JSON.parse(decodeURIComponent(userJson)) as { role: string };

      for (const [prefix, requiredRole] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(prefix) && user.role !== requiredRole) {
          // Role tidak sesuai → kirim ke dashboard yang benar
          return NextResponse.redirect(
            new URL(dashboardFor(user.role), request.url),
          );
        }
      }
    } catch {
      // cookie rusak → biarkan lanjut, AuthContext akan handle
    }
  }

  return NextResponse.next();
}

// ── Helpers ───────────────────────────────────────────────────────────────

function dashboardFor(role: string): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'waste_bank') return '/waste-bank/dashboard';
  return '/dashboard';
}

// ── Matcher config ────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Cocokkan semua path kecuali:
     * _next/static, _next/image, favicon, file statis
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)',
  ],
};
