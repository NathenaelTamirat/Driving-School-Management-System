import { describe, it, expect } from "vitest";
import {
  REGISTRATION_FEE,
  LICENSE_CATEGORIES,
  INITIAL_ENROLLMENT_STATE,
  EMPTY_PROFILE,
  getCategoryById,
  calculateEnrollmentTotal,
  formatEtb,
  ENROLLMENT_DOCUMENT_ROWS,
} from "@/lib/enrollment-types";

describe("getCategoryById", () => {
  it("returns the matching category", () => {
    const cat = getCategoryById("auto");
    expect(cat).not.toBeNull();
    expect(cat!.id).toBe("auto");
    expect(cat!.title).toBe("Auto (Automobile)");
    expect(cat!.price).toBe(26010);
  });

  it("returns null for unknown id", () => {
    expect(getCategoryById(null)).toBeNull();
  });

  it("returns all four categories", () => {
    for (const id of ["auto", "motor", "public1", "drycargo1"] as const) {
      expect(getCategoryById(id)).not.toBeNull();
    }
  });
});

describe("calculateEnrollmentTotal", () => {
  it("returns registration fee + category price for auto", () => {
    expect(calculateEnrollmentTotal("auto")).toBe(REGISTRATION_FEE + 26010);
  });

  it("returns registration fee + category price for motorcycle", () => {
    expect(calculateEnrollmentTotal("motor")).toBe(REGISTRATION_FEE + 15500);
  });

  it("returns 0 when no category selected", () => {
    expect(calculateEnrollmentTotal(null)).toBe(0);
  });
});

describe("formatEtb", () => {
  it("formats whole numbers with two decimals", () => {
    expect(formatEtb(26010)).toBe("26,010.00");
  });

  it("formats registration fee", () => {
    expect(formatEtb(REGISTRATION_FEE)).toBe("1,500.00");
  });

  it("handles zero", () => {
    expect(formatEtb(0)).toBe("0.00");
  });
});

describe("LICENSE_CATEGORIES", () => {
  it("has four categories with correct structure", () => {
    expect(LICENSE_CATEGORIES).toHaveLength(4);
    for (const cat of LICENSE_CATEGORIES) {
      expect(cat.id).toBeDefined();
      expect(cat.title).toBeDefined();
      expect(cat.price).toBeGreaterThan(0);
      expect(cat.durationDays).toBeGreaterThan(0);
      expect(cat.requirements.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = LICENSE_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("INITIAL_ENROLLMENT_STATE", () => {
  it("starts at step 1 with auto category", () => {
    expect(INITIAL_ENROLLMENT_STATE.currentStep).toBe(1);
    expect(INITIAL_ENROLLMENT_STATE.categoryId).toBe("auto");
    expect(INITIAL_ENROLLMENT_STATE.profile).toEqual(EMPTY_PROFILE);
    expect(INITIAL_ENROLLMENT_STATE.documents).toEqual({});
    expect(INITIAL_ENROLLMENT_STATE.paymentRequestSent).toBe(false);
  });
});

describe("ENROLLMENT_DOCUMENT_ROWS", () => {
  it("has at least 6 document rows", () => {
    expect(ENROLLMENT_DOCUMENT_ROWS.length).toBeGreaterThanOrEqual(6);
  });

  it("profile_photo and yellow_card rows are present", () => {
    const keys = ENROLLMENT_DOCUMENT_ROWS.map((r) => r.key);
    expect(keys).toContain("profile_photo");
    expect(keys).toContain("yellow_card");
  });

  it("yellow_card and medical are optional", () => {
    const yellowCard = ENROLLMENT_DOCUMENT_ROWS.find((r) => r.key === "yellow_card");
    expect(yellowCard?.required).toBe(false);

    const medical = ENROLLMENT_DOCUMENT_ROWS.find((r) => r.key === "medical");
    expect(medical?.required).toBe(false);
  });

  it("profile_photo, grade docs are required", () => {
    const photo = ENROLLMENT_DOCUMENT_ROWS.find((r) => r.key === "profile_photo");
    expect(photo?.required).toBe(true);

    const g8 = ENROLLMENT_DOCUMENT_ROWS.find((r) => r.key === "grade_8");
    expect(g8?.required).toBe(true);
  });
});
