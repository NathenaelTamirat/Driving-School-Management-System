import { describe, it, expect } from "vitest";
import {
  studentSchema,
  fileSchema,
  imageFileSchema,
  docFileSchema,
  UPLOAD_SLOTS,
  BLOOD_TYPE_OPTIONS,
} from "@/lib/validations";

function makeFile(name: string, type: string, size = 1024): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

describe("studentSchema", () => {
  const validData = {
    first_name: "Abebe",
    middle_name: "Kebede",
    last_name: "Tadesse",
    date_of_birth: "1998-05-15",
    blood_type: "O+",
    address: "123 Main St",
    house_number: "H-001",
    kebele: "01",
    woreda: "02",
    subcity: "Bole",
    city: "Addis Ababa",
    student_id: "STU001",
    document_id: "DOC001",
    verified: false,
  };

  it("accepts valid data", () => {
    const result = studentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects missing first_name", () => {
    const result = studentSchema.safeParse({ ...validData, first_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid blood_type", () => {
    const result = studentSchema.safeParse({ ...validData, blood_type: "Z+" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = studentSchema.safeParse({ ...validData, date_of_birth: "15-05-1998" });
    expect(result.success).toBe(false);
  });

  it("allows optional kebele and subcity", () => {
    const result = studentSchema.safeParse({ ...validData, kebele: "", subcity: "" });
    expect(result.success).toBe(true);
  });

  it("rejects first_name over 50 chars", () => {
    const result = studentSchema.safeParse({ ...validData, first_name: "A".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejects empty address", () => {
    const result = studentSchema.safeParse({ ...validData, address: "" });
    expect(result.success).toBe(false);
  });
});

describe("fileSchema", () => {
  it("accepts a file under 10MB", () => {
    const file = makeFile("doc.pdf", "application/pdf", 5 * 1024 * 1024);
    expect(fileSchema.safeParse(file).success).toBe(true);
  });

  it("rejects a file over 10MB", () => {
    const file = makeFile("large.pdf", "application/pdf", 11 * 1024 * 1024);
    expect(fileSchema.safeParse(file).success).toBe(false);
  });
});

describe("imageFileSchema", () => {
  it("accepts JPEG images", () => {
    const file = makeFile("photo.jpg", "image/jpeg");
    expect(imageFileSchema.safeParse(file).success).toBe(true);
  });

  it("rejects PDF for image-only slots", () => {
    const file = makeFile("doc.pdf", "application/pdf");
    expect(imageFileSchema.safeParse(file).success).toBe(false);
  });
});

describe("docFileSchema", () => {
  it("accepts PDF documents", () => {
    const file = makeFile("doc.pdf", "application/pdf");
    expect(docFileSchema.safeParse(file).success).toBe(true);
  });

  it("accepts JPEG images", () => {
    const file = makeFile("img.jpg", "image/jpeg");
    expect(docFileSchema.safeParse(file).success).toBe(true);
  });

  it("rejects unsupported file types", () => {
    const file = makeFile("doc.txt", "text/plain");
    expect(docFileSchema.safeParse(file).success).toBe(false);
  });
});

describe("UPLOAD_SLOTS", () => {
  it("contains all required document slots", () => {
    const keys = UPLOAD_SLOTS.map((s) => s.key);
    expect(keys).toContain("profile_photo");
    expect(keys).toContain("grade_8");
    expect(keys).toContain("grade_10");
    expect(keys).toContain("grade_12");
  });

  it("profile_photo accepts images only", () => {
    const photo = UPLOAD_SLOTS.find((s) => s.key === "profile_photo");
    expect(photo?.acceptImages).toBe(true);
  });
});

describe("BLOOD_TYPE_OPTIONS", () => {
  it("contains all 8 blood types", () => {
    expect(BLOOD_TYPE_OPTIONS).toEqual(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
  });
});
