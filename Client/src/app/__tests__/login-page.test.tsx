import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

const mockUseAuth = vi.fn();
const mockUseRouter = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => mockUseRouter(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("lucide-react", () => ({
  Loader2: () => <span>LoaderIcon</span>,
  LogIn: () => <span>LogInIcon</span>,
  AlertCircle: () => <span>AlertIcon</span>,
  Eye: () => <span>EyeIcon</span>,
  EyeOff: () => <span>EyeOffIcon</span>,
}));

function setupMocks(overrides = {}) {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({
    login: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    ...overrides,
  });
  mockUseRouter.mockReturnValue({ replace: vi.fn() });
}

describe("LoginPage", () => {
  it("shows spinner when loading", () => {
    setupMocks({ isLoading: true });
    render(<LoginPage />);
    expect(screen.getByText("LoaderIcon")).toBeDefined();
  });

  it("renders DSAS branding", () => {
    setupMocks();
    render(<LoginPage />);
    expect(screen.getByText("DSAS")).toBeDefined();
    expect(screen.getByText("Driving School Administration System")).toBeDefined();
  });

  it("renders sign in form heading", () => {
    setupMocks();
    render(<LoginPage />);
    expect(screen.getByText("Sign in to your account")).toBeDefined();
  });

  it("renders email and password fields", () => {
    setupMocks();
    render(<LoginPage />);
    expect(screen.getByLabelText("Email address")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  it("renders sign in button", () => {
    setupMocks();
    render(<LoginPage />);
    expect(screen.getByText("Sign in")).toBeDefined();
  });

  it("shows password toggle button", () => {
    setupMocks();
    render(<LoginPage />);
    expect(screen.getByText("EyeIcon")).toBeDefined();
  });

  it("returns null when authenticated", () => {
    setupMocks({ isAuthenticated: true, isLoading: false });
    const { container } = render(<LoginPage />);
    expect(container.innerHTML).toBe("");
  });

  it("renders placeholder in email input", () => {
    setupMocks();
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText("admin@drivingschool.et");
    expect(emailInput).toBeDefined();
  });

  it("renders version text", () => {
    setupMocks();
    render(<LoginPage />);
    expect(screen.getByText(/DSAS v1.0/)).toBeDefined();
  });
});
