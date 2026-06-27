import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileUpload } from "@/components/file-upload";
import type { UploadSlot } from "@/lib/validations";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const photoSlot: UploadSlot = {
  key: "profile_photo",
  label: "Profile Photo",
  required: true,
  acceptImages: true,
};

const docSlot: UploadSlot = {
  key: "grade_8",
  label: "8th Grade Document",
  required: true,
};

describe("FileUpload", () => {
  it("renders the slot label with required indicator", () => {
    render(
      <FileUpload
        slot={photoSlot}
        files={{}}
        onFileChange={vi.fn()}
        errors={{}}
      />,
    );

    expect(screen.getByText("Profile Photo")).toBeDefined();
    expect(screen.getByText("*")).toBeDefined();
  });

  it("shows click or drag message", () => {
    render(
      <FileUpload
        slot={docSlot}
        files={{}}
        onFileChange={vi.fn()}
        errors={{}}
      />,
    );

    expect(screen.getByText("Click or drag to upload")).toBeDefined();
  });

  it("shows file size after upload", () => {
    const file = new File([new ArrayBuffer(1024)], "doc.pdf", { type: "application/pdf" });
    render(
      <FileUpload
        slot={docSlot}
        files={{
          grade_8: { file, preview: null, type: "pdf", progress: 100 },
        }}
        onFileChange={vi.fn()}
        errors={{}}
      />,
    );

    expect(screen.getByText("1.0 KB")).toBeDefined();
  });

  it("shows 'Ready to upload' when progress reaches 100", () => {
    const file = new File([new ArrayBuffer(2048)], "photo.jpg", { type: "image/jpeg" });
    render(
      <FileUpload
        slot={photoSlot}
        files={{
          profile_photo: { file, preview: "data:image/jpeg;base64,abc", type: "image", progress: 100 },
        }}
        onFileChange={vi.fn()}
        errors={{}}
      />,
    );

    expect(screen.getByText("Ready to upload")).toBeDefined();
  });

  it("displays error for the slot", () => {
    render(
      <FileUpload
        slot={photoSlot}
        files={{}}
        onFileChange={vi.fn()}
        errors={{ profile_photo: "File is required" }}
      />,
    );

    expect(screen.getByText("File is required")).toBeDefined();
  });
});
