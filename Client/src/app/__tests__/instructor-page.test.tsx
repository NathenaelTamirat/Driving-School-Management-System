import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import InstructorPage from "@/app/(instructor)/instructor/page";

const mockStudents = {
  success: true,
  data: [
    { id: 1, student_id: "STU001", first_name: "Abebe", middle_name: "Kebede", last_name: "Tadesse", status: "theory_in_progress", date_of_birth: "1998-05-15", blood_type: "O+", address: "123 Main St", house_number: "H001", kebele: "01", woreda: "02", subcity: "Bole", city: "Addis Ababa", verified: false, verified_at: null, theory_days_completed: 5, practical_days_completed: 0, mock_test_score: 0, under_penalty: false, penalty_start_date: null, penalty_end_date: null, penalty_reason: null, batch_id: 1, document_id: "DOC001", created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  ],
};

const mockPayroll = {
  success: true,
  data: [
    { id: 1, period_start: "2025-06-01", period_end: "2025-06-30", base_pay: 5000, active_student_loads: 10, active_training_days: 20, total_pay: 7000, status: "draft" },
  ],
};

vi.mock("@/lib/api", () => ({
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  getPayrollEntries: vi.fn().mockResolvedValue(mockPayroll),
  createAttendanceLog: vi.fn().mockResolvedValue({ success: true }),
  createMockTest: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/instructor",
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

describe("InstructorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Instructor Overview heading", async () => {
    render(<InstructorPage />);
    await waitFor(() => {
      expect(screen.getByText("Instructor Overview")).toBeDefined();
    });
  });

  it("renders stat cards after loading", async () => {
    render(<InstructorPage />);
    await waitFor(() => {
      expect(screen.getByText("Active Students")).toBeDefined();
      expect(screen.getByText("Theory in Progress")).toBeDefined();
      expect(screen.getByText("Practical in Progress")).toBeDefined();
    });
  });

  it("renders student data after successful API response", async () => {
    render(<InstructorPage />);
    await waitFor(() => {
      expect(screen.getByText("Abebe")).toBeDefined();
    });
  });

  it("shows error state on API failure", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockRejectedValueOnce(new Error("Network error"));
    render(<InstructorPage />);
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockImplementationOnce(() => new Promise(() => {}));
    vi.mocked(api.getPayrollEntries).mockImplementationOnce(() => new Promise(() => {}));
    render(<InstructorPage />);
    expect(screen.getByText("Instructor Overview")).toBeDefined();
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });
});
