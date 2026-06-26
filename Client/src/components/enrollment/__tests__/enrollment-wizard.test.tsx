import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EnrollmentProvider } from "@/components/enrollment/enrollment-provider";
import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";

describe("EnrollmentWizard", () => {
  it("renders the initial step title", () => {
    render(
      <EnrollmentProvider>
        <EnrollmentWizard />
      </EnrollmentProvider>,
    );

    expect(screen.getByText("New Student Enrollment")).toBeDefined();
  });

  it("renders the stepper component", () => {
    render(
      <EnrollmentProvider>
        <EnrollmentWizard />
      </EnrollmentProvider>,
    );

    expect(screen.getByText(/profile/i)).toBeDefined();
  });
});
