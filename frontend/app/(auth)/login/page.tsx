'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { ApiError } from '@/lib/api';
import { Alert, Field, SubmitButton } from '@/components/auth/fields';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      <p className="mt-6 text-center text-sm text-muted">
        Belum punya akun?{' '}
        <Link href="/register" className="font-semibold text-forest underline underline-offset-4">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}