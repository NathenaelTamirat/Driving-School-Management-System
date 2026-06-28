import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import InvoicesPage from "@/app/(dashboard)/invoices/page";
import { getInvoices } from "@/lib/api";

const mockInvoices = {
  success: true,
  data: {
    invoices: [
      { id: 1, invoice_number: "INV-001", student_name: "John Doe", invoice_type: "Registration and Theory Fee", amount: 5000, status: "pending", due_date: "2025-06-01" },
      { id: 2, invoice_number: "INV-002", student_name: "Jane Smith", invoice_type: "Practical Fee Release", amount: 8000, status: "paid", due_date: "2025-05-15" },
    ],
    meta: { current_page: 1, total_pages: 1, total_count: 2, per_page: 20 },
  },
};

vi.mock("@/lib/api", () => ({
  getInvoices: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("lucide-react", () => ({
  Search: () => <span>SearchIcon</span>,
  ChevronLeft: () => <span>ChevronLeftIcon</span>,
  ChevronRight: () => <span>ChevronRightIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
  RefreshCw: () => <span>RefreshCwIcon</span>,
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("InvoicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading", async () => {
    vi.mocked(getInvoices).mockResolvedValue(mockInvoices);
    render(<InvoicesPage />);
    expect(screen.getByText("Invoices")).toBeDefined();
  });

  it("renders invoice rows", async () => {
    vi.mocked(getInvoices).mockResolvedValue(mockInvoices);
    render(<InvoicesPage />);
    await waitFor(() => {
      expect(screen.getByText("INV-001")).toBeDefined();
      expect(screen.getByText("INV-002")).toBeDefined();
    });
  });

  it("shows error banner on API failure", async () => {
    vi.mocked(getInvoices).mockRejectedValue(new Error("Network error"));
    render(<InvoicesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeDefined();
    });
  });

  it("renders filters", async () => {
    vi.mocked(getInvoices).mockResolvedValue(mockInvoices);
    render(<InvoicesPage />);
    await waitFor(() => {
      expect(screen.getByText("All Statuses")).toBeDefined();
      expect(screen.getByText("All Types")).toBeDefined();
    });
  });
});
