'use client';

/**
 * context/AuthContext.tsx
 * Global auth state — user, loading, login, logout, register.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  type AuthUser,
  fetchMe,
  getDashboardPath,
  loadUser,
  loginUser,
  logoutUser,
  registerUser,
  loginWithGoogle,
} from '@/lib/auth';
import { getToken, removeToken } from '@/lib/api';
import { removeUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// ── Context type ──────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Inject user + token langsung ke context (dipakai setelah OAuth callback) */
  setSession: (token: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mount: cek token → hydrate dari cache → verify ke server
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      removeUser();
      setIsLoading(false);
      return;
    }

    // Tampilkan data cache sambil verify ke server
    const cached = loadUser();
    if (cached) setUser(cached);

    fetchMe()
      .then(setUser)
      .catch((err) => {
        // Hanya logout jika benar-benar 401 (token invalid/expired).
        // Error jaringan (TypeError: Failed to fetch) atau 5xx jangan
        // sampai menghapus sesi — user masih login, backend sementara down.
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          setUser(null);
          removeUser();
          removeToken();
        }
        // Selain 401: pertahankan cache, biarkan user tetap login
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const loggedUser = await loginUser(email, password);
      setUser(loggedUser);
      router.push(getDashboardPath(loggedUser.role));
    },
    [router],
  );

  const register = useCallback(
    async (data: Parameters<typeof registerUser>[0]) => {
      const newUser = await registerUser(data);
      setUser(newUser);
      router.push(getDashboardPath(newUser.role));
    },
    [router],
  );

  // 🔴 PERBAIKAN PADA FUNGSI LOGOUT
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn('Gagal memanggil API logout di server:', error);
    } finally {
      // Reset state & storage — JANGAN pakai localStorage.clear()
      // karena bisa menghapus data aplikasi lain di domain yang sama.
      setUser(null);
      removeUser();
      removeToken();

      // Hapus cookie manual sebagai fallback
      document.cookie = 'gg_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'gg_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'gg_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

      window.location.href = '/';
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await fetchMe();
    setUser(fresh);
  }, []);

  /**
   * Inject token + user langsung ke context.
   * Dipanggil dari halaman OAuth callback agar tidak perlu reload.
   */
  const setSession = useCallback((token: string, user: AuthUser) => {
    loginWithGoogle(token, user);   // simpan ke localStorage + cookie
    setUser(user);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam <AuthProvider>');
  return ctx;
}