"use client";

import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Profile" },
  { number: 2, label: "Category" },
  { number: 3, label: "Documents" },
  { number: 4, label: "Payment" },
];

type EnrollmentStepperProps = {
  currentStep: number;
  variant?: "profile" | "enrollment";
  stepValidity?: Record<number, boolean>;
};

export function EnrollmentStepper({
  currentStep,
  variant = "enrollment",
  stepValidity = {},
}: EnrollmentStepperProps) {
  const labels =
    variant === "profile"
      ? STEPS
      : [
          { number: 1, label: "Student Info" },
          { number: 2, label: "Category" },
          { number: 3, label: "Documents" },
          { number: 4, label: "Payment" },
        ];

  return (
    <div className="flex items-center justify-center gap-0">
      {labels.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isValid = stepValidity[step.number] !== false;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  isCompleted && isValid && "bg-[#2563eb] text-white",
                  isCompleted && !isValid && "bg-amber-500 text-white",
                  isActive && "bg-[#2563eb] text-white",
                  !isCompleted &&
                    !isActive &&
                    "border-2 border-slate-200 bg-white text-slate-400",
                )}
              >
                {isCompleted && isValid && <Check className="h-5 w-5" />}
                {isCompleted && !isValid && <AlertCircle className="h-5 w-5" />}
                {!isCompleted && step.number}
              </div>
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  isActive || (isCompleted && isValid)
                    ? "text-[#2563eb]"
                    : isCompleted && !isValid
                      ? "text-amber-600"
                      : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < labels.length - 1 && (
              <div
                className={cn(
                  "mx-3 mb-6 h-0.5 w-12 sm:w-20",
                  currentStep > step.number ? "bg-[#2563eb]" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
