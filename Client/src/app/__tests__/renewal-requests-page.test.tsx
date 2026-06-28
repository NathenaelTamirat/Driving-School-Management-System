import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RenewalRequestsPage from "@/app/(dashboard)/renewal-requests/page";

const mockRequests = {
  success: true,
  data: [
    { id: 1, student_id: "STU001", status: "submitted", created_at: "2025-06-01T00:00:00Z", updated_at: "2025-06-01T00:00:00Z" },
    { id: 2, student_id: "STU002", status: "completed", created_at: "2025-05-15T00:00:00Z", updated_at: "2025-05-20T00:00:00Z" },
  ],
};

vi.mock("@/lib/api", () => ({
  getRenewalRequests: vi.fn().mockResolvedValue(mockRequests),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/renewal-requests",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("lucide-react", () => {
  const icons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {};
  const handler = {
    get(_target: unknown, prop: string) {
      if (prop === "default") return undefined;
      return () => <span>{prop}Icon</span>;
    },
  };
  return new Proxy(icons, handler);
});

describe("RenewalRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Renewal Requests heading", async () => {
    render(<RenewalRequestsPage />);
    expect(screen.getByText("Renewal Requests")).toBeDefined();
  });

  it("renders table headers", async () => {
    render(<RenewalRequestsPage />);
    expect(screen.getByText("ID")).toBeDefined();
    expect(screen.getByText("Student ID")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Created")).toBeDefined();
  });

  it("renders requests after successful API response", async () => {
    render(<RenewalRequestsPage />);
    await waitFor(() => {
      expect(screen.getByText("STU001")).toBeDefined();
      expect(screen.getByText("STU002")).toBeDefined();
    });
  });

  it("shows error state on API failure", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getRenewalRequests).mockRejectedValueOnce(new Error("Network error"));
    render(<RenewalRequestsPage />);
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getRenewalRequests).mockImplementationOnce(() => new Promise(() => {}));
    render(<RenewalRequestsPage />);
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });
});
