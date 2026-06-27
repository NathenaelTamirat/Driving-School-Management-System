import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EnrollmentStepper } from "@/components/enrollment/enrollment-stepper";

describe("EnrollmentStepper", () => {
  it("renders all four steps with default variant", () => {
    render(<EnrollmentStepper currentStep={1} />);

    expect(screen.getByText("Student Info")).toBeDefined();
    expect(screen.getByText("Category")).toBeDefined();
    expect(screen.getByText("Documents")).toBeDefined();
    expect(screen.getByText("Payment")).toBeDefined();
  });

  it("renders Profile label when profile variant", () => {
    render(<EnrollmentStepper currentStep={1} variant="profile" />);

    expect(screen.getByText("Profile")).toBeDefined();
    expect(screen.getByText("Category")).toBeDefined();
    expect(screen.getByText("Documents")).toBeDefined();
    expect(screen.getByText("Payment")).toBeDefined();
  });

  it("renders step numbers for inactive/completed steps", () => {
    render(<EnrollmentStepper currentStep={2} />);

    const steps = screen.getAllByText(/^\d+$/);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("renders checkmark icons for completed steps (step 3)", () => {
    const { container } = render(<EnrollmentStepper currentStep={3} />);

    const checkIcons = container.querySelectorAll("svg");
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it("marks step 1 as active on currentStep=1", () => {
    render(<EnrollmentStepper currentStep={1} />);

    const stepLabels = screen.getAllByText(/Student Info|Profile/);
    const firstLabel = stepLabels[0];
    expect(firstLabel.className).toContain("text-[#2563eb]");
  });
});
