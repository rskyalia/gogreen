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
  type Role,
  fetchMe,
  getDashboardPath,
  loadUser,
  loginUser,
  logoutUser,
  registerUser,
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
      setIsLoading(false);
      return;
    }

    // Tampilkan data cache sambil verify ke server
    const cached = loadUser();
    if (cached) setUser(cached);

    fetchMe()
      .then(setUser)
      .catch(() => {
        // Token invalid / expired — bersihkan semua
        setUser(null);
        removeUser();
        removeToken();
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

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const fresh = await fetchMe();
    setUser(fresh);
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
