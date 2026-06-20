"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  User,
  MapPin,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  studentSchema,
  BLOOD_TYPE_OPTIONS,
  UPLOAD_SLOTS,
  ACCEPTED_DOC_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validations";
import { createStudent } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { StudentFormValues } from "@/lib/validations";

type UploadedFile = {
  file: File;
  preview: string | null;
  type: "image" | "pdf" | "other";
  progress: number;
};

type FormStep = "info" | "documents" | "review";

export function StudentForm() {
  const [step, setStep] = useState<FormStep>("info");
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFile | null>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      date_of_birth: "",
      blood_type: "",
      address: "",
      house_number: "",
      kebele: "",
      woreda: "",
      subcity: "",
      city: "",
      student_id: "",
      document_id: "",
      verified: false,
    },
  });

  const watchedBloodType = watch("blood_type");
  const watchedVerified = watch("verified");

  const handleBloodTypeChange = useCallback(
    (value: string) => {
      setValue("blood_type", value, { shouldValidate: true });
    },
    [setValue],
  );

  const handleVerifiedChange = useCallback(
    (value: string) => {
      setValue("verified", value === "true", { shouldValidate: true });
    },
    [setValue],
  );

  const handleFileChange = useCallback(
    (key: string, file: UploadedFile | null) => {
      setUploadedFiles((prev) => ({ ...prev, [key]: file }));
    },
    [],
  );

  const buildFormData = (
    data: StudentFormValues,
    files: Record<string, UploadedFile | null>,
  ): FormData => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "verified") {
        formData.append(`student[${key}]`, value ? "true" : "false");
      } else {
        formData.append(`student[${key}]`, String(value));
      }
    });

    UPLOAD_SLOTS.forEach((slot) => {
      const uploaded = files[slot.key];
      if (uploaded) {
        formData.append(`student[${slot.key}]`, uploaded.file);
      }
    });

    return formData;
  };

  const validateFiles = (): Record<string, string> => {
    const fileErrors: Record<string, string> = {};

    UPLOAD_SLOTS.forEach(({ key, label, required }) => {
      const uploaded = uploadedFiles[key];
      if (required && !uploaded) {
        fileErrors[key] = `${label} is required`;
        return;
      }
      if (uploaded) {
        if (uploaded.file.size > MAX_FILE_SIZE) {
          fileErrors[key] = `${label} must be less than 10MB`;
        }
        if (
          !ACCEPTED_DOC_TYPES.includes(uploaded.file.type) &&
          !uploaded.file.type.startsWith("image/")
        ) {
          fileErrors[key] = `${label} must be an image or PDF`;
        }
      }
    });

    return fileErrors;
  };

  const onSubmit = async (data: StudentFormValues) => {
    setServerError(null);

    const fileErrors = validateFiles();
    if (Object.keys(fileErrors).length > 0) {
      const firstError = Object.values(fileErrors)[0];
      toast.error(firstError);
      setStep("documents");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = buildFormData(data, uploadedFiles);
      const result = await createStudent(formData);

      if (result.success) {
        setSubmitSuccess(true);
        toast.success("Student created successfully!");
        reset();
        setUploadedFiles({});
        setTimeout(() => {
          setSubmitSuccess(false);
          setStep("info");
        }, 3000);
      } else {
        setServerError(result.error || "Failed to create student");
        toast.error(result.error || "Failed to create student");
      }
    } catch {
      const msg = "Something went wrong. Please try again.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === "info") setStep("documents");
    else if (step === "documents") setStep("review");
  };

  const prevStep = () => {
    if (step === "documents") setStep("info");
    else if (step === "review") setStep("documents");
  };

  const steps = [
    { key: "info", label: "Student Info", icon: User },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "review", label: "Review", icon: ShieldCheck },
  ] as const;

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold">Student Created!</h2>
        <p className="mt-2 text-muted-foreground">
          The student record has been saved successfully.
        </p>
        <Badge variant="success" className="mt-4">
          Verified
        </Badge>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(s.key)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                step === s.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-8",
                  steps.findIndex((st) => st.key === step) > i
                    ? "bg-primary"
                    : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Student Information */}
        {step === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Information
                </CardTitle>
                <CardDescription>
                  Enter the personal details of the student.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name Fields */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      {...register("first_name")}
                      placeholder="Enter first name"
                      className={cn(errors.first_name && "border-destructive")}
                    />
                    {errors.first_name && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">
                      Middle Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="middle_name"
                      {...register("middle_name")}
                      placeholder="Enter middle name"
                      className={cn(errors.middle_name && "border-destructive")}
                    />
                    {errors.middle_name && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.middle_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      {...register("last_name")}
                      placeholder="Enter last name"
                      className={cn(errors.last_name && "border-destructive")}
                    />
                    {errors.last_name && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* DOB & Blood Type */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      {...register("date_of_birth")}
                      className={cn(
                        errors.date_of_birth && "border-destructive",
                      )}
                    />
                    {errors.date_of_birth && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.date_of_birth.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blood_type">
                      Blood Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watchedBloodType}
                      onValueChange={handleBloodTypeChange}
                    >
                      <SelectTrigger
                        id="blood_type"
                        className={cn(errors.blood_type && "border-destructive")}
                      >
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.blood_type && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.blood_type.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address Fields */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Address Information
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="address"
                        {...register("address")}
                        placeholder="Street address"
                        className={cn(errors.address && "border-destructive")}
                      />
                      {errors.address && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors.address.message}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="house_number">
                          House Number{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="house_number"
                          {...register("house_number")}
                          placeholder="House number"
                          className={cn(
                            errors.house_number && "border-destructive",
                          )}
                        />
                        {errors.house_number && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {errors.house_number.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kebele">Kebele</Label>
                        <Input
                          id="kebele"
                          {...register("kebele")}
                          placeholder="Kebele"
                          className={cn(errors.kebele && "border-destructive")}
                        />
                        {errors.kebele && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {errors.kebele.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="woreda">
                          Woreda <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="woreda"
                          {...register("woreda")}
                          placeholder="Woreda"
                          className={cn(errors.woreda && "border-destructive")}
                        />
                        {errors.woreda && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {errors.woreda.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subcity">Subcity</Label>
                        <Input
                          id="subcity"
                          {...register("subcity")}
                          placeholder="Subcity"
                          className={cn(errors.subcity && "border-destructive")}
                        />
                        {errors.subcity && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {errors.subcity.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          City / Town{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="city"
                          {...register("city")}
                          placeholder="City or town"
                          className={cn(errors.city && "border-destructive")}
                        />
                        {errors.city && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {errors.city.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ID Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="student_id">
                      Student ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="student_id"
                      {...register("student_id")}
                      placeholder="Student ID"
                      className={cn(errors.student_id && "border-destructive")}
                    />
                    {errors.student_id && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.student_id.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document_id">
                      Document ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="document_id"
                      {...register("document_id")}
                      placeholder="Document ID"
                      className={cn(
                        errors.document_id && "border-destructive",
                      )}
                    />
                    {errors.document_id && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.document_id.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Verified Status */}
                <div className="space-y-2">
                  <Label>Verification Status</Label>
                  <Select
                    value={watchedVerified ? "true" : "false"}
                    onValueChange={handleVerifiedChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">
                        Pending Verification
                      </SelectItem>
                      <SelectItem value="true">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={nextStep} size="lg">
                Next: Documents
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Document Uploads */}
        {step === "documents" && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Uploads
                </CardTitle>
                <CardDescription>
                  Upload the required documents for the student record.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  {UPLOAD_SLOTS.map((slot) => (
                    <FileUpload
                      key={slot.key}
                      slot={slot}
                      files={uploadedFiles}
                      onFileChange={handleFileChange}
                      errors={{}}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep} size="lg">
                Previous
              </Button>
              <Button type="button" onClick={nextStep} size="lg">
                Next: Review
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Submit */}
        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Review & Submit
                </CardTitle>
                <CardDescription>
                  Verify the information before submitting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Info Summary */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Personal Information
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { label: "First Name", value: watch("first_name") },
                      { label: "Middle Name", value: watch("middle_name") },
                      { label: "Last Name", value: watch("last_name") },
                      { label: "Date of Birth", value: watch("date_of_birth") },
                      { label: "Blood Type", value: watch("blood_type") },
                    ].map(
                      (field) =>
                        field.value && (
                          <div
                            key={field.label}
                            className="flex justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {field.label}
                            </span>
                            <span className="font-medium">{field.value}</span>
                          </div>
                        ),
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address Summary */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Address
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { label: "Address", value: watch("address") },
                      { label: "House No.", value: watch("house_number") },
                      { label: "Kebele", value: watch("kebele") },
                      { label: "Woreda", value: watch("woreda") },
                      { label: "Subcity", value: watch("subcity") },
                      { label: "City", value: watch("city") },
                    ].map(
                      (field) =>
                        field.value && (
                          <div
                            key={field.label}
                            className="flex justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {field.label}
                            </span>
                            <span className="font-medium">{field.value}</span>
                          </div>
                        ),
                    )}
                  </div>
                </div>

                <Separator />

                {/* Document Summary */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Documents
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {UPLOAD_SLOTS.map((slot) => {
                      const file = uploadedFiles[slot.key];
                      return (
                        <Badge
                          key={slot.key}
                          variant={file ? "success" : "destructive"}
                        >
                          {file ? `${slot.label} ✓` : `${slot.label} (missing)`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {serverError && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {serverError}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                size="lg"
              >
                Previous
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="min-w-[160px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Student
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
