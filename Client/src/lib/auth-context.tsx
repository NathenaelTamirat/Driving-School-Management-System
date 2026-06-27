"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
  clearToken,
  getToken,
  type User,
} from "@/lib/api";
import { loadLicenseCategories } from "@/lib/enrollment-types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !isLoading && user !== null && token !== null;

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const result = await apiLogin(email, password);
    if (result.success && result.data) {
      setUser(result.data.user);
      setTokenState(result.data.token);
      return null;
    }
    return result.error || "Login failed";
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setTokenState(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setTokenState(storedToken);

    getMe().then((result) => {
      if (result.success && result.data) {
        setUser(result.data.user);
      } else {
        clearToken();
        setTokenState(null);
      }
      setIsLoading(false);
    });
  }, []);

  // Load license categories from backend once at startup.
  // Falls back to hardcoded data if the API is unreachable.
  useEffect(() => {
    loadLicenseCategories();
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, isAuthenticated, login, logout }),
    [user, token, isLoading, isAuthenticated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
