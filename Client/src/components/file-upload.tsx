"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { UploadSlot, StudentFormValues } from "@/lib/validations";

type UploadedFile = {
  file: File;
  preview: string | null;
  type: "image" | "pdf" | "other";
  progress: number;
};

type FileUploadProps = {
  slot: UploadSlot;
  files: Record<string, UploadedFile | null>;
  onFileChange: (key: string, file: UploadedFile | null) => void;
  errors: Partial<Record<keyof StudentFormValues | string, string>>;
};

export function FileUpload({
  slot,
  files,
  onFileChange,
  errors,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const currentFile = files[slot.key];

  const generatePreview = useCallback(
    (file: File): Promise<string | null> => {
      return new Promise((resolve) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        } else if (file.type === "application/pdf") {
          resolve(null);
        } else {
          resolve(null);
        }
      });
    },
    [],
  );

  const getFileType = (
    file: File,
  ): "image" | "pdf" | "other" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/pdf") return "pdf";
    return "other";
  };

  const handleFile = useCallback(
    async (file: File) => {
      setIsSimulating(true);
      const preview = await generatePreview(file);
      const type = getFileType(file);

      const uploaded: UploadedFile = {
        file,
        preview,
        type,
        progress: 0,
      };

      const interval = setInterval(() => {
        uploaded.progress = Math.min(uploaded.progress + 20, 100);
        if (uploaded.progress >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
        }
      }, 150);

      setTimeout(() => {
        clearInterval(interval);
        uploaded.progress = 100;
        onFileChange(slot.key, uploaded);
        setIsSimulating(false);
      }, 800);
    },
    [generatePreview, onFileChange, slot.key],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    onFileChange(slot.key, null);
  }, [onFileChange, slot.key]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const error = errors[slot.key];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {slot.label}
          {slot.required && (
            <span className="ml-1 text-destructive">*</span>
          )}
        </label>
        {currentFile && (
          <span className="text-xs text-muted-foreground">
            {formatFileSize(currentFile.file.size)}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentFile ? (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="relative flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
          >
            {currentFile.type === "image" && currentFile.preview ? (
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                <img
                  src={currentFile.preview}
                  alt={currentFile.file.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : currentFile.type === "pdf" ? (
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/20">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-sm font-medium">
                {currentFile.file.name}
              </span>
              {currentFile.progress < 100 ? (
                <Progress value={currentFile.progress} className="h-1.5" />
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Ready to upload
                </span>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-all duration-200",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
              error && "border-destructive/50",
            )}
          >
            {slot.acceptImages ? (
              <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground/60" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragOver ? "Drop file here" : "Click or drag to upload"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {slot.acceptImages
                  ? "JPEG, PNG, WebP, HEIC"
                  : "PDF, JPEG, PNG, WebP"}{" "}
                &middot; Max 10MB
              </p>
            </div>
            {isSimulating && (
              <Progress value={45} className="h-1 w-32" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-1 text-xs text-destructive"
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </motion.p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={
          slot.acceptImages
            ? "image/jpeg,image/png,image/webp,image/heic,image/heif"
            : "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
        }
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
