import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StudentsPage from "@/app/(dashboard)/students/page";

const mockStudents = {
  success: true,
  data: [
    {
      id: 1,
      batch_id: 1,
      student_id: "STU001",
      document_id: "DOC001",
      first_name: "Abebe",
      middle_name: "Kebede",
      last_name: "Tadesse",
      date_of_birth: "1998-05-15",
      blood_type: "O+",
      address: "123 Main St",
      house_number: "H001",
      kebele: "01",
      woreda: "02",
      subcity: "Bole",
      city: "Addis Ababa",
      status: "registered",
      verified: false,
      verified_at: null,
      theory_days_completed: 0,
      practical_days_completed: 0,
      mock_test_score: 0,
      under_penalty: false,
      penalty_start_date: null,
      penalty_end_date: null,
      penalty_reason: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    {
      id: 2,
      batch_id: 1,
      student_id: "STU002",
      document_id: "DOC002",
      first_name: "Bekele",
      middle_name: "Alemayehu",
      last_name: "Girma",
      date_of_birth: "1997-03-10",
      blood_type: "A+",
      address: "456 Oak Rd",
      house_number: "H002",
      kebele: "02",
      woreda: "03",
      subcity: "Kirkos",
      city: "Addis Ababa",
      status: "graduated",
      verified: true,
      verified_at: "2025-06-01T00:00:00Z",
      theory_days_completed: 30,
      practical_days_completed: 20,
      mock_test_score: 85,
      under_penalty: false,
      penalty_start_date: null,
      penalty_end_date: null,
      penalty_reason: null,
      created_at: "2024-11-01T00:00:00Z",
      updated_at: "2025-06-01T00:00:00Z",
    },
  ],
};

const mockBatches = {
  success: true,
  data: [
    { id: 1, name: "Batch A", status: "active" },
  ],
};

vi.mock("@/lib/api", () => ({
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  getBatches: vi.fn().mockResolvedValue(mockBatches),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/students",
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

describe("StudentsPage", () => {
  it("renders Students heading", async () => {
    render(<StudentsPage />);
    expect(screen.getByText("Students")).toBeDefined();
  });

  it("renders New Student button", async () => {
    render(<StudentsPage />);
    const link = screen.getByText("New Student");
    expect(link).toBeDefined();
    expect(link.closest("a")).toHaveAttribute("href", "/students/new");
  });

  it("renders stat cards", async () => {
    render(<StudentsPage />);
    expect(screen.getByText("Total Students")).toBeDefined();
    expect(screen.getByText("Total Batches")).toBeDefined();
    expect(screen.getByText("Currently Learning")).toBeDefined();
    expect(screen.getByText("Graduated")).toBeDefined();
  });

  it("renders search input", () => {
    render(<StudentsPage />);
    expect(screen.getByPlaceholderText("Search by name or ID...")).toBeDefined();
  });

  it("renders filter selects", () => {
    render(<StudentsPage />);
    expect(screen.getByText("All Statuses")).toBeDefined();
    expect(screen.getAllByText("All Verification").length).toBeGreaterThan(0);
  });

  it("renders table headers", () => {
    render(<StudentsPage />);
    expect(screen.getByText("Student ID")).toBeDefined();
    expect(screen.getByText("Full Name")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Verification")).toBeDefined();
    expect(screen.getByText("License Category")).toBeDefined();
  });
});
