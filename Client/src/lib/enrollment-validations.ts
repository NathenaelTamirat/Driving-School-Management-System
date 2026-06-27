// Zod validation schemas for the multi-step enrollment wizard.
//
// Each step has its own schema (profile, category, documents, payment)
// so react-hook-form can validate incrementally. A combined schema
// (enrollmentFormSchema) validates the full EnrollmentFormData for
// final submission.
//
// Field names are camelCase, matching EnrollmentFormData in
// enrollment-types.ts. The API layer (mapEnrollmentFormDataToPayload)
// converts them to snake_case for the Rails backend.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Step 1 — Profile
// ---------------------------------------------------------------------------
export const profileStepSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z
    .string()
    .min(9, "Enter a valid phone number (at least 9 digits)")
    .regex(/^\d+$/, "Phone number must contain digits only"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  address: z.string().min(1, "Address is required").max(200),
});

export type ProfileStepValues = z.infer<typeof profileStepSchema>;

// ---------------------------------------------------------------------------
// Step 2 — Category
// ---------------------------------------------------------------------------
export const categoryStepSchema = z.object({
  licenseCategory: z.string().min(1, "Please select a license category"),
});

export type CategoryStepValues = z.infer<typeof categoryStepSchema>;

// ---------------------------------------------------------------------------
// Step 3 — Documents
// ---------------------------------------------------------------------------
export const documentsStepSchema = z.object({
  documents: z.array(z.instanceof(File)).min(1, "At least one document is required"),
});

export type DocumentsStepValues = z.infer<typeof documentsStepSchema>;

// ---------------------------------------------------------------------------
// Step 4 — Payment
// ---------------------------------------------------------------------------
export const paymentStepSchema = z.object({
  paymentMethod: z.enum(["cash", "bank_transfer", "other"], {
    error: "Please select a payment method",
  }),
  paymentNotes: z.string().max(500, "Notes must be 500 characters or less").optional().or(z.literal("")),
});

export type PaymentStepValues = z.infer<typeof paymentStepSchema>;

// ---------------------------------------------------------------------------
// Combined — full form
// ---------------------------------------------------------------------------
export const enrollmentFormSchema = z.object({
  firstName: profileStepSchema.shape.firstName,
  lastName: profileStepSchema.shape.lastName,
  email: profileStepSchema.shape.email,
  phone: profileStepSchema.shape.phone,
  dateOfBirth: profileStepSchema.shape.dateOfBirth,
  address: profileStepSchema.shape.address,
  licenseCategory: categoryStepSchema.shape.licenseCategory,
  documents: documentsStepSchema.shape.documents,
  paymentMethod: paymentStepSchema.shape.paymentMethod,
  paymentNotes: paymentStepSchema.shape.paymentNotes,
});

export type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;
