'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [apiError, setApiError]   = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setApiError('');

    const newErrors: Record<string, string> = {};
    if (!email)    newErrors.email    = 'Email wajib diisi.';
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
    <>
      <h2 className="text-lg font-semibold text-gray-800 mb-5">Masuk ke Akun</h2>

      {apiError && (
        <p className="mb-4 text-sm text-red-600">{apiError}</p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            id="email" type="email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kamu@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-500"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-gray-700 mb-1">Password</label>
          <input
            id="password" type="password" value={password} autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-500"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <button
          type="submit" disabled={isLoading}
          className="w-full py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition"
        >
          {isLoading ? 'Memuat...' : 'Masuk'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Belum punya akun?{' '}
        <Link href="/register" className="text-green-600 hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </>
  );
}
