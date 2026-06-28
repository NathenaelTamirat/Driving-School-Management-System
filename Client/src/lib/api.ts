// API client layer for the Driving School Management System.
// Communicates with the Rails backend at NEXT_PUBLIC_API_URL (default localhost:3001).
//
// Key responsibilities:
// 1. Student CRUD (createStudent, updateStudent, getStudents, getStudent)
// 2. Batch listing (getBatches)
// 3. Multi-step enrollment pipeline (mapEnrollmentToStudentPayload,
//    buildEnrollmentFormData, createStudentFromEnrollment)
//
// All endpoints now require a valid JWT. The token is stored in localStorage
// after a successful login (POST /api/v1/auth/login) and sent as the
// Authorization header on every request.

const TOKEN_KEY = "driving_school_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Returns headers common to every API call, including auth if a token exists. */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[] | Record<string, string[]>;
};

import type { EnrollmentState, EnrollmentFormData } from "@/lib/enrollment-types";
import { UPLOAD_SLOTS } from "@/lib/validations";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const DEFAULT_BATCH_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_BATCH_ID || "1");

/** Generic fetch wrapper that auto-attaches the JWT and normalises the response. */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(options?.headers as Record<string, string>), ...options?.headers },
    });
    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: json.error || "Request failed",
        errors: json.errors,
      };
    }
    return { success: true, data: json as T };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// Generic POST /api/v1/students.
