import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { setAuthSession, setUnauthorizedHandler } from "@/api";

type AuthContextValue = {
  isAuthenticated: boolean | null;
  login: (email: string, password: string) => Promise<{ ok: true } | { error: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      const msg = error.message || "Invalid email or password";
      if (msg.toLowerCase().includes("confirm")) {
        return {
          error: `${msg}. If you just created this user, check Supabase Dashboard → Authentication → Users and ensure “Email confirmed” is checked, or confirm via the email link.`,
        };
      }
      return { error: msg };
    }
    const session = data.session;
    if (!session?.access_token || !data.user?.id) {
      return { error: "Invalid session" };
    }
    setAuthSession({
      accessToken: session.access_token,
      userId: data.user.id,
    });
    setIsAuthenticated(true);
    return { ok: true as const };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthSession(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthSession(null);
      setIsAuthenticated(false);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const session = data.session;
      const userId = session?.user?.id;
      if (session?.access_token && userId) {
        setAuthSession({
          accessToken: session.access_token,
          userId,
        });
        setIsAuthenticated(true);
      } else {
        setAuthSession(null);
        setIsAuthenticated(false);
      }
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
