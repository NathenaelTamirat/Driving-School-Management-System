import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("renders as a button element by default", () => {
    render(<Button>Test</Button>);
    const btn = screen.getByText("Test");
    expect(btn.tagName).toBe("BUTTON");
  });

  it("applies default variant classes", () => {
    render(<Button>Default</Button>);
    const btn = screen.getByText("Default");
    expect(btn.className).toContain("bg-primary");
  });

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByText("Outline");
    expect(btn.className).toContain("border-input");
  });

  it("applies size classes", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByText("Large");
    expect(btn.className).toContain("h-10");
  });

  it("handles click events", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByText("Disabled") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
