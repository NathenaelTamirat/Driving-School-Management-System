import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileStep } from "@/components/enrollment/steps/profile-step";

const mockEnrollment = vi.fn();

vi.mock("@/components/enrollment/enrollment-provider", () => ({
  useEnrollment: () => mockEnrollment(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function setupMocks(overrides = {}) {
  const defaults = {
    state: {
      profile: {
        firstNameEn: "",
        fatherNameEn: "",
        lastNameEn: "",
        phone: "",
        dateOfBirthEc: "",
        bloodType: "",
        address: "",
        houseNumber: "",
        kebele: "",
        woreda: "",
        subcity: "",
        city: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
      },
    },
    updateProfile: vi.fn(),
    saveDraft: vi.fn(),
    draftLoaded: true,
  };
  mockEnrollment.mockReturnValue({ ...defaults, ...overrides });
}

describe("ProfileStep", () => {
  it("shows loading state when draft not loaded", () => {
    setupMocks({ draftLoaded: false });
    render(<ProfileStep onContinue={vi.fn()} />);
    expect(screen.getByText("Loading…")).toBeDefined();
  });

  it("renders all form sections when loaded", () => {
    setupMocks();
    render(<ProfileStep onContinue={vi.fn()} />);

    expect(screen.getByText("Personal Information")).toBeDefined();
    expect(screen.getByText("Address Information")).toBeDefined();
    expect(screen.getByText("Emergency Contact")).toBeDefined();
  });

  it("renders Save Draft and Continue buttons", () => {
    setupMocks();
    render(<ProfileStep onContinue={vi.fn()} />);

    expect(screen.getByText("Save Draft")).toBeDefined();
    expect(screen.getByText("Continue to Category")).toBeDefined();
  });

  it("renders blood type select", () => {
    setupMocks();
    render(<ProfileStep onContinue={vi.fn()} />);

    expect(screen.getByText("Select blood type")).toBeDefined();
  });

  it("renders phone input with +251 prefix", () => {
    setupMocks();
    render(<ProfileStep onContinue={vi.fn()} />);

    expect(screen.getByText("+251")).toBeDefined();
  });
});
