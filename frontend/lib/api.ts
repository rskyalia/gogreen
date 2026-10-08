/**
 * lib/api.ts
 * Wrapper fetch terpusat untuk semua request ke Laravel API.
 * - Menyisipkan Authorization header dari localStorage secara otomatis
 * - Menormalkan error response menjadi ApiError
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// ── Types ─────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

import { setCookie, deleteCookie } from './cookies';

// ── Token helpers (localStorage + cookie) ─────────────────────────────────

const TOKEN_KEY = 'gg_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  setCookie('gg_token', token, 7); // middleware membaca cookie ini
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  deleteCookie('gg_token');
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Coba parse JSON selalu
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const err = body as { message?: string; errors?: Record<string, string[]> };
    const apiError: ApiError = {
      message: err.message ?? 'Terjadi kesalahan.',
      errors: err.errors,
      status: res.status,
    };
    throw apiError;
  }

  return body as T;
}

// ── Convenience methods ────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
