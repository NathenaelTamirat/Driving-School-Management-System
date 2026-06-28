import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ClerkPage from "@/app/(clerk)/clerk/page";

const mockStudents = {
  success: true,
  data: [
    { id: 1, student_id: "STU001", first_name: "Abebe", middle_name: "Kebede", last_name: "Tadesse", status: "registered", date_of_birth: "1998-05-15", blood_type: "O+", address: "123 Main St", house_number: "H001", kebele: "01", woreda: "02", subcity: "Bole", city: "Addis Ababa", verified: false, verified_at: null, theory_days_completed: 0, practical_days_completed: 0, mock_test_score: 0, under_penalty: false, penalty_start_date: null, penalty_end_date: null, penalty_reason: null, batch_id: 1, document_id: "DOC001", created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  ],
};

const mockInvoices = {
  success: true,
  data: [
    { id: 1, student_id: 1, amount: 1500, milestone_type: "registration", status: "pending", created_at: "2025-06-01T00:00:00Z", updated_at: "2025-06-01T00:00:00Z" },
  ],
};

vi.mock("@/lib/api", () => ({
  getStudents: vi.fn().mockResolvedValue(mockStudents),
  getInvoices: vi.fn().mockResolvedValue(mockInvoices),
  markInvoicePaid: vi.fn().mockResolvedValue({ success: true }),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ success: true }) })
  ));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/clerk",
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

describe("ClerkPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Clerk Overview heading", async () => {
    render(<ClerkPage />);
    await waitFor(() => {
      expect(screen.getByText("Clerk Overview")).toBeDefined();
    });
  });

  it("renders stat cards after loading", async () => {
    render(<ClerkPage />);
    await waitFor(() => {
      expect(screen.getByText("Total Students")).toBeDefined();
      expect(screen.getByText("Pending Invoices")).toBeDefined();
      expect(screen.getByText("Unverified Students")).toBeDefined();
    });
  });

  it("renders New Student button", async () => {
    render(<ClerkPage />);
    await waitFor(() => {
      expect(screen.getByText("New Student")).toBeDefined();
    });
  });

  it("shows error state on API failure", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockRejectedValueOnce(new Error("Network error"));
    render(<ClerkPage />);
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    const api = await import("@/lib/api");
    vi.mocked(api.getStudents).mockImplementationOnce(() => new Promise(() => {}));
    vi.mocked(api.getInvoices).mockImplementationOnce(() => new Promise(() => {}));
    render(<ClerkPage />);
    expect(screen.getByText("Clerk Overview")).toBeDefined();
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });
});
