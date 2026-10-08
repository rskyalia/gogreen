'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setApiError('');

    // Validasi sederhana sisi client
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email wajib diisi.';
    if (!password) newErrors.password = 'Password wajib diisi.';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // redirect sudah ditangani di AuthContext
    } catch (err) {
      const e = err as ApiError;
      if (e.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(e.errors)) {
          mapped[key] = messages[0];
        }
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
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Masuk ke Akun</h2>

      {/* Global error */}
      {apiError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kamu@email.com"
            className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
              focus:ring-2 focus:ring-green-500 focus:border-transparent
              ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition
              focus:ring-2 focus:ring-green-500 focus:border-transparent
              ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700
            disabled:bg-green-400 disabled:cursor-not-allowed
            text-white text-sm font-semibold transition"
        >
          {isLoading ? 'Memuat...' : 'Masuk'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Belum punya akun?{' '}
        <Link href="/register" className="text-green-600 hover:underline font-medium">
          Daftar sekarang
        </Link>
      </p>

      {/* Demo credentials */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center mb-2">Akun Demo</p>
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          {[
            { label: 'Admin', email: 'admin@gogreen.id', password: 'admin123' },
            { label: 'Citizen', email: 'citizen@gogreen.id', password: 'password' },
            { label: 'Waste Bank', email: 'banksampahjaya@gogreen.id', password: 'password' },
          ].map((acc) => (
            <button
              key={acc.label}
              type="button"
              onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
              className="px-2 py-1.5 rounded-md bg-green-50 hover:bg-green-100 text-green-700 transition"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
