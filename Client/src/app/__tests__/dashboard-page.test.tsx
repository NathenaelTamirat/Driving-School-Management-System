import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(dashboard)/page";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("lucide-react", () => ({
  Plus: () => <span>PlusIcon</span>,
}));

describe("DashboardPage", () => {
  it("renders Dashboard heading", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeDefined();
  });

  it("renders New Student CTA link", () => {
    render(<DashboardPage />);
    const link = screen.getByText("New Student");
    expect(link).toBeDefined();
    expect(link.closest("a")).toHaveAttribute("href", "/students/new");
  });
});
