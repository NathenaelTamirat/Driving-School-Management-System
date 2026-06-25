"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  GraduationCap,
  ImageIcon,
  ScanLine,
  Stethoscope,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  ENROLLMENT_DOCUMENT_ROWS,
  type EnrollmentDocumentKey,
  type EnrollmentDocumentRow,
  type UploadedDocument,
} from "@/lib/enrollment-types";
import {
  ACCEPTED_DOC_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validations";
import { cn } from "@/lib/utils";

type DocumentsStepProps = {
  onBack: () => void;
  onContinue: () => void;
};

export function DocumentsStep({ onBack, onContinue }: DocumentsStepProps) {
  const { state, setDocument } = useEnrollment();
  const [scanningKey, setScanningKey] = useState<EnrollmentDocumentKey | null>(
    null,
  );

  const requiredRows = ENROLLMENT_DOCUMENT_ROWS.filter((row) => row.required);
  const allRequiredUploaded = requiredRows.every(
    (row) => state.documents[row.key],
  );

  const processFile = useCallback(
    async (key: EnrollmentDocumentKey, file: File, acceptImages?: boolean) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} must be less than 10MB`);
        return;
      }

      const allowedTypes = acceptImages
        ? ACCEPTED_IMAGE_TYPES
        : ACCEPTED_DOC_TYPES;

      if (
        !allowedTypes.includes(file.type) &&
        !(acceptImages && file.type.startsWith("image/"))
      ) {
        toast.error(
          acceptImages
            ? "Only image files (JPEG, PNG, WebP, HEIC) are allowed"
            : "Only PDF, JPG, and PNG files are allowed",
        );
        return;
      }

      const preview = file.type.startsWith("image/")
        ? await readPreview(file)
        : null;

      const uploaded: UploadedDocument = {
        file,
        preview,
        name: file.name,
        size: file.size,
      };
      setDocument(key, uploaded);
      toast.success(`${file.name} uploaded`);
    },
    [setDocument],
  );

  const handleScan = (key: EnrollmentDocumentKey, label: string) => {
    setScanningKey(key);
    toast.info(`Starting scanner for ${label}…`);
    setTimeout(() => {
      setScanningKey(null);
      toast.success(
        `Scanner ready for ${label} — use Upload to attach the file in this demo`,
      );
    }, 1200);
  };

  const handleContinue = () => {
    if (!allRequiredUploaded) {
      toast.error("Please upload all required documents");
      return;
    }
    onContinue();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-[#0f172a]">
          Required Documents
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload or scan each document individually. Supported formats: PDF,
          JPG, PNG (max 10MB). Profile photo accepts images only.
        </p>

        <ul className="mt-4 divide-y divide-slate-100">
          {ENROLLMENT_DOCUMENT_ROWS.map((row) => (
            <DocumentRow
              key={row.key}
              row={row}
              uploaded={state.documents[row.key]}
              isScanning={scanningKey === row.key}
              onUpload={(file) =>
                processFile(row.key, file, row.acceptImages)
              }
              onScan={() => handleScan(row.key, row.label)}
              onRemove={() => setDocument(row.key, null)}
            />
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
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

function DocumentRow({
  row,
  uploaded,
  isScanning,
  onUpload,
  onScan,
  onRemove,
}: {
  row: EnrollmentDocumentRow;
  uploaded?: UploadedDocument;
  isScanning: boolean;
  onUpload: (file: File) => void;
  onScan: () => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = getRowIcon(row.key);

  const accept = row.acceptImages
    ? "image/jpeg,image/png,image/webp,image/heic,image/heif"
    : "image/jpeg,image/png,image/webp,application/pdf";

  return (
    <li className="flex flex-wrap items-center gap-3 py-4 sm:gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-[#0f172a]">{row.label}</p>
          {!row.required && (
            <span className="text-xs text-slate-400">(Optional)</span>
          )}
        </div>
        <p className="text-sm text-slate-500">{row.description}</p>
        {uploaded && (
          <p className="mt-1 truncate text-xs text-emerald-600">
            {uploaded.name}
          </p>
        )}
      </div>

      <Badge
        variant={uploaded ? "success" : "destructive"}
        className={cn(
          "shrink-0",
          !uploaded && "bg-red-50 text-red-700 hover:bg-red-50",
          uploaded && "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
        )}
      >
        {uploaded ? "Uploaded" : "Awaiting Upload"}
      </Badge>

      <div className="flex shrink-0 items-center gap-2">
        {uploaded ? (
          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            Remove
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isScanning}
              onClick={onScan}
            >
              <ScanLine className="h-4 w-4" />
              {isScanning ? "Scanning…" : "Scan"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#2563eb] hover:bg-[#1d4ed8]"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
    </li>
  );
}

function getRowIcon(key: EnrollmentDocumentKey) {
  switch (key) {
    case "profile_photo":
      return ImageIcon;
    case "yellow_card":
      return FileText;
    case "grade_8":
    case "grade_10":
    case "grade_12":
      return GraduationCap;
    case "medical":
      return Stethoscope;
    default:
      return FileText;
  }
}

function readPreview(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
