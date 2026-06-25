type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[] | Record<string, string[]>;
};

import type { EnrollmentState } from "@/lib/enrollment-types";
import { UPLOAD_SLOTS } from "@/lib/validations";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const DEFAULT_BATCH_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_BATCH_ID || "1");

export async function createStudent(
  payload: Record<string, unknown> | FormData,
): Promise<ApiResponse> {
  try {
    const isFormData = payload instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/api/v1/students`, {
      method: "POST",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData
        ? payload
        : JSON.stringify({ student: payload }),
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: json.error || "Failed to create student",
        errors: json.errors,
      };
    }

    return { success: true, data: json };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Network error. Please check your connection.",
    };
  }
}

function generateId(prefix: string, phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-6).padStart(6, "0");
  const stamp = Date.now().toString().slice(-4);
  return `${prefix}${digits}${stamp}`;
}

export function mapEnrollmentToStudentPayload(state: EnrollmentState) {
  const { profile } = state;
  const phoneDigits = profile.phone.replace(/\D/g, "");

  return {
    batch_id: DEFAULT_BATCH_ID,
    student_id: generateId("STU", phoneDigits),
    document_id: generateId("DOC", phoneDigits),
    first_name: profile.firstNameEn.trim(),
    middle_name: profile.fatherNameEn.trim(),
    last_name: profile.lastNameEn.trim(),
    date_of_birth: profile.dateOfBirthEc,
    blood_type: profile.bloodType,
    address: profile.address.trim(),
    house_number: profile.houseNumber.trim(),
    woreda: profile.woreda.trim(),
    city: profile.city.trim(),
    kebele: profile.kebele.trim(),
    subcity: profile.subcity.trim(),
    verified: false,
  };
}

export function buildEnrollmentFormData(state: EnrollmentState): FormData {
  const formData = new FormData();
  const payload = mapEnrollmentToStudentPayload(state);

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(`student[${key}]`, String(value));
  });

  UPLOAD_SLOTS.forEach(({ key }) => {
    const doc = state.documents[key];
    if (doc?.file) {
      formData.append(`student[${key}]`, doc.file);
    }
  });

  return formData;
}

export async function createStudentFromEnrollment(
  state: EnrollmentState,
): Promise<ApiResponse> {
  const hasUploads = UPLOAD_SLOTS.some((slot) => state.documents[slot.key]?.file);
  const payload = hasUploads
    ? buildEnrollmentFormData(state)
    : mapEnrollmentToStudentPayload(state);
  return createStudent(payload);
}
