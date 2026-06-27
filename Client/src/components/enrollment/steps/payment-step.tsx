"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Banknote,
  Check,
  CreditCard,
  FileText,
  Loader2,
  ScrollText,
  User,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  formatEtb,
  REGISTRATION_FEE,
} from "@/lib/enrollment-types";
import {
  paymentStepSchema,
  type PaymentStepValues,
} from "@/lib/enrollment-validations";
import { cn } from "@/lib/utils";

type PaymentStepProps = {
  onBack: () => void;
};

const PAYMENT_METHODS = [
  {
    value: "cash" as const,
    label: "Cash",
    description: "Pay in person at the school office",
    icon: Banknote,
  },
  {
    value: "bank_transfer" as const,
    label: "Bank Transfer",
    description: "Transfer to the school's bank account",
    icon: CreditCard,
  },
  {
    value: "other" as const,
    label: "Other",
    description: "Alternative payment arrangement",
    icon: ScrollText,
  },
];

export function PaymentStep({ onBack }: PaymentStepProps) {
  const { formData, updateFormData, submitEnrollment } = useEnrollment();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentStepValues>({
    resolver: zodResolver(paymentStepSchema),
    defaultValues: {
      paymentMethod: formData.paymentMethod,
      paymentNotes: formData.paymentNotes || "",
    },
  });

  const watchedMethod = watch("paymentMethod");

  const onSubmit = async (data: PaymentStepValues) => {
    updateFormData(data);
    setIsSubmitting(true);
    await submitEnrollment();
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-[#0f172a]">
              Payment Method
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select how you would like to pay for the enrollment.
            </p>

            <div className="mt-6 grid gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = watchedMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() =>
                      setValue("paymentMethod", method.value, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all",
                      isSelected
                        ? "border-[#2563eb] bg-[#eff6ff]"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        isSelected
                          ? "bg-[#2563eb]/10 text-[#2563eb]"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#0f172a]">
                        {method.label}
                      </p>
                      <p className="text-sm text-slate-500">
                        {method.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {errors.paymentMethod && (
              <p className="mt-2 text-xs text-red-600">
                {errors.paymentMethod.message}
              </p>
            )}

            <div className="mt-6 space-y-2">
              <Label htmlFor="payment-notes" className="text-sm font-medium text-slate-700">
                Notes <span className="text-xs text-slate-400">(optional)</span>
              </Label>
              <Input
                id="payment-notes"
                {...register("paymentNotes")}
                placeholder="Any additional notes about payment…"
                className={cn(errors.paymentNotes && "border-red-500")}
              />
              {errors.paymentNotes && (
                <p className="text-xs text-red-600">
                  {errors.paymentNotes.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
              <FileText className="h-4 w-4" />
              Order Summary
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">Registration Fee</p>
                  <p className="text-xs text-slate-500">
                    Administrative processing
                  </p>
                </div>
                <p className="font-medium">{formatEtb(REGISTRATION_FEE)} ETB</p>
              </div>
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">License Category</p>
                  <p className="text-xs text-slate-500">
                    {formData.licenseCategory || "Not selected"}
                  </p>
                </div>
              </div>
            </div>

            <div className="my-4 border-t border-slate-200" />

            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <User className="h-3.5 w-3.5" />
                Student Details
              </div>
              <p className="mt-2 font-medium text-[#0f172a]">
                {formData.firstName} {formData.lastName}
              </p>
              <p className="text-sm text-slate-500">{formData.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          className="bg-[#0f2744] hover:bg-[#0f2744]/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isSubmitting ? "Submitting…" : "Finish Enrollment"}
        </Button>
      </div>
    </form>
  );
}
