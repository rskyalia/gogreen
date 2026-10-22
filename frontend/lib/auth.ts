/**
 * lib/auth.ts
 * Helper untuk operasi auth: login, register, logout, fetchMe.
 * Mengurus token & user cache (localStorage + cookie) secara otomatis.
 */

import { api, setToken, removeToken } from './api';
import { setCookie, deleteCookie } from './cookies';

// ── Types ─────────────────────────────────────────────────────────────────

export type Role = 'user' | 'waste_bank' | 'developer' | 'community';

export interface WasteBankProfile {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  description: string | null;
  opening_hours: Record<string, string>;
  is_open: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatar: string | null;
  member_code: string | null;   // hanya untuk role=user
  points_balance: number;
  status: 'active' | 'banned';
  created_at: string;
  waste_bank?: WasteBankProfile | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

// ── Dashboard paths ───────────────────────────────────────────────────────

export function getDashboardPath(role: Role): string {
  const map: Record<Role, string> = {
    user:       '/dashboard',
    waste_bank: '/waste-bank/dashboard',
    developer:  '/admin/dashboard',
    community:  '/community/dashboard',
  };
  return map[role];
}

// ── Auth actions ──────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  setToken(res.token);
  saveUser(res.user);
  return res.user;
}

/** Daftar sebagai warga biasa */
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}): Promise<AuthUser> {
  const res = await api.post<AuthResponse>('/auth/register', data);
  setToken(res.token);
  saveUser(res.user);
  return res.user;
}

/** Daftar sebagai bank sampah — akun pending sampai developer verifikasi */
export async function registerWasteBank(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  waste_bank: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string;
    opening_hours: Record<string, string>;
    description?: string;
  };
}): Promise<AuthUser> {
  const res = await api.post<AuthResponse>('/auth/register', data);
  setToken(res.token);
  saveUser(res.user);
  return res.user;
}

/** Daftar sebagai komunitas DIY */
export async function registerCommunity(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  community?: { description?: string };
}): Promise<AuthUser> {
  const res = await api.post<AuthResponse>('/auth/register', data);
  setToken(res.token);
  saveUser(res.user);
  return res.user;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post<{ message: string }>('/auth/logout', {});
  } finally {
    removeToken();
    removeUser();
  }
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await api.get<MeResponse>('/me');
  saveUser(res.user);
  return res.user;
}

/** Ambil URL redirect Google OAuth dari backend */
export async function getGoogleRedirectUrl(): Promise<string> {
  const res = await api.get<{ url: string }>('/auth/google/redirect');
  return res.url;
}

/**
 * Selesaikan login Google setelah callback.
 * Dipanggil dari halaman /auth/google/callback dengan token & user
 * yang diteruskan backend sebagai query-string.
 */
export function loginWithGoogle(token: string, user: AuthUser): void {
  setToken(token);
  saveUser(user);
}

// ── User cache (localStorage + cookie) ───────────────────────────────────

const USER_KEY = 'gg_user';

export function saveUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Cookie dibaca oleh proxy.ts untuk proteksi route server-side
  setCookie('gg_user', JSON.stringify(user), 7);
}

export function loadUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  deleteCookie('gg_user');
}
