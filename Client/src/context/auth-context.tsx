"use client";

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { getToken, setToken, clearToken } from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const USER_STORAGE_KEY = "driving_school_user";

export type Role = "admin" | "clerk" | "instructor";

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  phone_number: string | null;
  is_qualified_instructor: boolean;
};

type LoginResult = { success: true } | { success: false; error: string };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

function loadStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = getToken();
    return token ? loadStoredUser() : null;
  });
  const [loading, setLoading] = useState(() => !!getToken());

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();
        if (!cancelled) {
          if (json.success && json.data?.user) {
            setUser(json.data.user);
          } else {
            clearToken();
            localStorage.removeItem(USER_STORAGE_KEY);
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) {
          clearToken();
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth: { email, password } }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          return {
            success: false,
            error: json.error?.message || json.error || "Login failed",
          };
        }
        setToken(json.data.token);
        localStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(json.data.user),
        );
        setUser(json.data.user);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Network error. Please check your connection.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // swallow
      }
    }
    clearToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}
