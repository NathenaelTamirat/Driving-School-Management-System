// Zod validation schemas and constants for the Driving School Management System.
//
// This module serves two consumers:
// 1. The standalone student form (studentSchema) — used by student-form.tsx
// 2. The enrollment wizard's file-upload rules (fileSchema, docFileSchema, imageFileSchema)
//    — consumed by documents-step.tsx and file-upload.tsx
//
// UPLOAD_SLOTS defines the canonical set of documents a student must or can
// upload during enrolment. The list is referenced by both the wizard UI and
// the API layer (api.ts) so the client and backend stay in sync on document keys.

import { z } from "zod";

const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const ACCEPTED_DOC_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  "application/pdf",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Schema for the direct (non-wizard) student creation/edit form.
// Mirrors the Rails model validations in backend/app/models/student.rb.
export const studentSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less"),
  middle_name: z
    .string()
    .min(1, "Middle name is required")
    .max(50, "Middle name must be 50 characters or less"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or less"),
  date_of_birth: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  blood_type: z
    .string()
    .refine((val) => BLOOD_TYPES.includes(val as typeof BLOOD_TYPES[number]), {
      message: "Please select a valid blood type",
    }),
  address: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or less"),
  house_number: z
    .string()
    .min(1, "House number is required")
    .max(20, "House number must be 20 characters or less"),
  kebele: z
    .string()
    .max(50, "Kebele must be 50 characters or less")
    .optional()
    .or(z.literal("")),
  woreda: z
    .string()
    .min(1, "Woreda is required")
    .max(50, "Woreda must be 50 characters or less"),
  subcity: z
    .string()
    .max(50, "Subcity must be 50 characters or less")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(1, "City/Town is required")
    .max(50, "City must be 50 characters or less"),
  student_id: z
    .string()
    .min(1, "Student ID is required")
    .max(20, "Student ID must be 20 characters or less"),
  document_id: z
    .string()
    .min(1, "Document ID is required")
    .max(20, "Document ID must be 20 characters or less"),
  verified: z.boolean(),
  status: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

// Base file validation: every uploaded file must be ≤10 MB.
export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "File size must be less than 10MB",
  });

// Stricter variant for photo uploads — only image MIME types accepted.
export const imageFileSchema = fileSchema.refine(
  (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
  { message: "Only image files (JPEG, PNG, WebP, HEIC) are allowed" },
);

// Looser variant for document uploads — accepts both images and PDF.
export const docFileSchema = fileSchema.refine(
  (file) => ACCEPTED_DOC_TYPES.includes(file.type),
  { message: "Only images and PDF files are allowed" },
);

export type UploadSlot = {
  key: string;
  label: string;
  required: boolean;
  acceptImages?: boolean;
};

// Canonical list of document upload slots required or optional for enrolment.
// Each slot's `key` is used as the multipart field name sent to the backend
// and as the key in EnrollmentState.documents.
// The order here determines the render order in the documents step.
export const UPLOAD_SLOTS: UploadSlot[] = [
  { key: "profile_photo", label: "Profile Photo", required: true, acceptImages: true },
  { key: "yellow_card", label: "Yellow Card", required: true },
  { key: "grade_8", label: "8th Grade Document", required: true },
  { key: "grade_10", label: "10th Grade Document", required: true },
  { key: "grade_12", label: "12th Grade Document", required: true },
  { key: "medical", label: "Medical Document", required: false },
];

export const BLOOD_TYPE_OPTIONS = BLOOD_TYPES;
export { ACCEPTED_IMAGE_TYPES, ACCEPTED_DOC_TYPES, MAX_FILE_SIZE };
