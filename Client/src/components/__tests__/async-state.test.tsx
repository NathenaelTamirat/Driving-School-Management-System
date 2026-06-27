import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState, ErrorState, NotFoundState, AsyncWrapper } from "@/components/async-state";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("LoadingState", () => {
  it("renders default loading message", () => {
    render(<LoadingState />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders custom message", () => {
    render(<LoadingState message="Fetching students..." />);
    expect(screen.getByText("Fetching students...")).toBeDefined();
  });

  it("renders spinner", () => {
    const { container } = render(<LoadingState />);
    const spinners = container.querySelectorAll(".animate-spin");
    expect(spinners.length).toBeGreaterThan(0);
  });
});

describe("ErrorState", () => {
  it("renders default error message", () => {
    render(<ErrorState />);
    expect(screen.getByText("Error")).toBeDefined();
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("renders custom error message", () => {
    render(<ErrorState message="Network failure" />);
    expect(screen.getByText("Network failure")).toBeDefined();
  });

  it("renders retry button when onRetry provided", () => {
    render(<ErrorState onRetry={vi.fn()} />);
    expect(screen.getByText("Try Again")).toBeDefined();
  });

  it("does not render retry button when onRetry omitted", () => {
    render(<ErrorState />);
    expect(screen.queryByText("Try Again")).toBeNull();
  });
});

describe("NotFoundState", () => {
  it("renders 404 heading", () => {
    render(<NotFoundState />);
    expect(screen.getByText("404")).toBeDefined();
  });

  it("renders default title and message", () => {
    render(<NotFoundState />);
    expect(screen.getByText("Page Not Found")).toBeDefined();
  });

  it("renders custom title", () => {
    render(<NotFoundState title="Student Not Found" />);
    expect(screen.getByText("Student Not Found")).toBeDefined();
  });

  it("renders action button when provided", () => {
    render(
      <NotFoundState
        action={{ label: "Go Home", onClick: vi.fn() }}
      />,
    );
    expect(screen.getByText("Go Home")).toBeDefined();
  });
});

describe("AsyncWrapper", () => {
  it("renders LoadingState when isLoading is true", () => {
    render(
      <AsyncWrapper isLoading={true} error={null}>
        <span>Content</span>
      </AsyncWrapper>,
    );
    expect(screen.getByText("Loading...")).toBeDefined();
    expect(screen.queryByText("Content")).toBeNull();
  });

  it("renders ErrorState when error is set", () => {
    render(
      <AsyncWrapper isLoading={false} error="Something broke">
        <span>Content</span>
      </AsyncWrapper>,
    );
    expect(screen.getByText("Something broke")).toBeDefined();
    expect(screen.queryByText("Content")).toBeNull();
  });

  it("renders children when not loading and no error", () => {
    render(
      <AsyncWrapper isLoading={false} error={null}>
        <span>Content</span>
      </AsyncWrapper>,
    );
    expect(screen.getByText("Content")).toBeDefined();
  });
});
