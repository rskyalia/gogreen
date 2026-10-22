'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { ApiError } from '@/lib/api';
import { Alert, Field, SubmitButton } from '@/components/auth/fields';
import { getGoogleRedirectUrl } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setApiError('');

    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email wajib diisi.';
    if (!password) newErrors.password = 'Password wajib diisi.';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const e = err as ApiError;
      if (e.errors) {
        const mapped: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(e.errors)) mapped[k] = msgs[0];
        setErrors(mapped);
      } else {
        setApiError(e.message ?? 'Login gagal. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const url = await getGoogleRedirectUrl();
      window.location.href = url;
    } catch {
      setApiError('Gagal memulai login Google. Coba lagi.');
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-line bg-white p-7 sm:p-9">
      <h1 className="font-serif text-3xl font-medium text-forest">Masuk ke akun</h1>
      <p className="mt-2 text-sm text-muted">Lanjutkan ke dashboard-mu.</p>

      {apiError && (
        <div className="mt-5">
          <Alert tone="error">{apiError}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Field
          id="email" label="Email" type="email" value={email} onChange={setEmail}
          placeholder="kamu@email.com" error={errors.email} autoComplete="email"
        />
        <Field
          id="password" label="Password" type="password" value={password} onChange={setPassword}
          placeholder="Password kamu" error={errors.password} autoComplete="current-password"
        />
        <div className="pt-2">
          <SubmitButton loading={isLoading}>{isLoading ? 'Memuat...' : 'Masuk'}</SubmitButton>
        </div>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">atau</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Tombol Google — hanya tersedia untuk akun warga (role=user) */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <svg className="size-4 animate-spin text-muted" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
        ) : (
          <GoogleIcon />
        )}
        {isGoogleLoading ? 'Mengarahkan...' : 'Masuk dengan Google'}
      </button>

      <p className="mt-6 text-center text-sm text-muted">
        Belum punya akun?{' '}
        <Link href="/register" className="font-semibold text-forest underline underline-offset-4">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

/** Google "G" SVG logo */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
