"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowRight,
  CloudUpload,
  ScanLine,
  Upload,
  IdCard,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  REQUIRED_DOCUMENTS,
  type EnrollmentDocumentKey,
  type UploadedDocument,
} from "@/lib/enrollment-types";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

type DocumentsStepProps = {
  onBack: () => void;
  onContinue: () => void;
};

export function DocumentsStep({ onBack, onContinue }: DocumentsStepProps) {
  const { state, setDocument } = useEnrollment();
  const [isScanning, setIsScanning] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const allRequiredUploaded = REQUIRED_DOCUMENTS.every(
    (doc) => state.documents[doc.key],
  );

  const processFile = useCallback(
    async (key: EnrollmentDocumentKey, file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Only PDF, JPG, and PNG files are supported");
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

  const handleBulkUpload = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const pending = [...REQUIRED_DOCUMENTS].filter(
        (doc) => !state.documents[doc.key],
      );
      Array.from(files).forEach((file, index) => {
        const target = pending[index];
        if (target) processFile(target.key, file);
      });
    },
    [processFile, state.documents],
  );

  const handleScan = () => {
    setIsScanning(true);
    toast.info("Scanner simulation started…");
    setTimeout(() => {
      setIsScanning(false);
      toast.success(
        "Scanner ready — use Upload Documents to attach files in this demo",
      );
    }, 1500);
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#2563eb]">
            <ScanLine className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-[#0f172a]">Scan Documents</h3>
          <p className="mt-2 text-sm text-slate-600">
            Use an attached TWAIN-compatible scanner to directly capture
            documents into the system.
          </p>
          <Button
            type="button"
            className="mt-4 bg-[#2563eb] hover:bg-[#1d4ed8]"
            onClick={handleScan}
            disabled={isScanning}
          >
            <ScanLine className="h-4 w-4" />
            {isScanning ? "Scanning…" : "Scan Now"}
          </Button>
        </div>

        <div
          className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-[#2563eb]/40"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleBulkUpload(e.dataTransfer.files);
          }}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#2563eb]">
            <CloudUpload className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-[#0f172a]">Upload Documents</h3>
          <p className="mt-2 text-sm text-slate-600">
            Drag and drop files here or{" "}
            <button
              type="button"
              className="font-medium text-[#2563eb] hover:underline"
              onClick={() => bulkInputRef.current?.click()}
            >
              browse
            </button>
            .
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Supported formats: PDF, JPG, PNG (Max 5MB)
          </p>
          <input
            ref={bulkInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => handleBulkUpload(e.target.files)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-[#0f172a]">
          Required Documents
        </h2>

        <ul className="mt-4 divide-y divide-slate-100">
          {REQUIRED_DOCUMENTS.map((doc) => {
            const uploaded = state.documents[doc.key];
            const Icon =
              doc.key === "national_id" ? IdCard : GraduationCap;

            return (
              <DocumentRow
                key={doc.key}
                icon={Icon}
                title={doc.title}
                description={doc.description}
                uploaded={uploaded}
                onUpload={(file) => processFile(doc.key, file)}
                onRemove={() => setDocument(doc.key, null)}
              />
            );
          })}
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
  icon: Icon,
  title,
  description,
  uploaded,
  onUpload,
  onRemove,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  uploaded?: UploadedDocument;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <li className="flex flex-wrap items-center gap-4 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[#0f172a]">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
        {uploaded && (
          <p className="mt-1 truncate text-xs text-emerald-600">
            {uploaded.name}
          </p>
        )}
      </div>
      <Badge
        variant={uploaded ? "success" : "destructive"}
        className={cn(
          !uploaded && "bg-red-50 text-red-700 hover:bg-red-50",
          uploaded && "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
        )}
      >
        {uploaded ? "Uploaded" : "Awaiting Upload"}
      </Badge>
      {uploaded ? (
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-[#2563eb]"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </>
      )}
    </li>
  );
}

function readPreview(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
