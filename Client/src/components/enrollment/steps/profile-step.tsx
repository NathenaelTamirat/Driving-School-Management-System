"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  profileStepSchema,
  type ProfileStepValues,
} from "@/lib/enrollment-validations";
import { BLOOD_TYPE_OPTIONS } from "@/lib/validations";
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileStepValues>({
    resolver: zodResolver(profileStepSchema),
    defaultValues: profile,
  });

  const watchedBloodType = watch("bloodType");

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
          <Field label="First Name (English)" error={errors.firstNameEn?.message} required>
            <Input
              {...register("firstNameEn")}
              placeholder="e.g. Abebe"
              className={fieldClass(errors.firstNameEn)}
            />
          </Field>
          <Field label="Father's Name (English)" error={errors.fatherNameEn?.message} required>
            <Input
              {...register("fatherNameEn")}
              placeholder="e.g. Kebede"
              className={fieldClass(errors.fatherNameEn)}
            />
          </Field>
          <Field label="Grandfather's Name (English)" error={errors.lastNameEn?.message} required>
            <Input
              {...register("lastNameEn")}
              placeholder="e.g. Tadesse"
              className={fieldClass(errors.lastNameEn)}
            />
          </Field>

          <Field label="Phone Number" error={errors.phone?.message} required>
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

          <Field label="Date of Birth (EC)" error={errors.dateOfBirthEc?.message} required>
            <div className="relative">
              <Input
                {...register("dateOfBirthEc")}
                type="date"
                className={cn("pr-10", fieldClass(errors.dateOfBirthEc))}
              />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </Field>

          <Field label="Blood Type" error={errors.bloodType?.message} required>
            <Select
              value={watchedBloodType}
              onValueChange={(value) =>
                setValue("bloodType", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className={fieldClass(errors.bloodType)}>
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
          </Field>
        </div>

        <h2 className="mt-10 flex items-center gap-2 font-serif text-xl font-bold text-[#0f172a]">
          <MapPin className="h-5 w-5" />
          Address Information
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Address" error={errors.address?.message} required className="sm:col-span-2">
            <Input
              {...register("address")}
              placeholder="Street address"
              className={fieldClass(errors.address)}
            />
          </Field>
          <Field label="House Number" error={errors.houseNumber?.message} required>
            <Input
              {...register("houseNumber")}
              placeholder="House number"
              className={fieldClass(errors.houseNumber)}
            />
          </Field>
          <Field label="Kebele" error={errors.kebele?.message}>
            <Input
              {...register("kebele")}
              placeholder="Kebele"
              className={fieldClass(errors.kebele)}
            />
          </Field>
          <Field label="Woreda" error={errors.woreda?.message} required>
            <Input
              {...register("woreda")}
              placeholder="Woreda"
              className={fieldClass(errors.woreda)}
            />
          </Field>
          <Field label="Subcity" error={errors.subcity?.message}>
            <Input
              {...register("subcity")}
              placeholder="Subcity"
              className={fieldClass(errors.subcity)}
            />
          </Field>
          <Field label="City / Town" error={errors.city?.message} required>
            <Input
              {...register("city")}
              placeholder="City or town"
              className={fieldClass(errors.city)}
            />
          </Field>
        </div>

        <h2 className="mt-10 font-serif text-xl font-bold text-[#0f172a]">
          Emergency Contact
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Contact Name" error={errors.emergencyContactName?.message} required>
            <Input
              {...register("emergencyContactName")}
              placeholder="Full Name"
              className={fieldClass(errors.emergencyContactName)}
            />
          </Field>
          <Field label="Contact Phone" error={errors.emergencyContactPhone?.message} required>
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
