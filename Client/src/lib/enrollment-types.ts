import type { UploadSlot } from "@/lib/validations";
import { UPLOAD_SLOTS } from "@/lib/validations";
import { getCourseCategories, type CourseCategory } from "@/lib/api";

// Simplified form data shape for the multi-step enrollment wizard.
// Uses generic field names (firstName, lastName, email, etc.) that map
// to the backend's student_params. Coexists alongside the existing
// EnrollmentProfile / EnrollmentState types for backward compatibility.
export type EnrollmentFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  licenseCategory: string;
  documents: File[];
  paymentMethod: "cash" | "bank_transfer" | "other";
  paymentNotes?: string;
};

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

// Hardcoded defaults: used as fallback when the backend API is unreachable.
// The single source of truth is backend/config/course_categories.yml served
// via GET /api/v1/course_categories. Call loadLicenseCategories() at app
// startup to override these with live data.
const HARDCODED_CATEGORIES: LicenseCategory[] = [
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

// Runtime categories — initialized from HARDCODED_CATEGORIES but can be
// overridden via loadLicenseCategories(). All consumers reference this
// variable so pricing stays in sync after the API fetch completes.
let LICENSE_CATEGORIES: LicenseCategory[] = [...HARDCODED_CATEGORIES];

// Icon mapping for the four category types.
const CATEGORY_ICON_MAP: Record<string, LicenseCategory["icon"]> = {
  auto: "car",
  motor: "motorcycle",
  public1: "bus",
  drycargo1: "truck",
};

// Maps a backend CourseCategory to the frontend LicenseCategory shape.
function mapCourseCategory(cc: CourseCategory): LicenseCategory | null {
  const id = cc.id as LicenseCategoryId;
  if (!CATEGORY_ICON_MAP[id]) return null;
  const idMap: Record<string, LicenseCategoryId> = {
    auto: "auto",
    motor: "motor",
    public1: "public1",
    drycargo1: "drycargo1",
  };
  const mappedId = idMap[id];
  if (!mappedId) return null;

  const iconMap: Record<string, LicenseCategory["icon"]> = {
    car: "car",
    motorcycle: "motorcycle",
    bus: "bus",
    truck: "truck",
  };
  const icon = CATEGORY_ICON_MAP[id];
  if (!icon) return null;

  const iconRequirementMap: Record<string, LicenseCategory["requirements"][0]["icon"]> = {
    graduation: "graduation",
    medical: "medical",
    clock: "clock",
    license: "license",
  };

  return {
    id: mappedId,
    title: cc.title,
    subtitle: cc.subtitle,
    price: cc.price,
    durationDays: cc.duration_days,
    icon,
    requirements: (cc.requirements || []).map((r) => ({
      text: r.text,
      icon: iconRequirementMap[r.icon] || "graduation",
    })),
  };
}

// Fetches course categories from the backend and replaces the runtime
// LICENSE_CATEGORIES array. Returns true on success, false if the API
// call failed (fallback to hardcoded data). Call this once at app startup.
export async function loadLicenseCategories(): Promise<boolean> {
  try {
    const result = await getCourseCategories();
    if (!result.success || !result.data) return false;

    const raw = Array.isArray(result.data) ? result.data : (result.data as { data?: unknown })?.data || [];
    const mapped = (raw as CourseCategory[])
      .map(mapCourseCategory)
      .filter((c): c is LicenseCategory => c !== null);

    if (mapped.length > 0) {
      LICENSE_CATEGORIES = mapped;
    }
    return true;
  } catch {
    return false;
  }
}

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

export { LICENSE_CATEGORIES };

export type EnrollmentDocumentRow = {
  key: EnrollmentDocumentKey;
  label: string;
  description: string;
  required: boolean;
  acceptImages?: boolean;
};

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

export function calculateEnrollmentTotal(categoryId: LicenseCategoryId | null) {
  const category = getCategoryById(categoryId);
  if (!category) return 0;
  return REGISTRATION_FEE + category.price;
}

export function formatEtb(amount: number) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
