import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";

vi.mock("@/components/layout/sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("@/components/layout/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

describe("AppShell", () => {
  it("renders sidebar, header, and children", () => {
    render(
      <AppShell>
        <div data-testid="content">Main Content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("sidebar")).toBeDefined();
    expect(screen.getByTestId("header")).toBeDefined();
    expect(screen.getByTestId("content")).toBeDefined();
    expect(screen.getByText("Main Content")).toBeDefined();
  });

  it("renders children in a main tag", () => {
    render(
      <AppShell>
        <p>Child text</p>
      </AppShell>,
    );

    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(main?.textContent).toContain("Child text");
  });
});
