import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ReportsPage from "@/app/(dashboard)/reports/page";

const mockSummary = {
  success: true,
  data: {
    total_revenue: 500000,
    total_collected: 350000,
    total_pending: 150000,
    invoice_count: 100,
    paid_count: 70,
    pending_count: 30,
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

vi.mock("lucide-react", () => ({
  TrendingUp: () => <span>TrendingUpIcon</span>,
  DollarSign: () => <span>DollarSignIcon</span>,
  CreditCard: () => <span>CreditCardIcon</span>,
  BarChart3: () => <span>BarChart3Icon</span>,
  Download: () => <span>DownloadIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
  RefreshCw: () => <span>RefreshCwIcon</span>,
}));

describe("ReportsPage", () => {
  it("renders heading", () => {
    render(<ReportsPage />);
    expect(screen.getByText("Financial Reports")).toBeDefined();
  });

  it("renders loading skeleton while fetching", () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    render(<ReportsPage />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(4);
  });

  it("renders stat cards on success", async () => {
    (global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve(mockSummary),
      ok: true,
    });
    render(<ReportsPage />);
    await waitFor(() => {
      expect(screen.getByText("Total Revenue")).toBeDefined();
      expect(screen.getByText("Collected")).toBeDefined();
      expect(screen.getByText("Pending")).toBeDefined();
      expect(screen.getByText("Invoices")).toBeDefined();
    });
  });

  it("shows error banner on API failure", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));
    render(<ReportsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeDefined();
    });
  });

  it("renders Export CSV button", () => {
    render(<ReportsPage />);
    expect(screen.getByText("Export CSV")).toBeDefined();
  });
});
