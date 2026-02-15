import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin, logout as apiLogout, checkSession, setUnauthorizedHandler } from "@/api";

type AuthContextValue = {
  isAuthenticated: boolean | null;
  login: (password: string) => Promise<{ ok: true } | { error: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const login = useCallback(async (password: string) => {
    const res = await apiLogin(password);
    if ("ok" in res && res.ok) {
      setIsAuthenticated(true);
      return { ok: true as const };
    }
    return { error: "error" in res ? res.error : "Unauthorized" };
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setIsAuthenticated(false));
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await checkSession();
      if (cancelled) return;
      setIsAuthenticated(res.ok);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
