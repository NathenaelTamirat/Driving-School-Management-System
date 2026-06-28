import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import BatchesPage from "@/app/(dashboard)/batches/page";

const mockFetchResponse = {
  success: true,
  data: [
    { id: 1, name: "Batch A", status: "approved", created_at: "2025-06-01T00:00:00Z" },
    { id: 2, name: "Batch B", status: "pending", created_at: "2025-06-15T00:00:00Z" },
  ],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve(mockFetchResponse) })
  ));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/batches",
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

describe("BatchesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Batches heading", async () => {
    render(<BatchesPage />);
    expect(screen.getByText("Batches")).toBeDefined();
  });

  it("renders stat cards", async () => {
    render(<BatchesPage />);
    expect(screen.getByText("Total")).toBeDefined();
    expect(screen.getByText("Pending")).toBeDefined();
    expect(screen.getByText("Submitted")).toBeDefined();
    expect(screen.getByText("Approved")).toBeDefined();
  });

  it("renders content after successful API response", async () => {
    render(<BatchesPage />);
    await waitFor(() => {
      expect(screen.getByText("Batch A")).toBeDefined();
      expect(screen.getByText("Batch B")).toBeDefined();
    });
  });

  it("shows error state on API failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    render(<BatchesPage />);
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection.")).toBeDefined();
    });
  });

  it("shows loading state initially", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
    render(<BatchesPage />);
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });
});
