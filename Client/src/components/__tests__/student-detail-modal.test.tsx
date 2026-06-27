import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentDetailModal } from "@/components/student-detail-modal";

const mockStudent = {
  id: 1,
  batch_id: 1,
  student_id: "STU001",
  document_id: "DOC001",
  first_name: "Abebe",
  middle_name: "Kebede",
  last_name: "Tadesse",
  date_of_birth: "1998-05-15",
  blood_type: "O+",
  address: "123 Main St",
  house_number: "H001",
  kebele: "01",
  woreda: "02",
  subcity: "Bole",
  city: "Addis Ababa",
  status: "registered",
  verified: false,
  verified_at: null,
  theory_days_completed: 5,
  practical_days_completed: 3,
  mock_test_score: 70,
  under_penalty: false,
  penalty_start_date: null,
  penalty_end_date: null,
  penalty_reason: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/api", () => ({
  updateStudent: vi.fn().mockResolvedValue({ success: true }),
}));

describe("StudentDetailModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <StudentDetailModal student={mockStudent} open={false} onClose={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders student details when open", () => {
    render(
      <StudentDetailModal student={mockStudent} open={true} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Abebe Kebede Tadesse")).toBeDefined();
    expect(screen.getByText("Student ID: STU001")).toBeDefined();
    expect(screen.getByText("Student Details")).toBeDefined();
  });

  it("shows Verify Student button for unverified students", () => {
    render(
      <StudentDetailModal student={mockStudent} open={true} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Verify Student")).toBeDefined();
    expect(screen.getByText("Unverified")).toBeDefined();
  });

  it("does not show Verify Student for verified students", () => {
    render(
      <StudentDetailModal
        student={{ ...mockStudent, verified: true }}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("Verify Student")).toBeNull();
    expect(screen.getByText("Verified")).toBeDefined();
  });

  it("shows penalty banner when under penalty", () => {
    render(
      <StudentDetailModal
        student={{
          ...mockStudent,
          under_penalty: true,
          penalty_end_date: "2025-06-01T00:00:00Z",
        }}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Under penalty/)).toBeDefined();
  });

  it("renders Close button", () => {
    render(
      <StudentDetailModal student={mockStudent} open={true} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Close")).toBeDefined();
  });

  it("renders training stats", () => {
    render(
      <StudentDetailModal student={mockStudent} open={true} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Theory Days")).toBeDefined();
    expect(screen.getByText("Mock Test")).toBeDefined();
    expect(screen.getByText("Practical Days")).toBeDefined();
  });
});
