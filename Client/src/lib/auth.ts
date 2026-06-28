export type UserRole = "admin" | "clerk" | "instructor" | "student";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

const TOKEN_KEY = "driving_school_token";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAdmin(role: UserRole | string): boolean {
  return role === "admin";
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      removeToken();
      return null;
    }

    const json = await response.json();
    return json as User;
  } catch {
    return null;
  }
}
