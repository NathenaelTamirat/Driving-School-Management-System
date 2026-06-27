import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { EnrollmentProvider, useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  INITIAL_ENROLLMENT_STATE,
  ENROLLMENT_DRAFT_KEY,
  EMPTY_PROFILE,
} from "@/lib/enrollment-types";

beforeEach(() => {
  localStorage.clear();
});

function renderWithProvider(ui: React.ReactElement) {
  return render(<EnrollmentProvider>{ui}</EnrollmentProvider>);
}

describe("EnrollmentProvider", () => {
  it("provides initial state", () => {
    let state: unknown = null;
    function Consumer() {
      const { state: s, draftLoaded } = useEnrollment();
      state = s;
      return <span data-testid="loaded">{String(draftLoaded)}</span>;
    }
    renderWithProvider(<Consumer />);

    expect(state).toEqual(INITIAL_ENROLLMENT_STATE);
  });

  it("updateProfile merges partial profile", () => {
    function Consumer() {
      const { state, updateProfile } = useEnrollment();
      return (
        <div>
          <span data-testid="name">{state.profile.firstNameEn}</span>
          <button onClick={() => updateProfile({ firstNameEn: "Abebe" })}>Update</button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Update").click();
    });

    expect(screen.getByTestId("name").textContent).toBe("Abebe");
  });

  it("setCategory updates the category id", () => {
    function Consumer() {
      const { state, setCategory } = useEnrollment();
      return (
        <div>
          <span data-testid="cat">{state.categoryId}</span>
          <button onClick={() => setCategory("motor")}>Set Motor</button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Set Motor").click();
    });

    expect(screen.getByTestId("cat").textContent).toBe("motor");
  });

  it("setStep updates current step", () => {
    function Consumer() {
      const { state, setStep } = useEnrollment();
      return (
        <div>
          <span data-testid="step">{state.currentStep}</span>
          <button onClick={() => setStep(3)}>Go to Step 3</button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Go to Step 3").click();
    });

    expect(screen.getByTestId("step").textContent).toBe("3");
  });

  it("setDocument adds a document", () => {
    function Consumer() {
      const { state, setDocument } = useEnrollment();
      return (
        <div>
          <span data-testid="docs">{Object.keys(state.documents).length}</span>
          <button
            onClick={() =>
              setDocument("profile_photo", {
                file: new File([], "photo.jpg"),
                preview: null,
                name: "photo.jpg",
                size: 1024,
              })
            }
          >
            Add Doc
          </button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Add Doc").click();
    });

    expect(screen.getByTestId("docs").textContent).toBe("1");
  });

  it("setDocument removes a document when null", () => {
    function Consumer() {
      const { state, setDocument } = useEnrollment();
      return (
        <div>
          <span data-testid="docs">{Object.keys(state.documents).length}</span>
          <button onClick={() => setDocument("profile_photo", null)}>Remove Doc</button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Remove Doc").click();
    });

    expect(screen.getByTestId("docs").textContent).toBe("0");
  });

  it("saveDraft persists to localStorage", () => {
    function Consumer() {
      const { saveDraft, updateProfile } = useEnrollment();
      return (
        <div>
          <button onClick={() => updateProfile({ firstNameEn: "Abebe" })}>Set Name</button>
          <button onClick={saveDraft}>Save</button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Set Name").click();
    });

    act(() => {
      screen.getByText("Save").click();
    });

    const raw = localStorage.getItem(ENROLLMENT_DRAFT_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.profile.firstNameEn).toBe("Abebe");
  });

  it("loadDraft restores state from localStorage", () => {
    const draft = {
      ...INITIAL_ENROLLMENT_STATE,
      profile: { ...EMPTY_PROFILE, firstNameEn: "Restored" },
    };
    localStorage.setItem(ENROLLMENT_DRAFT_KEY, JSON.stringify(draft));

    function Consumer() {
      const { state, draftLoaded } = useEnrollment();
      return (
        <div>
          <span data-testid="loaded">{String(draftLoaded)}</span>
          <span data-testid="name">{state.profile.firstNameEn}</span>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    expect(screen.getByTestId("name").textContent).toBe("Restored");
  });

  it("resetEnrollment clears state and draft", () => {
    function Consumer() {
      const { state, resetEnrollment, updateProfile } = useEnrollment();
      return (
        <div>
          <span data-testid="name">{state.profile.firstNameEn}</span>
          <button onClick={() => updateProfile({ firstNameEn: "Temp" })}>Set Temp</button>
          <button onClick={resetEnrollment}>Reset</button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Set Temp").click();
    });

    act(() => {
      screen.getByText("Reset").click();
    });

    expect(screen.getByTestId("name").textContent).toBe("");
    expect(localStorage.getItem(ENROLLMENT_DRAFT_KEY)).toBeNull();
  });

  it("setPaymentPhone updates payment phone", () => {
    function Consumer() {
      const { state, setPaymentPhone } = useEnrollment();
      return (
        <div>
          <span data-testid="phone">{state.paymentPhone}</span>
          <button onClick={() => setPaymentPhone("+251 911 234 567")}>Set Phone</button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Set Phone").click();
    });

    expect(screen.getByTestId("phone").textContent).toBe("+251 911 234 567");
  });

  it("setPaymentRequestSent updates flag", () => {
    function Consumer() {
      const { state, setPaymentRequestSent } = useEnrollment();
      return (
        <div>
          <span data-testid="sent">{String(state.paymentRequestSent)}</span>
          <button onClick={() => setPaymentRequestSent(true)}>Send</button>
        </div>
      );
    }
    renderWithProvider(<Consumer />);

    act(() => {
      screen.getByText("Send").click();
    });

    expect(screen.getByTestId("sent").textContent).toBe("true");
  });
});

describe("useEnrollment", () => {
  it("throws when used outside EnrollmentProvider", () => {
    function BadComponent() {
      useEnrollment();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      "useEnrollment must be used within EnrollmentProvider",
    );
  });
});
