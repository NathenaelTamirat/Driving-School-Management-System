import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentsStep } from "@/components/enrollment/steps/documents-step";

const mockEnrollment = vi.fn();

vi.mock("@/components/enrollment/enrollment-provider", () => ({
  useEnrollment: () => mockEnrollment(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("lucide-react", () => ({
  ArrowRight: () => <span>ArrowIcon</span>,
  FileText: () => <span>FileIcon</span>,
  GraduationCap: () => <span>GradIcon</span>,
  ImageIcon: () => <span>ImageIcon</span>,
  ScanLine: () => <span>ScanIcon</span>,
  Stethoscope: () => <span>StethIcon</span>,
  Upload: () => <span>UploadIcon</span>,
}));

function setupMocks(overrides = {}) {
  const defaults = {
    state: { documents: {} },
    setDocument: vi.fn(),
  };
  mockEnrollment.mockReturnValue({ ...defaults, ...overrides });
}

describe("DocumentsStep", () => {
  it("renders Required Documents heading", () => {
    setupMocks();
    render(<DocumentsStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByText("Required Documents")).toBeDefined();
  });

  it("renders upload instruction text", () => {
    setupMocks();
    render(<DocumentsStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByText(/Upload or scan/)).toBeDefined();
  });

  it("renders document rows", () => {
    setupMocks();
    render(<DocumentsStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByText("Profile Photo")).toBeDefined();
    expect(screen.getByText("Yellow Card")).toBeDefined();
    expect(screen.getByText("8th Grade Document")).toBeDefined();
  });

  it("renders Back and Continue buttons", () => {
    setupMocks();
    render(<DocumentsStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByText("Back")).toBeDefined();
    expect(screen.getByText("Continue to Payment")).toBeDefined();
  });

  it("shows Awaiting Upload badges by default", () => {
    setupMocks();
    render(<DocumentsStep onBack={vi.fn()} onContinue={vi.fn()} />);

    const badges = screen.getAllByText("Awaiting Upload");
    expect(badges.length).toBeGreaterThan(3);
  });

  it("shows Uploaded badges for uploaded documents", () => {
    setupMocks({
      state: {
        documents: {
          profile_photo: { file: new File([], "p.jpg"), preview: null, name: "p.jpg", size: 100 },
        },
      },
    });
    render(<DocumentsStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByText("Uploaded")).toBeDefined();
  });

  it("renders Remove button for uploaded documents", () => {
    setupMocks({
      state: {
        documents: {
          grade_8: { file: new File([], "g8.pdf"), preview: null, name: "g8.pdf", size: 200 },
        },
      },
    });
    render(<DocumentsStep onBack={vi.fn()} onContinue={vi.fn()} />);

    const removeBtns = screen.getAllByText("Remove");
    expect(removeBtns.length).toBeGreaterThan(0);
  });
});
