import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/header";

const mockUseAuth = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseTheme.mockReset();
  mockUseTheme.mockReturnValue({ resolvedTheme: "light", setTheme: vi.fn() });
});

describe("Header", () => {
  it("renders theme toggle button", () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    render(<Header />);
    expect(screen.getByLabelText("Toggle theme")).toBeDefined();
  });

  it("renders sign out button", () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    render(<Header />);
    expect(screen.getByText("Sign out")).toBeDefined();
  });

  it("displays user info when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { full_name: "Abebe Kebede", role: "admin", email: "a@b.com" },
      logout: vi.fn(),
    });
    render(<Header />);
    expect(screen.getByText("Abebe Kebede")).toBeDefined();
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("renders user initials in avatar circle", () => {
    mockUseAuth.mockReturnValue({
      user: { full_name: "Abebe Kebede", role: "admin", email: "a@b.com" },
      logout: vi.fn(),
    });
    render(<Header />);
    const avatar = screen.getByTitle("Abebe Kebede");
    expect(avatar.textContent).toBe("AK");
  });

  it("shows default initials when no user", () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    render(<Header />);
    const avatar = screen.getByTitle("");
    expect(avatar.textContent).toBe("AD");
  });

  it("hides role when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    render(<Header />);
    expect(screen.queryByText("Admin")).toBeNull();
  });

  it("shows moon icon in light mode", () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    mockUseTheme.mockReturnValue({ resolvedTheme: "light", setTheme: vi.fn() });
    render(<Header />);
    expect(screen.getByLabelText("Toggle theme").querySelector("svg")).toBeDefined();
  });
});
