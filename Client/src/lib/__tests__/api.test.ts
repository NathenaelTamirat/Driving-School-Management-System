import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getToken,
  setToken,
  clearToken,
  login,
  logout,
  getMe,
  createStudent,
  getStudents,
  getStudent,
  getBatches,
  updateStudent,
  mapEnrollmentToStudentPayload,
  buildEnrollmentFormData,
  createStudentFromEnrollment,
} from "@/lib/api";
import { INITIAL_ENROLLMENT_STATE } from "@/lib/enrollment-types";

const TOKEN_KEY = "driving_school_token";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("token helpers", () => {
  it("setToken stores the token", () => {
    setToken("abc123");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("abc123");
  });

  it("getToken returns the stored token", () => {
    localStorage.setItem(TOKEN_KEY, "xyz789");
    expect(getToken()).toBe("xyz789");
  });

  it("getToken returns null when no token exists", () => {
    expect(getToken()).toBeNull();
  });

  it("clearToken removes the token", () => {
    localStorage.setItem(TOKEN_KEY, "abc");
    clearToken();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("getToken returns null during SSR (window undefined)", () => {
    const origWindow = globalThis.window;
    // @ts-expect-error testing SSR
    delete globalThis.window;
    expect(getToken()).toBeNull();
    globalThis.window = origWindow;
  });
});

describe("login", () => {
  it("sends POST to /api/v1/auth/login and stores token on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { token: "jwt-token", user: { id: 1, email: "a@b.com", full_name: "Admin", role: "admin" } },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await login("a@b.com", "secret");

    expect(result.success).toBe(true);
    expect(result.data?.token).toBe("jwt-token");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("jwt-token");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/login"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ auth: { email: "a@b.com", password: "secret" } }),
      }),
    );
  });

  it("returns error on failed login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid email or password" }),
    }));

    const result = await login("a@b.com", "wrong");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid");
  });

  it("handles network errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const result = await login("a@b.com", "secret");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Network failure");
  });
});

describe("logout", () => {
  it("calls DELETE /api/v1/auth/logout and clears token", async () => {
    localStorage.setItem(TOKEN_KEY, "jwt");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Logged out" }),
    }));

    const result = await logout();
    expect(result.success).toBe(true);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("clears token even if server request fails", async () => {
    localStorage.setItem(TOKEN_KEY, "jwt");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Server down")));

    const result = await logout();
    expect(result.success).toBe(true);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("getMe", () => {
  it("returns user data on success", async () => {
    localStorage.setItem(TOKEN_KEY, "jwt");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { user: { id: 1, email: "a@b.com", full_name: "Admin", role: "admin" } },
      }),
    }));

    const result = await getMe();
    expect(result.success).toBe(true);
    expect(result.data?.user.email).toBe("a@b.com");
  });

  it("clears token on 401", async () => {
    localStorage.setItem(TOKEN_KEY, "expired-jwt");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Session expired" }),
    }));

    const result = await getMe();
    expect(result.success).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("createStudent", () => {
  it("POSTs JSON payload", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    }));

    const result = await createStudent({ first_name: "Abebe" } as Record<string, unknown>);
    expect(result.success).toBe(true);
  });

  it("POSTs FormData when given FormData", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 2 } }),
    }));

    const fd = new FormData();
    fd.append("student[name]", "Test");
    const result = await createStudent(fd);
    expect(result.success).toBe(true);
  });

  it("returns error on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Validation failed" }),
    }));

    const result = await createStudent({} as Record<string, unknown>);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
  });
});

describe("getStudents", () => {
  it("fetches student list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ id: 1, first_name: "Abebe" }]),
    }));

    const result = await getStudents();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});

describe("getStudent", () => {
  it("fetches a single student by id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 5, first_name: "Kebede" }),
    }));

    const result = await getStudent(5);
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>)?.first_name).toBe("Kebede");
  });

  it("returns error for non-existent student", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Student not found" }),
    }));

    const result = await getStudent(999);
    expect(result.success).toBe(false);
  });
});

describe("getBatches", () => {
  it("fetches batch list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ id: 1, name: "Batch A" }]),
    }));

    const result = await getBatches();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});

describe("updateStudent", () => {
  it("PATCHes student data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1, verified: true } }),
    }));

    const result = await updateStudent(1, { verified: true });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

describe("mapEnrollmentToStudentPayload", () => {
  it("maps enrollment state to student payload", () => {
    const state = {
      ...INITIAL_ENROLLMENT_STATE,
      profile: {
        ...INITIAL_ENROLLMENT_STATE.profile,
        firstNameEn: "Abebe",
        fatherNameEn: "Kebede",
        lastNameEn: "Tadesse",
        phone: "0911234567",
        dateOfBirthEc: "1998-05-15",
        bloodType: "O+",
        address: "123 Main St",
        houseNumber: "H001",
        woreda: "02",
        city: "Addis Ababa",
      },
    };

    const payload = mapEnrollmentToStudentPayload(state);
    expect(payload.first_name).toBe("Abebe");
    expect(payload.middle_name).toBe("Kebede");
    expect(payload.last_name).toBe("Tadesse");
    expect(payload.student_id).toMatch(/^STU/);
    expect(payload.document_id).toMatch(/^DOC/);
    expect(payload.verified).toBe(false);
    expect(payload.batch_id).toBeGreaterThan(0);
  });
});

describe("buildEnrollmentFormData", () => {
  it("produces a FormData with student fields", () => {
    const state = {
      ...INITIAL_ENROLLMENT_STATE,
      profile: {
        ...INITIAL_ENROLLMENT_STATE.profile,
        firstNameEn: "Abebe",
        fatherNameEn: "Kebede",
        lastNameEn: "Tadesse",
        phone: "0911234567",
      },
    };

    const fd = buildEnrollmentFormData(state);
    expect(fd.get("student[first_name]")).toBe("Abebe");
    expect(fd.get("student[middle_name]")).toBe("Kebede");
    expect(fd.get("student[verified]")).toBe("false");
  });
});

describe("createStudentFromEnrollment", () => {
  it("calls createStudent with mapped payload", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    }));

    const result = await createStudentFromEnrollment(INITIAL_ENROLLMENT_STATE);
    expect(result.success).toBe(true);
  });
});
