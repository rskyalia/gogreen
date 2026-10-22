'use client';

/**
 * app/auth/google/callback/page.tsx
 *
 * Halaman penerima redirect dari backend setelah Google OAuth selesai.
 * Backend meneruskan token dan data user di query-string:
 *   ?token=<sanctum_token>&user=<base64(JSON(UserResource))>
 *   atau ?google_error=<kode_error>
 *
 * Sesuai Next.js 16, useSearchParams() harus dibungkus <Suspense>.
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Leaf, LoaderCircle } from 'lucide-react';
import { loginWithGoogle, type AuthUser, getDashboardPath } from '@/lib/auth';

// ── Pesan error per kode ──────────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed:   'Proses login dengan Google gagal. Coba lagi.',
  role_mismatch:  'Akun ini terdaftar sebagai peran lain (bank sampah / admin). Gunakan login email.',
  banned:         'Akun Anda telah diblokir. Hubungi administrator.',
};

// ── Inner component (pakai useSearchParams) ───────────────────────────────

function CallbackContent() {
  const params = useSearchParams();
  const router  = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const googleError = params.get('google_error');

    if (googleError) {
      setErrorMsg(ERROR_MESSAGES[googleError] ?? 'Login dengan Google gagal. Coba lagi.');
      return;
    }

    const token   = params.get('token');
    const userRaw = params.get('user');

    if (!token || !userRaw) {
      setErrorMsg('Respons dari Google tidak valid. Coba lagi.');
      return;
    }

    try {
      const user: AuthUser = JSON.parse(atob(userRaw));
      loginWithGoogle(token, user);
      router.replace(getDashboardPath(user.role));
    } catch {
      setErrorMsg('Gagal memproses data login. Coba lagi.');
    }
  }, [params, router]);

  // ── Error state ────────────────────────────────────────────────────────
  if (errorMsg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-5 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-red-100">
          <Leaf className="size-7 text-red-500" aria-hidden />
        </span>
        <h1 className="font-serif text-2xl font-medium text-forest">Login Gagal</h1>
        <p className="max-w-sm text-sm text-muted">{errorMsg}</p>
        <a
          href="/login"
          className="mt-2 rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
        >
          Kembali ke Login
        </a>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper">
      <span className="grid size-14 place-items-center rounded-full bg-mint">
        <Leaf className="size-7 text-forest" aria-hidden />
      </span>
      <LoaderCircle className="size-6 animate-spin text-forest" aria-hidden />
      <p className="text-sm text-muted">Memproses login Google…</p>
    </div>
  );
}

// ── Page export (Suspense wrapper wajib untuk useSearchParams) ────────────

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-paper">
          <LoaderCircle className="size-6 animate-spin text-forest" aria-hidden />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
