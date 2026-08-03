import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import * as authService from "../services/authService";
import type { AdminSummary } from "../services/authService";

interface AuthContextValue {
  admin: AdminSummary | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "codetrack_token";
const ADMIN_KEY = "codetrack_admin";

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function readAdmin(): AdminSummary | null {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  if (isTokenExpired(localStorage.getItem(TOKEN_KEY))) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    return null;
  }
  return JSON.parse(raw) as AdminSummary;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminSummary | null>(readAdmin);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin));
    setAdmin(res.admin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
