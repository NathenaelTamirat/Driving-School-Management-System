import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryStep } from "@/components/enrollment/steps/category-step";

const mockEnrollment = vi.fn();

vi.mock("@/components/enrollment/enrollment-provider", () => ({
  useEnrollment: () => mockEnrollment(),
}));

vi.mock("lucide-react", () => ({
  Car: () => <span>CarIcon</span>,
  Bike: () => <span>BikeIcon</span>,
  Bus: () => <span>BusIcon</span>,
  Truck: () => <span>TruckIcon</span>,
  Check: () => <span>CheckIcon</span>,
  Clock: () => <span>ClockIcon</span>,
  GraduationCap: () => <span>GradIcon</span>,
  Stethoscope: () => <span>StethIcon</span>,
  IdCard: () => <span>IdIcon</span>,
}));

function setupMocks(overrides = {}) {
  const defaults = {
    state: { categoryId: null },
    setCategory: vi.fn(),
  };
  mockEnrollment.mockReturnValue({ ...defaults, ...overrides });
}

describe("CategoryStep", () => {
  it("renders all four license categories", () => {
    setupMocks();
    render(<CategoryStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByText("Auto (Automobile)")).toBeDefined();
    expect(screen.getByText("Motorcycle")).toBeDefined();
    expect(screen.getByText("Public-1 (Minibus)")).toBeDefined();
    expect(screen.getByText("Dry Cargo-1 (Truck)")).toBeDefined();
  });

  it("disables Continue when no category selected", () => {
    setupMocks();
    render(<CategoryStep onBack={vi.fn()} onContinue={vi.fn()} />);

    const continueBtn = screen.getByText("Continue to Documents");
    expect(continueBtn.closest("button")).toBeDisabled();
  });

  it("enables Continue when category selected", () => {
    setupMocks({ state: { categoryId: "auto" } });
    render(<CategoryStep onBack={vi.fn()} onContinue={vi.fn()} />);

    const continueBtn = screen.getByText("Continue to Documents");
    expect(continueBtn.closest("button")).not.toBeDisabled();
  });

  it("renders Back button", () => {
    setupMocks();
    render(<CategoryStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByText("Back")).toBeDefined();
  });

  it("calls onContinue when Continue clicked with selection", () => {
    const onContinue = vi.fn();
    setupMocks({ state: { categoryId: "motor" } });
    render(<CategoryStep onBack={vi.fn()} onContinue={onContinue} />);

    fireEvent.click(screen.getByText("Continue to Documents"));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("renders category prices", () => {
    setupMocks();
    render(<CategoryStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByText("26,010.00 ETB")).toBeDefined();
    expect(screen.getByText("15,500.00 ETB")).toBeDefined();
    expect(screen.getByText("32,450.00 ETB")).toBeDefined();
    expect(screen.getByText("38,000.00 ETB")).toBeDefined();
  });
});
