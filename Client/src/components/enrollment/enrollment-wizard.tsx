"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { EnrollmentStepper } from "@/components/enrollment/enrollment-stepper";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import { ProfileStep } from "@/components/enrollment/steps/profile-step";
import { CategoryStep } from "@/components/enrollment/steps/category-step";
import { DocumentsStep } from "@/components/enrollment/steps/documents-step";
import { PaymentStep } from "@/components/enrollment/steps/payment-step";
import { REGISTRATION_FEE, formatEtb } from "@/lib/enrollment-types";

export function EnrollmentWizard() {
  const { state, setStep, formData } = useEnrollment();

  const stepValidity: Record<number, boolean> = {
    1: Boolean(
      formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.phone &&
        formData.dateOfBirth &&
        formData.address,
    ),
    2: Boolean(formData.licenseCategory),
    3: formData.documents.length > 0,
    4: Boolean(formData.paymentMethod),
  };

  const titles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: "New Student Enrollment",
      subtitle:
        "Complete the registration process to enroll a new student into the ERTA certified driving program.",
    },
    2: {
      title: "Student Enrollment",
      subtitle: "Step 2 of 4: Category Selection",
    },
    3: {
      title: "Student Enrollment",
      subtitle: "Step 3 of 4: Document Verification",
    },
    4: {
      title: "Student Enrollment",
      subtitle: "Step 4 of 4: Payment",
    },
  };

  const { title, subtitle } = titles[state.currentStep];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {state.currentStep === 1 ? (
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#2563eb]">
              <span className="text-lg font-bold">DSAS</span>
              <span className="text-sm text-slate-500">Student Registration</span>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
            Cancel
          </Link>
        </header>
      ) : (
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-[#2563eb] hover:underline"
            >
              ← Exit Enrollment
            </Link>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">
              {title}
            </h1>
            <p className="mt-1 text-slate-600">{subtitle}</p>
          </div>
          {state.currentStep >= 2 && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Registration Fee</p>
              <p className="text-xl font-bold text-[#2563eb]">
                ETB {formatEtb(REGISTRATION_FEE)}
              </p>
            </div>
          )}
        </header>
      )}

      {state.currentStep === 1 && (
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#0f172a]">
            {title}
          </h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </div>
      )}

      <div className="mb-10">
        <EnrollmentStepper
          currentStep={state.currentStep}
          variant={state.currentStep === 1 ? "profile" : "enrollment"}
          stepValidity={stepValidity}
        />
      </div>

      {state.currentStep === 1 && (
        <ProfileStep onContinue={() => setStep(2)} />
      )}
      {state.currentStep === 2 && (
        <CategoryStep
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}
      {state.currentStep === 3 && (
        <DocumentsStep
          onBack={() => setStep(2)}
          onContinue={() => setStep(4)}
        />
      )}
      {state.currentStep === 4 && (
        <PaymentStep onBack={() => setStep(3)} />
      )}
    </div>
  );
}
