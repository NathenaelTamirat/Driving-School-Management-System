"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Calendar } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  profileStepSchema,
  type ProfileStepValues,
} from "@/lib/enrollment-validations";
import { cn } from "@/lib/utils";

type ProfileStepProps = {
  onContinue: () => void;
};

export function ProfileStep({ onContinue }: ProfileStepProps) {
  const { state, updateProfile, saveDraft, draftLoaded } = useEnrollment();

  if (!draftLoaded) {
    return (
      <div className="flex justify-center py-20 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <ProfileStepForm
      key={JSON.stringify(state.profile)}
      profile={state.profile}
      onContinue={onContinue}
      updateProfile={updateProfile}
      saveDraft={saveDraft}
    />
  );
}

function ProfileStepForm({
  profile,
  onContinue,
  updateProfile,
  saveDraft,
}: {
  profile: ProfileStepValues;
  onContinue: () => void;
  updateProfile: (profile: Partial<ProfileStepValues>) => void;
  saveDraft: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileStepValues>({
    resolver: zodResolver(profileStepSchema),
    defaultValues: profile,
  });

  const onSubmit = (data: ProfileStepValues) => {
    updateProfile(data);
    onContinue();
  };

  const handleSaveDraft = () => {
    handleSubmit((data) => {
      updateProfile(data);
      saveDraft();
      toast.success("Draft saved locally");
    })();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="font-serif text-xl font-bold text-[#0f172a]">
          Personal Information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="First Name (English)"
            error={errors.firstNameEn?.message}
          >
            <Input
              {...register("firstNameEn")}
              placeholder="e.g. Abebe"
              className={fieldClass(errors.firstNameEn)}
            />
          </Field>
          <Field
            label="Father's Name (English)"
            error={errors.fatherNameEn?.message}
          >
            <Input
              {...register("fatherNameEn")}
              placeholder="e.g. Kebede"
              className={fieldClass(errors.fatherNameEn)}
            />
          </Field>
          <Field
            label="First Name (Amharic)"
            error={errors.firstNameAm?.message}
          >
            <Input
              {...register("firstNameAm")}
              placeholder="e.g. አበበ"
              className={fieldClass(errors.firstNameAm)}
            />
          </Field>
          <Field
            label="Father's Name (Amharic)"
            error={errors.fatherNameAm?.message}
          >
            <Input
              {...register("fatherNameAm")}
              placeholder="e.g. ከበደ"
              className={fieldClass(errors.fatherNameAm)}
            />
          </Field>

          <Field label="Phone Number" error={errors.phone?.message}>
            <div className="flex overflow-hidden rounded-md border border-input bg-[#f8fafc]">
              <span className="flex items-center border-r border-input bg-slate-50 px-3 text-sm text-slate-600">
                +251
              </span>
              <Input
                {...register("phone")}
                placeholder="911 23 45 67"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>
          </Field>

          <Field label="Date of Birth (EC)" error={errors.dateOfBirthEc?.message}>
            <div className="relative">
              <Input
                {...register("dateOfBirthEc")}
                type="date"
                className={cn("pr-10", fieldClass(errors.dateOfBirthEc))}
              />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </Field>
        </div>

        <h2 className="mt-10 font-serif text-xl font-bold text-[#0f172a]">
          Emergency Contact
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Contact Name" error={errors.emergencyContactName?.message}>
            <Input
              {...register("emergencyContactName")}
              placeholder="Full Name"
              className={fieldClass(errors.emergencyContactName)}
            />
          </Field>
          <Field
            label="Contact Phone"
            error={errors.emergencyContactPhone?.message}
          >
            <Input
              {...register("emergencyContactPhone")}
              placeholder="Phone Number"
              className={fieldClass(errors.emergencyContactPhone)}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Button type="button" variant="outline" onClick={handleSaveDraft}>
          Save Draft
        </Button>
        <Button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8]">
          Continue to Category
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function fieldClass(error: unknown) {
  return cn(error && "border-red-500");
}
