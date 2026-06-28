"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
export type Role = "admin" | "clerk" | "instructor" | "student";
import type { User } from "@/lib/auth";
import {
  getToken,
  setToken as storeToken,
  removeToken,
  getCurrentUser,
} from "@/lib/auth";

const TOKEN_KEY = "driving_school_token";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(TOKEN_KEY);
  });

  useEffect(() => {
    if (!token) return;

    getCurrentUser()
      .then((fetchedUser) => {
        if (fetchedUser) {
          setUser(fetchedUser);
          setCookie("token", token);
          setCookie("role", fetchedUser.role);
        } else {
          removeToken();
          setToken(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || "Invalid email or password");
      }

      const json = await response.json();
      const authToken: string = json.token || json.access_token;
      const authUser: User = json.user;

      storeToken(authToken);
      setToken(authToken);
      setUser(authUser);

      setCookie("token", authToken);
      setCookie("role", authUser.role);

      router.push("/");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      const currentToken = getToken();
      if (currentToken) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      }
    } catch {
    } finally {
      removeToken();
      setToken(null);
      setUser(null);

      clearCookie("token");
      clearCookie("role");

      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
