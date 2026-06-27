"use client";

import { useCallback, useState } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  ENROLLMENT_DOCUMENT_ROWS,
  type EnrollmentDocumentKey,
} from "@/lib/enrollment-types";
import { FileUpload, type UploadedFile } from "@/components/file-upload";
import { UPLOAD_SLOTS } from "@/lib/validations";

type DocumentsStepProps = {
  onBack: () => void;
  onContinue: () => void;
};

export function DocumentsStep({ onBack, onContinue }: DocumentsStepProps) {
  const { formData, updateFormData } = useEnrollment();
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFile | null>
  >({});

  const documentCount = Object.values(uploadedFiles).filter(Boolean).length;
  const hasAtLeastOne = documentCount >= 1;

  const handleFileChange = useCallback(
    (key: string, file: UploadedFile | null) => {
      setUploadedFiles((prev) => ({ ...prev, [key]: file }));
    },
    [],
  );

  const handleContinue = () => {
    const files: File[] = Object.values(uploadedFiles).filter(
      (f): f is UploadedFile => f !== null,
    ).map((uf) => uf.file);

    if (files.length === 0) return;
    updateFormData({ documents: files });
    onContinue();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-[#0f172a]">
          Upload Documents
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload at least one document. Supported formats: PDF, JPG, PNG (max 10MB).
        </p>

        <div className="mt-6 space-y-6">
          {ENROLLMENT_DOCUMENT_ROWS.map((row) => {
            const slot = UPLOAD_SLOTS.find((s) => s.key === row.key);
            if (!slot) return null;
            return (
              <FileUpload
                key={row.key}
                slot={slot}
                files={uploadedFiles}
                onFileChange={handleFileChange}
                errors={{}}
              />
            );
          })}
        </div>

        {!hasAtLeastOne && (
          <p className="mt-4 flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Upload at least one document to continue
          </p>
        )}

        {hasAtLeastOne && (
          <p className="mt-4 text-xs text-emerald-600">
            {documentCount} file{documentCount > 1 ? "s" : ""} uploaded
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          disabled={!hasAtLeastOne}
          className="bg-[#2563eb] hover:bg-[#1d4ed8]"
          onClick={handleContinue}
        >
          Continue to Payment
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
