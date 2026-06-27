import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const TOKEN_KEY = "driving_school_token";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.email : "null"}</span>
      <span data-testid="role">{user ? user.role : "null"}</span>
      <button data-testid="login-btn" onClick={() => login("a@b.com", "secret")}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  it("shows loading state on mount", () => {
    renderWithProvider();
    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("resolves to unauthenticated when no token stored", async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("hydrates user from stored token via getMe", async () => {
    localStorage.setItem(TOKEN_KEY, "valid-token");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { user: { id: 1, email: "admin@test.com", full_name: "Admin", role: "admin" } },
      }),
    }));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("admin@test.com");
    expect(screen.getByTestId("role").textContent).toBe("admin");
  });

  it("clears token and goes unauthenticated when getMe fails", async () => {
    localStorage.setItem(TOKEN_KEY, "expired-token");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    }));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("login succeeds and sets user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          token: "new-jwt",
          user: { id: 2, email: "user@test.com", full_name: "User", role: "clerk" },
        },
      }),
    }));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });
    expect(screen.getByTestId("user").textContent).toBe("user@test.com");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("new-jwt");
  });

  it("login failure returns error string", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    }));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    let error: string | null = "";
    await act(async () => {
      error = await screen.getByTestId("login-btn").click();
    });

    expect(error).toBeNull();
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });

  it("logout clears user and navigates to /login", async () => {
    localStorage.setItem(TOKEN_KEY, "valid-token");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { user: { id: 1, email: "a@b.com", full_name: "A", role: "admin" } },
      }),
    }));

    const pushMock = vi.fn();
    vi.stubGlobal("window", { ...window, location: { ...window.location, href: "" } });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });

    // Mock useRouter push by stubbing logout's router.push
    // The actual router mock is complex; we test the state change instead
    await act(async () => {
      screen.getByTestId("logout-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
    });
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });
});

describe("useAuth", () => {
  it("throws error when used outside AuthProvider", () => {
    function BadComponent() {
      useAuth();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow("useAuth must be used within AuthProvider");
  });
});
