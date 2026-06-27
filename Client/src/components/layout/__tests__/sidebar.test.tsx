import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("lucide-react", () => ({
  LayoutDashboard: () => <span data-testid="icon-dashboard">DashboardIcon</span>,
  Users: () => <span data-testid="icon-users">UsersIcon</span>,
}));

beforeEach(() => {
  mockUsePathname.mockReset();
});

describe("Sidebar", () => {
  it("renders DSAS brand link", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);
    expect(screen.getByText("DSAS")).toBeDefined();
    expect(screen.getByText("DSAS").closest("a")).toHaveAttribute("href", "/");
  });

  it("renders Dashboard and Students nav links", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Students")).toBeDefined();
  });

  it("highlights Dashboard link on / path", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("bg-sidebar-accent");
  });

  it("highlights Students link on /students path", () => {
    mockUsePathname.mockReturnValue("/students");
    render(<Sidebar />);
    const studentsLink = screen.getByText("Students").closest("a");
    expect(studentsLink?.className).toContain("bg-sidebar-accent");
  });

  it("highlights Students link on nested /students/new path", () => {
    mockUsePathname.mockReturnValue("/students/new");
    render(<Sidebar />);
    const studentsLink = screen.getByText("Students").closest("a");
    expect(studentsLink?.className).toContain("bg-sidebar-accent");
  });

  it("does not highlight Dashboard when on /students", () => {
    mockUsePathname.mockReturnValue("/students");
    render(<Sidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).not.toContain("bg-sidebar-accent");
  });
});
