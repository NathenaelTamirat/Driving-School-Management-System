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

export type EnrollmentProfile = {
  firstNameEn: string;
  fatherNameEn: string;
  lastNameEn: string;
  firstNameAm: string;
  fatherNameAm: string;
  lastNameAm: string;
  phone: string;
  dateOfBirthEc: string;
  bloodType: string;
  address: string;
  houseNumber: string;
  kebele: string;
  woreda: string;
  subcity: string;
  city: string;
  studentId: string;
  documentId: string;
  verified: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type EnrollmentDocumentKey = "national_id" | "education_certificate";

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

export const REQUIRED_DOCUMENTS: {
  key: EnrollmentDocumentKey;
  title: string;
  description: string;
}[] = [
  {
    key: "national_id",
    title: "National ID",
    description: "Official government issued identification",
  },
  {
    key: "education_certificate",
    title: "Educational Certificate",
    description: "Grade 10 or 12 completion certificate",
  },
];

export const EMPTY_PROFILE: EnrollmentProfile = {
  firstNameEn: "",
  fatherNameEn: "",
  lastNameEn: "",
  firstNameAm: "",
  fatherNameAm: "",
  lastNameAm: "",
  phone: "",
  dateOfBirthEc: "",
  bloodType: "",
  address: "",
  houseNumber: "",
  kebele: "",
  woreda: "",
  subcity: "",
  city: "",
  studentId: "",
  documentId: "",
  verified: false,
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
