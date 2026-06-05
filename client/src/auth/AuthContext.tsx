import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setSession, clearSession } from '../api/client';
import type { AuthUser, Role } from '../api/types';

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post('/auth/login', { email, password });
    setSession({ token: r.data.token, refreshToken: r.data.refreshToken });
    setUser(r.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // revoke the tokens server-side
    } catch {
      // ignore — clear the local session regardless of the network result
    }
    clearSession();
    setUser(null);
    window.location.href = '/login';
  };

  // Re-pull the current user (e.g. after a forced first-login password change,
  // which clears mustChangePassword server-side and lifts the gate).
  const refresh = async () => {
    try {
      const r = await api.get('/auth/me');
      setUser(r.data.user);
    } catch {
      // ignore — the axios interceptor handles real auth failures
    }
  };

  return <Ctx.Provider value={{ user, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}

/** Frontend mirror of backend permissions (backend still enforces). */
export function canManage(user: AuthUser | null, target: { id?: string; managerId?: string | null }): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'HR') return true;
  if (user.role === 'MANAGER' && user.employeeId && target.managerId === user.employeeId) return true;
  return false;
}

export function canManageGoals(user: AuthUser | null, target: { id?: string; managerId?: string | null }): boolean {
  if (canManage(user, target)) return true;
  return !!user?.employeeId && user.employeeId === target.id;
}

export const FULL_ROLES: Role[] = ['ADMIN', 'HR'];
