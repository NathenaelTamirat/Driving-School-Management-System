type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function createStudent(
  formData: FormData,
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/students`, {
      method: "POST",
      body: formData,
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
