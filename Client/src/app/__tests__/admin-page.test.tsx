import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminPage from "@/app/(admin)/admin/page";

const mockStudents = {
  success: true,
  data: [
    { id: 1, student_id: "STU001", first_name: "Abebe", middle_name: "Kebede", last_name: "Tadesse", status: "registered", date_of_birth: "1998-05-15", blood_type: "O+", address: "123 Main St", house_number: "H001", kebele: "01", woreda: "02", subcity: "Bole", city: "Addis Ababa", verified: false, verified_at: null, theory_days_completed: 0, practical_days_completed: 0, mock_test_score: 0, under_penalty: false, penalty_start_date: null, penalty_end_date: null, penalty_reason: null, batch_id: 1, document_id: "DOC001", created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  ],
};

const mockUsers = {
  success: true,
  data: [
    { id: 1, full_name: "Admin User", email: "admin@test.com", role: "admin", created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
    { id: 2, full_name: "Instructor One", email: "instructor@test.com", role: "instructor", created_at: "2025-01-02T00:00:00Z", updated_at: "2025-01-02T00:00:00Z" },
  ],
};

const mockBatches = {
  success: true,
  data: [
    { id: 1, name: "Batch A", status: "approved", created_at: "2025-06-01T00:00:00Z", updated_at: "2025-06-01T00:00:00Z" },
  ],
};

vi.mock("@/lib/api", () => ({
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  getUsers: vi.fn().mockResolvedValue(mockUsers),
  getBatches: vi.fn().mockResolvedValue(mockBatches),
  createUser: vi.fn().mockResolvedValue({ success: true }),
  createBatch: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin",
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

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Admin Overview heading", async () => {
    render(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText("Admin Overview")).toBeDefined();
    });
  });

  it("renders stat cards after loading", async () => {
    render(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeDefined();
      expect(screen.getByText("Instructors")).toBeDefined();
      expect(screen.getByText("Clerks")).toBeDefined();
      expect(screen.getByText("Students")).toBeDefined();
      expect(screen.getByText("Under Penalty")).toBeDefined();
      expect(screen.getByText("Unverified")).toBeDefined();
      expect(screen.getByText("Batches")).toBeDefined();
      expect(screen.getByText("Pending Batches")).toBeDefined();
    });
  });

  it("renders user data after successful API response", async () => {
    render(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeDefined();
      expect(screen.getByText("Instructor One")).toBeDefined();
    });
  });

  it("shows error state on API failure", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockRejectedValueOnce(new Error("Network error"));
    render(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockImplementationOnce(() => new Promise(() => {}));
    vi.mocked(api.getUsers).mockImplementationOnce(() => new Promise(() => {}));
    vi.mocked(api.getBatches).mockImplementationOnce(() => new Promise(() => {}));
    render(<AdminPage />);
    expect(screen.getByText("Admin Overview")).toBeDefined();
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });
});
