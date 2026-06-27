"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Calendar, Mail, MapPin, Phone, User } from "lucide-react";

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
  const { formData, updateFormData, draftLoaded } = useEnrollment();

  if (!draftLoaded) {
    return (
      <div className="flex justify-center py-20 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <ProfileStepForm
      key={JSON.stringify(formData)}
      formData={formData}
      onContinue={onContinue}
      updateFormData={updateFormData}
    />
  );
}

function ProfileStepForm({
  formData,
  onContinue,
  updateFormData,
}: {
  formData: ProfileStepValues;
  onContinue: () => void;
  updateFormData: (data: Partial<ProfileStepValues>) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileStepValues>({
    resolver: zodResolver(profileStepSchema),
    defaultValues: formData,
  });

  const onSubmit = (data: ProfileStepValues) => {
    updateFormData(data);
    onContinue();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="font-serif text-xl font-bold text-[#0f172a]">
          Personal Information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="First Name" error={errors.firstName?.message} required>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                {...register("firstName")}
                placeholder="e.g. Abebe"
                className={cn("pl-10", fieldClass(errors.firstName))}
              />
            </div>
          </Field>

          <Field label="Last Name" error={errors.lastName?.message} required>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                {...register("lastName")}
                placeholder="e.g. Tadesse"
                className={cn("pl-10", fieldClass(errors.lastName))}
              />
            </div>
          </Field>

          <Field label="Email Address" error={errors.email?.message} required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                {...register("email")}
                type="email"
                placeholder="e.g. abebe@example.com"
                className={cn("pl-10", fieldClass(errors.email))}
              />
            </div>
          </Field>

          <Field label="Phone Number" error={errors.phone?.message} required>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                {...register("phone")}
                placeholder="0912345678"
                className={cn("pl-10", fieldClass(errors.phone))}
              />
            </div>
          </Field>

          <Field label="Date of Birth" error={errors.dateOfBirth?.message} required>
            <div className="relative">
              <Input
                {...register("dateOfBirth")}
                type="date"
                className={cn("pr-10", fieldClass(errors.dateOfBirth))}
              />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </Field>
        </div>

        <h2 className="mt-10 flex items-center gap-2 font-serif text-xl font-bold text-[#0f172a]">
          <MapPin className="h-5 w-5" />
          Address
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-1">
          <Field label="Address" error={errors.address?.message} required>
            <Input
              {...register("address")}
              placeholder="Street address, city, postal code"
              className={fieldClass(errors.address)}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
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
  required,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function fieldClass(error: unknown) {
  return cn(Boolean(error) && "border-red-500");
}
