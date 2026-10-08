/**
 * lib/auth.ts
 * Helper untuk operasi auth: login, register, logout, fetchMe.
 * Semua fungsi ini mengurus token storage secara otomatis.
 */

import { api, setToken, removeToken } from './api';
import { setCookie, deleteCookie } from './cookies';

// ── Types ─────────────────────────────────────────────────────────────────

export type Role = 'citizen' | 'waste_bank' | 'admin';

export interface WasteBank {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  operating_hours: Record<string, string>;
  description: string | null;
  is_active: boolean;
  is_verified: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatar: string | null;
  total_points: number;
  is_active: boolean;
  created_at: string;
  waste_bank?: WasteBank | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

// ── Redirect map berdasarkan role ─────────────────────────────────────────

export function getDashboardPath(role: Role): string {
  const map: Record<Role, string> = {
    citizen:    '/dashboard',
    waste_bank: '/waste-bank/dashboard',
    admin:      '/admin/dashboard',
  };
  return map[role];
}

// ── Auth actions ──────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  setToken(res.token);
  saveUser(res.user);
  return res.user;
}

export async function registerCitizen(data: {
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
    operating_hours: Record<string, string>;
    description?: string;
  };
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

// ── User cache (localStorage) ─────────────────────────────────────────────

const USER_KEY = 'gg_user';

export function saveUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Simpan ke cookie agar middleware bisa membaca role
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