// Accepts both plain objects (JSON-encoded) and FormData (file uploads).
// Returns a normalised ApiResponse envelope so callers always handle
// success/failure uniformly regardless of the HTTP status code.
export async function createStudent(
  payload: Record<string, unknown> | FormData,
): Promise<ApiResponse> {
  try {
    const isFormData = payload instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/api/v1/students`, {
      method: "POST",
      headers: isFormData ? authHeaders() : authHeaders({ "Content-Type": "application/json" }),
      body: isFormData
        ? payload
        : JSON.stringify({ student: payload }),
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: json.error?.message || json.error || "Failed to create student",
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

// Generates a short, human-readable ID of the form <prefix><6-phone-digits><4-timestamp>.
// The phone suffix comes from the last 6 non-digit characters of the phone number
// (guaranteeing uniqueness across students from different contacts) and the 4-digit
// timestamp suffix provides millisecond-level disambiguation.
function generateId(prefix: string, phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-6).padStart(6, "0");
  const stamp = Date.now().toString().slice(-4);
  return `${prefix}${digits}${stamp}`;
}

// Transforms the wizard's EnrollmentState into the flat payload expected by
// the Rails backend's Student model. Generated IDs (student_id, document_id)
// are deterministic from the student's phone and the current timestamp.
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

// Builds a multipart/form-data request from the wizard state.
// String fields are appended as `student[key]=value` and file uploads
// from UPLOAD_SLOTS are appended as `student[key]=File` so ActiveStorage
// / multipart middleware can handle them transparently.
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

// High-level enrollment submission: picks JSON vs multipart automatically.
// Returns the same ApiResponse shape as createStudent.
export async function createStudentFromEnrollment(
  state: EnrollmentState,
): Promise<ApiResponse> {
  const hasUploads = UPLOAD_SLOTS.some((slot) => state.documents[slot.key]?.file);
  const payload = hasUploads
    ? buildEnrollmentFormData(state)
    : mapEnrollmentToStudentPayload(state);
  return createStudent(payload);
}

// ---------------------------------------------------------------------------
// New simplified EnrollmentFormData pipeline
// ---------------------------------------------------------------------------

// Maps the simplified EnrollmentFormData into the flat payload the backend
// expects.  Extra fields (email, phone, license_category, payment_method)
// are included so the backend can permit them later.
export function mapEnrollmentFormDataToPayload(data: EnrollmentFormData) {
  return {
    batch_id: DEFAULT_BATCH_ID,
    student_id: generateId("STU", data.phone),
    document_id: generateId("DOC", data.phone),
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    date_of_birth: data.dateOfBirth,
    address: data.address.trim(),
    // Extra fields — the backend may permit these in future
    email: data.email.trim(),
    phone: data.phone.trim(),
    license_category: data.licenseCategory,
    payment_method: data.paymentMethod,
    payment_notes: data.paymentNotes?.trim() ?? "",
  };
}

// Builds a multipart/form-data request from the simplified form data.
// String fields are appended as `student[key]=value` and files are
// appended as `student[profile_photo]`, `student[yellow_card]`, etc.
// so the Rails backend can pick them up via params[:student][...].
export function buildFormDataFromEnrollmentFormData(
  data: EnrollmentFormData,
): FormData {
  const formData = new FormData();
  const payload = mapEnrollmentFormDataToPayload(data);

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(`student[${key}]`, String(value));
  });

  // Attach each uploaded file to its respective slot
  // (backend expects keys like profile_photo, yellow_card, etc.)
  data.documents.forEach((file, index) => {
    formData.append(`student[document_${index}]`, file);
  });

  return formData;
}

// POST the simplified EnrollmentFormData to /api/v1/students.
export async function submitEnrollmentFormData(
  data: EnrollmentFormData,
): Promise<ApiResponse> {
  const formData = buildFormDataFromEnrollmentFormData(data);
  return createStudent(formData);
}

// GET /api/v1/students — returns the full student list.
export async function getStudents(): Promise<ApiResponse<Student[]>> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    const url = `${API_BASE_URL}/api/v1/students${qs ? `?${qs}` : ""}`;
    const response = await fetch(url, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch students" };
    return { success: true, data: json.data ?? json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/students/:id — returns a single student record.
export async function getStudent(id: number): Promise<ApiResponse<Student>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${id}`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error?.message || json.error || "Student not found" };
    return { success: true, data: json.data ?? json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/batches — returns all enrolment batches (used for dropdowns / filtering).
export async function getBatches(): Promise<ApiResponse<Batch[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/batches`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error?.message || json.error || "Failed to fetch batches" };
    return { success: true, data: json.data?.batches ?? json.data ?? json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  phone_number: string | null;
  is_qualified_instructor: boolean;
  created_at: string;
};

export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<{ user: User; token: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth: { email, password } }),
    });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error?.message || json.error || "Login failed" };
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function register(
  data: {
    email: string;
    password: string;
    password_confirmation: string;
    full_name: string;
    phone_number?: string;
  },
): Promise<ApiResponse<{ user: User; token: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth: data }),
    });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error?.message || json.error || "Registration failed", errors: json.errors };
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function logout(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error?.message || json.error || "Logout failed" };
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function getMe(): Promise<ApiResponse<{ user: User }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error?.message || json.error || "Not authenticated" };
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/course_categories — returns enrollment course categories/pricing.
export async function getCourseCategories(): Promise<ApiResponse<CourseCategory[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/course_categories`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch course categories" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// PATCH /api/v1/students/:id — updates a student's fields.
export async function updateStudent(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${id}`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ student: data }),
    });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error?.message || json.error || "Failed to update student", errors: json.errors };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// POST /api/v1/auth/refresh — issues a new token with a fresh 1-hour expiry.
// Call this before the current token expires to keep the session alive.
export async function refreshToken(): Promise<ApiResponse<{ user: User; token: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: authHeaders(),
    });
    const json = await response.json();
    if (!response.ok) {
      clearToken();
      return { success: false, error: json.error || "Token refresh failed" };
    }
    if (json.data?.token) setToken(json.data.token);
    return { success: true, data: json.data };
  } catch (err) {
    clearToken();
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// Decodes the payload of a JWT without verifying the signature.
// Returns null if the token is malformed.
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

/** Returns the number of seconds until the JWT expires, or 0 if unreadable. */
export function getJwtExpiresIn(token: string): number {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}

// GET /api/v1/students/by_user/:user_id — returns a student record by associated user ID.
export async function getStudentByUserId(userId: number): Promise<ApiResponse<Student>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/by_user/${userId}`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Student not found" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/invoices — returns all invoices.
export async function getInvoices(): Promise<ApiResponse<Invoice[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch invoices" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/users — returns all system users (admin only).
export async function getUsers(): Promise<ApiResponse<User[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch users" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "instructor" | "clerk" | "student";
  phone_number: string | null;
  is_qualified_instructor: boolean;
  created_at: string;
};

// Type shape returned by the backend Student index/show endpoints.
// Mirrors the Rails model attributes from backend/app/models/student.rb.
export type Student = {
  id: number;
  batch_id: number;
  student_id: string;
  document_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  blood_type: string;
  address: string;
  house_number: string;
  kebele: string | null;
  woreda: string;
  subcity: string | null;
  city: string;
  status: string;
  verified: boolean;
  verified_at: string | null;
  license_category: string | null;
  theory_days_completed: number;
  practical_days_completed: number;
  mock_test_score: number;
  under_penalty: boolean;
  penalty_start_date: string | null;
  penalty_end_date: string | null;
  penalty_reason: string | null;
  created_at: string;
  updated_at: string;
};

// GET /api/v1/exam_bookings — returns all exam bookings.
export async function getExamBookings(): Promise<ApiResponse<ExamBooking[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/exam_bookings`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch exam bookings" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// Type shape returned by the backend ExamBooking endpoints.
export type ExamBooking = {
  id: number;
  student_id: number;
  exam_type: string;
  scheduled_date: string;
  status: string;
  score: number | null;
  notes: string | null;
  created_at: string;
};

// Type shape returned by the backend Invoice endpoints.
export type Invoice = {
  id: number;
  student_id: number;
  amount: number;
  milestone_type: string;
  status: string;
  paid_at: string | null;
  due_date: string | null;
  description: string | null;
  created_at: string;
};

export type StudentInvoice = Invoice & {
  invoice_number: string;
  student_name: string;
  invoice_type: string;
};

// Type shape for the lightweight Batch model used in selector dropdowns.
export type Batch = {
  id: number;
  name: string;
  status: string;
};

// GET /api/v1/students/:id/attendance_logs
export async function getAttendanceLogs(studentId: number): Promise<ApiResponse<AttendanceLog[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/attendance_logs`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to fetch attendance logs" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// POST /api/v1/students/:id/attendance_logs
export async function createAttendanceLog(studentId: number, data: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/attendance_logs`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ attendance_log: data }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to log attendance", errors: json.errors };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type AttendanceLog = {
  id: number;
  student_id: number;
  phase: string;
  attendance_date: string;
  present: boolean;
  instructor_name: string | null;
  notes: string | null;
  created_at: string;
};

// GET /api/v1/students/:id/mock_tests
export async function getMockTests(studentId: number): Promise<ApiResponse<MockTest[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/mock_tests`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to fetch mock tests" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// POST /api/v1/students/:id/mock_tests
export async function createMockTest(studentId: number, data: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/mock_tests`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ mock_test: data }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to record mock test", errors: json.errors };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type MockTest = {
  id: number;
  student_id: number;
  score: number;
  test_date: string;
  result: string;
  created_at: string;
};

// GET /api/v1/license_upgrades
export async function getLicenseUpgrades(): Promise<ApiResponse<LicenseUpgrade[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/license_upgrades`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to fetch license upgrades" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// POST /api/v1/license_upgrades/:id/approve
export async function approveLicenseUpgrade(id: number): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/license_upgrades/${id}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to approve upgrade" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type LicenseUpgrade = {
  id: number;
  student_id: number;
  current_tier: string;
  requested_tier: string;
  status: string;
  created_at: string;
};

// GET /api/v1/renewal_requests
export async function getRenewalRequests(): Promise<ApiResponse<RenewalRequest[]>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/renewal_requests`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to fetch renewal requests" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type RenewalRequest = {
  id: number;
  student_id: number;
  status: string;
  created_at: string;
};

// GET /api/v1/students/:id/graduation_record
export async function getGraduationRecord(studentId: number): Promise<ApiResponse<GraduationRecord>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/graduation_record`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "No graduation record found" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type GraduationRecord = {
  id: number;
  student_id: number;
  graduation_date: string;
  dossier_status: string;
  transfer_destination: string | null;
  created_at: string;
};

// GET /api/v1/students/:id/lms_progress
export async function getLmsProgress(studentId: number): Promise<ApiResponse<LmsProgress>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/students/${studentId}/lms_progress`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to fetch progress" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type LmsProgress = {
  status: string;
  exam_eligible: boolean;
  theory: { days_completed: number; days_required: number; percentage: number; complete: boolean };
  practical: { days_completed: number; days_required: number; percentage: number; complete: boolean };
  mock_test: { score: number; required: number; passed: boolean };
  next_milestone: string;
};

// GET /api/v1/payroll_entries
export async function getPayrollEntries(userId?: number): Promise<ApiResponse<PayrollEntry[]>> {
  try {
    const params = userId ? `?user_id=${userId}` : "";
    const res = await fetch(`${API_BASE_URL}/api/v1/payroll_entries${params}`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to fetch payroll" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export type PayrollEntry = {
  id: number;
  user_id: number;
  instructor_name: string | null;
  base_pay: number;
  active_student_loads: number;
  active_training_days: number;
  total_pay: number;
  period_start: string;
  period_end: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

// POST /api/v1/users
export async function createUser(data: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ user: data }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to create user", errors: json.errors };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// POST /api/v1/batches
export async function createBatch(data: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/batches`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ batch: data }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to create batch", errors: json.errors };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// POST /api/v1/invoices/:id/mark_paid
export async function markInvoicePaid(id: number): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/invoices/${id}/mark_paid`, {
      method: "POST",
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to mark invoice paid" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/invoices/:id
export async function getInvoice(id: number): Promise<ApiResponse<StudentInvoice>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/${id}`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch invoice" };
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/students/:id/invoices
export async function getStudentInvoices(id: number): Promise<ApiResponse<StudentInvoice[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${id}/invoices`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch student invoices" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/students/:id/attendance_logs
export async function getStudentAttendance(id: number): Promise<ApiResponse<AttendanceLog[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${id}/attendance_logs`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch attendance" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// GET /api/v1/students/:id/lms_progress
export async function getStudentLmsProgress(id: number): Promise<ApiResponse<LmsProgress>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/students/${id}/lms_progress`, { headers: authHeaders() });
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error || "Failed to fetch LMS progress" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// POST /api/v1/invoices/:id/mark_paid (with payload)
export async function markInvoiceAsPaid(
  id: number,
  payload?: Record<string, unknown>,
): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/invoices/${id}/mark_paid`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to mark invoice paid" };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// Type shape returned by GET /api/v1/course_categories.
// Mirrors the structure in backend/config/course_categories.yml.
export type CourseCategory = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  duration_days: number;
  registration_fee: number;
  requirements: { text: string; icon: string }[];
};
