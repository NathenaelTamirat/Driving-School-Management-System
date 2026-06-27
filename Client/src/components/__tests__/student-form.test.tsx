import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudentForm } from "@/components/student-form";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
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

describe("StudentForm", () => {
  it("renders step indicator with three steps", () => {
    render(<StudentForm />);
    expect(screen.getByText("Student Info")).toBeDefined();
    expect(screen.getByText("Documents")).toBeDefined();
    expect(screen.getByText("Review")).toBeDefined();
  });

  it("renders Student Information heading in step 1", () => {
    render(<StudentForm />);
    expect(screen.getByText("Student Information")).toBeDefined();
  });

  it("renders Next: Documents button in step 1", () => {
    render(<StudentForm />);
    expect(screen.getByText("Next: Documents")).toBeDefined();
  });

  it("renders first name input", () => {
    render(<StudentForm />);
    const input = screen.getByPlaceholderText("Enter first name");
    expect(input).toBeDefined();
  });

  it("renders blood type select", () => {
    render(<StudentForm />);
    expect(screen.getByText("Select blood type")).toBeDefined();
  });

  it("renders Address Information section", () => {
    render(<StudentForm />);
    expect(screen.getByText("Address Information")).toBeDefined();
  });

  it("renders verified status select", () => {
    render(<StudentForm />);
    expect(screen.getByText("Verification Status")).toBeDefined();
  });

  it("renders Pending Verification option by default", () => {
    render(<StudentForm />);
    expect(screen.getByText("Pending Verification")).toBeDefined();
  });
});
