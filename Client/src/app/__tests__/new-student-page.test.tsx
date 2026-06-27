import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StudentFormPage from "@/app/students/new/page";

vi.mock("@/components/enrollment/enrollment-provider", () => ({
  EnrollmentProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="enrollment-provider">{children}</div>
  ),
}));

vi.mock("@/components/enrollment/enrollment-wizard", () => ({
  EnrollmentWizard: () => <div data-testid="enrollment-wizard">Wizard</div>,
}));

describe("NewStudentPage", () => {
  it("renders EnrollmentProvider wrapper", () => {
    render(<StudentFormPage />);
    expect(screen.getByTestId("enrollment-provider")).toBeDefined();
  });

  it("renders EnrollmentWizard inside provider", () => {
    render(<StudentFormPage />);
    expect(screen.getByTestId("enrollment-wizard")).toBeDefined();
  });

  it("has min-h-screen and bg color classes", () => {
    const { container } = render(<StudentFormPage />);
    const outerDiv = container.firstChild?.firstChild as HTMLElement;
    expect(outerDiv.className).toContain("min-h-screen");
    expect(outerDiv.className).toContain("bg-[#f4f6f9]");
  });
});
