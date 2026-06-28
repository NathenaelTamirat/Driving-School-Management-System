import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import GraduationPage from "@/app/(dashboard)/graduation/page";

const mockStudents = {
  success: true,
  data: [
    { id: 1, student_id: "STU001", first_name: "Abebe", middle_name: "Kebede", last_name: "Tadesse", status: "exam_eligible", date_of_birth: "1998-05-15", blood_type: "O+", address: "123 Main St", house_number: "H001", kebele: "01", woreda: "02", subcity: "Bole", city: "Addis Ababa", verified: true, verified_at: "2025-06-01T00:00:00Z", theory_days_completed: 30, practical_days_completed: 20, mock_test_score: 85, under_penalty: false, penalty_start_date: null, penalty_end_date: null, penalty_reason: null, batch_id: 1, document_id: "DOC001", created_at: "2024-11-01T00:00:00Z", updated_at: "2025-06-01T00:00:00Z" },
    { id: 2, student_id: "STU002", first_name: "Bekele", middle_name: "Alemayehu", last_name: "Girma", status: "graduated", date_of_birth: "1997-03-10", blood_type: "A+", address: "456 Oak Rd", house_number: "H002", kebele: "02", woreda: "03", subcity: "Kirkos", city: "Addis Ababa", verified: true, verified_at: "2025-06-01T00:00:00Z", theory_days_completed: 30, practical_days_completed: 20, mock_test_score: 90, under_penalty: false, penalty_start_date: null, penalty_end_date: null, penalty_reason: null, batch_id: 1, document_id: "DOC002", created_at: "2024-11-01T00:00:00Z", updated_at: "2025-06-01T00:00:00Z" },
  ],
};

vi.mock("@/lib/api", () => ({
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  getGraduationRecord: vi.fn().mockResolvedValue({ success: true, data: null }),
  getLmsProgress: vi.fn().mockResolvedValue({ success: true, data: null }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/graduation",
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

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GraduationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Graduation Processing heading", async () => {
    render(<GraduationPage />);
    expect(screen.getByText("Graduation Processing")).toBeDefined();
  });

  it("renders Eligible Students card title", async () => {
    render(<GraduationPage />);
    expect(screen.getByText("Eligible Students")).toBeDefined();
  });

  it("renders content after successful API response", async () => {
    render(<GraduationPage />);
    await waitFor(() => {
      expect(screen.getByText("Abebe")).toBeDefined();
    });
  });

  it("shows ready and graduated counts", async () => {
    render(<GraduationPage />);
    await waitFor(() => {
      expect(screen.getByText("Ready:")).toBeDefined();
      expect(screen.getByText("Graduated:")).toBeDefined();
    });
  });

  it("shows error state on API failure", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockRejectedValueOnce(new Error("Network error"));
    render(<GraduationPage />);
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockImplementationOnce(() => new Promise(() => {}));
    render(<GraduationPage />);
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });
});
