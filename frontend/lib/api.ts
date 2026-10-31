/**
 * lib/api.ts
 * Wrapper fetch terpusat untuk semua request ke Laravel API.
 *
 * Fitur:
 * - Authorization header otomatis dari localStorage
 * - 401 → hapus sesi + redirect ke /login (client-side)
 * - Normalkan error response ke ApiError { message, errors, status }
 * - firstError(err) — ambil pesan error pertama dari field manapun
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// ── Types ─────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
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
  setCookie('gg_token', token, 7);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  deleteCookie('gg_token');
  deleteCookie('gg_user');
  deleteCookie('gg_role');
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // ── 401: sesi tidak valid — bersihkan dan redirect ke /login ──────────
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      removeToken();
      // Hapus user cache juga
      localStorage.removeItem('gg_user');
      // Redirect; hindari loop jika sudah di /login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    const err: ApiError = {
      message: 'Sesi Anda telah berakhir. Silakan login kembali.',
      status: 401,
    };
    throw err;
  }

  // ── Parse body ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const err = body as { message?: string; code?: string; errors?: Record<string, string[]> };
    const apiError: ApiError = {
      message: err.message ?? 'Terjadi kesalahan.',
      code: err.code,
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
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

// ── Error helpers ─────────────────────────────────────────────────────────

/**
 * Ambil string pesan pertama dari ApiError.
 * Urutan: errors[field][0] → message → fallback.
 *
 * Dipakai untuk menampilkan error ringkas di Toast atau inline form.
 */
export function firstError(err: unknown, fallback = 'Terjadi kesalahan.'): string {
  const e = err as ApiError;
  if (e?.errors) {
    const first = Object.values(e.errors)[0];
    if (Array.isArray(first) && first.length > 0) return first[0];
  }
  return e?.message ?? fallback;
}

/**
 * Flatten errors dari ApiError menjadi Record<field, string> (satu pesan per field).
 * Berguna untuk form yang perlu menampilkan error per input.
 */
export function flattenErrors(
  err: unknown,
): Record<string, string> {
  const e = err as ApiError;
  if (!e?.errors) return {};
  return Object.fromEntries(
    Object.entries(e.errors).map(([k, msgs]) => [k, msgs[0] ?? '']),
  );
}

/**
 * Download file dari API sebagai blob dan trigger browser save dialog.
 * Dipakai untuk export CSV.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'text/csv, */*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    const err: ApiError = { message: 'Sesi berakhir.', status: 401 };
    throw err;
  }

  if (!res.ok) {
    const err: ApiError = { message: 'Gagal mengunduh file.', status: res.status };
    throw err;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


/**
 * Request khusus FormData (Upload File)
 * Menghapus Content-Type JSON agar browser otomatis menyusun multipart boundary.
 */
export async function uploadForm<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      removeToken();
      localStorage.removeItem('gg_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    const err: ApiError = {
      message: 'Sesi Anda telah berakhir. Silakan login kembali.',
      status: 401,
    };
    throw err;
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const err = body as { message?: string; code?: string; errors?: Record<string, string[]> };
    const apiError: ApiError = {
      message: err.message ?? 'Terjadi kesalahan.',
      code: err.code,
      errors: err.errors,
      status: res.status,
    };
    throw apiError;
  }

  return body as T;
}