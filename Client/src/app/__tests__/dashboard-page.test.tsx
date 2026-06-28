import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/(dashboard)/page";

const mockStudents = {
  success: true,
  data: [
    { id: 1, first_name: "Abebe", last_name: "Tadesse", status: "registered", student_id: "STU001", batch_id: 1, document_id: "DOC001", middle_name: "Kebede", date_of_birth: "1998-05-15", blood_type: "O+", address: "123 Main St", house_number: "H001", kebele: "01", woreda: "02", subcity: "Bole", city: "Addis Ababa", verified: false, verified_at: null, theory_days_completed: 0, practical_days_completed: 0, mock_test_score: 0, under_penalty: false, penalty_start_date: null, penalty_end_date: null, penalty_reason: null, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
    { id: 2, first_name: "Bekele", last_name: "Girma", status: "graduated", student_id: "STU002", batch_id: 1, document_id: "DOC002", middle_name: "Alemayehu", date_of_birth: "1997-03-10", blood_type: "A+", address: "456 Oak Rd", house_number: "H002", kebele: "02", woreda: "03", subcity: "Kirkos", city: "Addis Ababa", verified: true, verified_at: "2025-06-01T00:00:00Z", theory_days_completed: 30, practical_days_completed: 20, mock_test_score: 85, under_penalty: false, penalty_start_date: null, penalty_end_date: null, penalty_reason: null, created_at: "2024-11-01T00:00:00Z", updated_at: "2025-06-01T00:00:00Z" },
  ],
};

const mockBatches = {
  success: true,
  data: [
    { id: 1, name: "Batch A", status: "active", created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  ],
};

vi.mock("@/lib/api", () => ({
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  getBatches: vi.fn().mockResolvedValue(mockBatches),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
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

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Dashboard heading", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeDefined();
  });

  it("renders New Student CTA link", () => {
    render(<DashboardPage />);
    const link = screen.getByText("New Student");
    expect(link).toBeDefined();
    expect(link.closest("a")).toHaveAttribute("href", "/students/new");
  });

  it("renders stat cards after API response", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Total Students")).toBeDefined();
      expect(screen.getByText("Active Batches")).toBeDefined();
      expect(screen.getByText("Currently Learning")).toBeDefined();
      expect(screen.getByText("Graduated")).toBeDefined();
    });
  });

  it("renders quick actions section", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Quick Actions")).toBeDefined();
  });

  it("renders Student Status Overview section", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Student Status Overview")).toBeDefined();
  });

  it("renders stat values after data loads", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeDefined();
    });
  });

  it("shows loading animation when API is pending", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockImplementationOnce(() => new Promise(() => {}));
    vi.mocked(api.getBatches).mockImplementationOnce(() => new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });
});
