import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LicenseUpgradesPage from "@/app/(dashboard)/license-upgrades/page";

const mockUpgrades = {
  success: true,
  data: [
    { id: 1, student_id: "STU001", current_tier: "A", requested_tier: "B", status: "pending", created_at: "2025-06-01T00:00:00Z", updated_at: "2025-06-01T00:00:00Z" },
    { id: 2, student_id: "STU002", current_tier: "B", requested_tier: "C", status: "approved", created_at: "2025-05-01T00:00:00Z", updated_at: "2025-05-10T00:00:00Z" },
  ],
};

vi.mock("@/lib/api", () => ({
  getLicenseUpgrades: vi.fn().mockResolvedValue(mockUpgrades),
  approveLicenseUpgrade: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/license-upgrades",
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

describe("LicenseUpgradesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders License Upgrades heading", async () => {
    render(<LicenseUpgradesPage />);
    expect(screen.getByText("License Upgrades")).toBeDefined();
  });

  it("renders table headers", async () => {
    render(<LicenseUpgradesPage />);
    expect(screen.getByText("ID")).toBeDefined();
    expect(screen.getByText("Student ID")).toBeDefined();
    expect(screen.getByText("Current Tier")).toBeDefined();
    expect(screen.getByText("Requested Tier")).toBeDefined();
  });

  it("renders upgrades after successful API response", async () => {
    render(<LicenseUpgradesPage />);
    await waitFor(() => {
      expect(screen.getByText("STU001")).toBeDefined();
      expect(screen.getByText("STU002")).toBeDefined();
    });
  });

  it("shows error state on API failure", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getLicenseUpgrades).mockRejectedValueOnce(new Error("Network error"));
    render(<LicenseUpgradesPage />);
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getLicenseUpgrades).mockImplementationOnce(() => new Promise(() => {}));
    render(<LicenseUpgradesPage />);
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });
});
