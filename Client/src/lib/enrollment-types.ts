// Type definitions and constants for the multi-step student enrollment wizard.
//
// This module is the single source of truth for:
// 1. License categories offered by the school (LICENSE_CATEGORIES)
// 2. The shape of wizard state (EnrollmentState)
// 3. Document upload slots and their metadata (ENROLLMENT_DOCUMENT_ROWS)
// 4. Pricing constants (REGISTRATION_FEE, per-category prices)
// 5. Local-storage draft persistence key (ENROLLMENT_DRAFT_KEY)
//
// The enrollment pipeline is decoupled from the API layer: this module only
// defines *what* the wizard collects; src/lib/api.ts handles *how* it's sent.

import type { UploadSlot } from "@/lib/validations";
import { UPLOAD_SLOTS } from "@/lib/validations";

// Four license categories match the Ethiopian driving licence tiers offered
// by the school: private auto (B), motorcycle (A), public-transport minibus
// (C1), and dry-cargo truck (C). Each entry drives the pricing card UI on
// the category-selection step as well as the fee calculation in
// calculateEnrollmentTotal().
export type LicenseCategoryId = "auto" | "motor" | "public1" | "drycargo1";

export type LicenseCategory = {
  id: LicenseCategoryId;
  title: string;
  subtitle: string;
  price: number;
  durationDays: number;
  icon: "car" | "motorcycle" | "bus" | "truck";
  requirements: {
    text: string;
    icon: "graduation" | "medical" | "clock" | "license";
  }[];
};

// Personal information collected on the first step of the wizard.
// All fields map 1:1 to columns on the backend Student model except
// emergency contact fields (stored separately or logged for reference).
export type EnrollmentProfile = {
  firstNameEn: string;
  fatherNameEn: string;
  lastNameEn: string;
  phone: string;
  dateOfBirthEc: string;
  bloodType: string;
  address: string;
  houseNumber: string;
  kebele: string;
  woreda: string;
  subcity: string;
  city: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type EnrollmentDocumentKey = UploadSlot["key"];

export type UploadedDocument = {
  file: File;
  preview: string | null;
  name: string;
  size: number;
};

// Complete snapshot of the wizard at any point in time.
// Persisted to localStorage under ENROLLMENT_DRAFT_KEY so users can
// resume a partially-filled enrolment without data loss.
export type EnrollmentState = {
  profile: EnrollmentProfile;
  categoryId: LicenseCategoryId | null;
  documents: Partial<Record<EnrollmentDocumentKey, UploadedDocument>>;
  paymentPhone: string;
  paymentRequestSent: boolean;
  currentStep: number;
};

export const ENROLLMENT_DRAFT_KEY = "dsas-enrollment-draft";

export const REGISTRATION_FEE = 1500;

export const LICENSE_CATEGORIES: LicenseCategory[] = [
  {
    id: "auto",
    title: "Auto (Automobile)",
    subtitle: "Category B - Private Manual",
    price: 26010,
    durationDays: 45,
    icon: "car",
    requirements: [
      { text: "Minimum 4th Grade", icon: "graduation" },
      { text: "Medical Certificate Required", icon: "medical" },
      { text: "45 Days Duration", icon: "clock" },
    ],
  },
  {
    id: "motor",
    title: "Motorcycle",
    subtitle: "Category A",
    price: 15500,
    durationDays: 30,
    icon: "motorcycle",
    requirements: [
      { text: "Minimum 4th Grade", icon: "graduation" },
      { text: "Medical Certificate Required", icon: "medical" },
      { text: "30 Days Duration", icon: "clock" },
    ],
  },
  {
    id: "public1",
    title: "Public-1 (Minibus)",
    subtitle: "Category C1",
    price: 32450,
    durationDays: 60,
    icon: "bus",
    requirements: [
      { text: "Valid Auto License Req.", icon: "license" },
      { text: "Minimum 8th Grade", icon: "graduation" },
      { text: "60 Days Duration", icon: "clock" },
    ],
  },
  {
    id: "drycargo1",
    title: "Dry Cargo-1 (Truck)",
    subtitle: "Category C",
    price: 38000,
    durationDays: 60,
    icon: "truck",
    requirements: [
      { text: "Valid Auto License Req.", icon: "license" },
      { text: "Minimum 8th Grade", icon: "graduation" },
      { text: "60 Days Duration", icon: "clock" },
    ],
  },
];

export type EnrollmentDocumentRow = {
  key: EnrollmentDocumentKey;
  label: string;
  description: string;
  required: boolean;
  acceptImages?: boolean;
};

// Human-readable descriptions for each upload slot, driven by the
// UPLOAD_SLOTS array from src/lib/validations.ts but augmented with
// context-specific explanations for the enrollment document step.
const UPLOAD_SLOT_DESCRIPTIONS: Record<UploadSlot["key"], string> = {
  profile_photo: "Recent passport-size photo of the student",
  yellow_card: "Valid yellow health card document (optional)",
  grade_8: "8th grade completion certificate",
  grade_10: "10th grade completion certificate",
  grade_12: "12th grade completion certificate",
  medical: "Medical fitness certificate (optional)",
};

const OPTIONAL_UPLOAD_KEYS = new Set<UploadSlot["key"]>(["yellow_card", "medical"]);

export const ENROLLMENT_DOCUMENT_ROWS: EnrollmentDocumentRow[] = UPLOAD_SLOTS.map(
  (slot) => ({
    key: slot.key as EnrollmentDocumentKey,
    label: slot.label,
    description: UPLOAD_SLOT_DESCRIPTIONS[slot.key as UploadSlot["key"]],
    required: OPTIONAL_UPLOAD_KEYS.has(slot.key as UploadSlot["key"])
      ? false
      : slot.required,
    acceptImages: slot.acceptImages,
  }),
);

export const EMPTY_PROFILE: EnrollmentProfile = {
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
};

export const INITIAL_ENROLLMENT_STATE: EnrollmentState = {
  profile: EMPTY_PROFILE,
  categoryId: "auto",
  documents: {},
  paymentPhone: "",
  paymentRequestSent: false,
  currentStep: 1,
};

export function getCategoryById(id: LicenseCategoryId | null) {
  return LICENSE_CATEGORIES.find((c) => c.id === id) ?? null;
}

// Total fee = one-time registration fee + category-specific tuition.
export function calculateEnrollmentTotal(categoryId: LicenseCategoryId | null) {
  const category = getCategoryById(categoryId);
  if (!category) return 0;
  return REGISTRATION_FEE + category.price;
}

// Formats a numeric amount as Ethiopian Birr (ETB) using en-US locale
// with exactly two decimal places (e.g. "26,010.00").
export function formatEtb(amount: number) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
