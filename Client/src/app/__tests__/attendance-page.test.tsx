import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AttendancePage from "@/app/(dashboard)/attendance/page";

const mockStudents = {
  success: true,
  data: [
    { id: 1, student_id: "STU001", first_name: "Abebe", middle_name: "Kebede", last_name: "Tadesse", status: "theory_in_progress", date_of_birth: "1998-05-15", blood_type: "O+", address: "123 Main St", house_number: "H001", kebele: "01", woreda: "02", subcity: "Bole", city: "Addis Ababa", verified: false, verified_at: null, theory_days_completed: 0, practical_days_completed: 0, mock_test_score: 0, under_penalty: false, penalty_start_date: null, penalty_end_date: null, penalty_reason: null, batch_id: 1, document_id: "DOC001", created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  ],
};

const mockLogs = {
  success: true,
  data: [
    { id: 1, student_id: 1, phase: "theory", attendance_date: "2025-06-01", present: true, notes: "On time" },
  ],
};

vi.mock("@/lib/api", () => ({
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  getAttendanceLogs: vi.fn().mockResolvedValue(mockLogs),
  createAttendanceLog: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/attendance",
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

describe("AttendancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Attendance Logging heading", async () => {
    render(<AttendancePage />);
    expect(screen.getByText("Attendance Logging")).toBeDefined();
  });

  it("renders Log Attendance card title", async () => {
    render(<AttendancePage />);
    expect(screen.getByText("Log Attendance")).toBeDefined();
  });

  it("renders student select placeholder", async () => {
    render(<AttendancePage />);
    expect(screen.getByText("Select student...")).toBeDefined();
  });

  it("renders content after successful API response", async () => {
    render(<AttendancePage />);
    await waitFor(() => {
      expect(screen.getByText("Abebe")).toBeDefined();
    });
  });

  it("shows error state on API failure", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockRejectedValueOnce(new Error("Network error"));
    render(<AttendancePage />);
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockImplementationOnce(() => new Promise(() => {}));
    render(<AttendancePage />);
    expect(screen.getByText("Loading students...")).toBeDefined();
  });
});
