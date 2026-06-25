"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  Info,
  Loader2,
  LogIn,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  calculateEnrollmentTotal,
  formatEtb,
  getCategoryById,
  REGISTRATION_FEE,
} from "@/lib/enrollment-types";
import { createStudentFromEnrollment } from "@/lib/api";

type PaymentStepProps = {
  onBack: () => void;
};

export function PaymentStep({ onBack }: PaymentStepProps) {
  const {
    state,
    setPaymentPhone,
    setPaymentRequestSent,
    clearDraft,
    resetEnrollment,
  } = useEnrollment();
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [finished, setFinished] = useState(false);

  const category = getCategoryById(state.categoryId);
  const total = calculateEnrollmentTotal(state.categoryId);
  const studentDisplayName = `${state.profile.firstNameEn} ${state.profile.fatherNameEn} ${state.profile.lastNameEn}`;

  useEffect(() => {
    if (!state.paymentPhone && state.profile.phone) {
      const digits = state.profile.phone.replace(/\D/g, "");
      setPaymentPhone(digits.length >= 9 ? `+251 ${digits}` : "");
    }
  }, [state.paymentPhone, state.profile.phone, setPaymentPhone]);

  const handleSendPaymentRequest = async () => {
    if (!state.paymentPhone.trim()) {
      toast.error("Enter a customer phone number");
      return;
    }
    setIsSendingRequest(true);
    await new Promise((r) => setTimeout(r, 1200));
    setPaymentRequestSent(true);
    setIsSendingRequest(false);
    toast.success("Payment request sent to customer phone");
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      const result = await createStudentFromEnrollment(state);
      if (result.success) {
        clearDraft();
        setFinished(true);
        toast.success("Enrollment completed successfully!");
      } else {
        toast.warning(
          result.error ||
            "Could not sync with server — enrollment saved locally in this session",
        );
        clearDraft();
        setFinished(true);
      }
    } catch {
      toast.warning(
        "Server unavailable — enrollment completed on frontend only",
      );
      clearDraft();
      setFinished(true);
    } finally {
      setIsFinishing(false);
    }
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="mt-6 font-serif text-2xl font-bold text-[#0f172a]">
          Enrollment Complete
        </h2>
        <p className="mt-2 max-w-md text-slate-600">
          {studentDisplayName} has been registered for{" "}
          {category?.title ?? "the selected category"}.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild variant="outline">
            <Link href="/">Back to Dashboard</Link>
          </Button>
          <Button
            className="bg-[#2563eb] hover:bg-[#1d4ed8]"
            onClick={() => {
              resetEnrollment();
              window.location.href = "/students/new";
            }}
          >
            Register Another Student
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-[#0f172a]">
              Telebirr Payment
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scan to Pay
                </p>
                <div className="mt-3 flex aspect-square max-h-48 items-center justify-center rounded-lg bg-slate-100">
                  <div className="grid grid-cols-8 gap-0.5 p-4">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={
                          (i + Math.floor(i / 8)) % 2 === 0
                            ? "h-2 w-2 bg-[#0f172a]"
                            : "h-2 w-2 bg-white"
                        }
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-center text-sm text-slate-600">
                  Open Telebirr app and scan the code to pay.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Direct Push
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="payment-phone">Customer Phone Number</Label>
                    <Input
                      id="payment-phone"
                      value={state.paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="+251 911 234 567"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
                    onClick={handleSendPaymentRequest}
                    disabled={isSendingRequest || state.paymentRequestSent}
                  >
                    {isSendingRequest ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    {state.paymentRequestSent
                      ? "Request Sent"
                      : "Send Payment Request"}
                  </Button>
                  <p className="text-xs text-slate-500">
                    A payment prompt will appear on the customer&apos;s phone
                    immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 rounded-lg bg-[#eff6ff] p-4 text-sm text-[#1e40af]">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>Important Note:</strong> Payment must be completed
                before the student profile is activated in the ERTA system.
                Profiles in &apos;Pending Payment&apos; status will be purged
                after 48 hours.
              </p>
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
              {category && (
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-medium">Theory Class</p>
                    <p className="text-xs text-slate-500">
                      {category.subtitle}
                    </p>
                  </div>
                  <p className="font-medium">{formatEtb(category.price)} ETB</p>
                </div>
              )}
            </div>

            <div className="my-4 border-t border-slate-200" />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Due</span>
              <span className="text-lg font-bold text-[#2563eb]">
                {formatEtb(total)} ETB
              </span>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <User className="h-3.5 w-3.5" />
                Student Details
              </div>
              <p className="mt-2 font-medium text-[#0f172a]">
                {studentDisplayName}
              </p>
              <p className="text-sm text-slate-500">
                +251 {state.profile.phone.replace(/\D/g, "")}
              </p>
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-500">
              <p className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure 256-bit Encrypted Transaction
              </p>
              <p>ERTA Authorized Training Center</p>
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
          type="button"
          className="bg-[#0f2744] hover:bg-[#0f2744]/90"
          onClick={handleFinish}
          disabled={isFinishing}
        >
          {isFinishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Finish Enrollment
        </Button>
      </div>
    </div>
  );
}
