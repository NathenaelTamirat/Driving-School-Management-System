// Category selection step — the second page of the enrollment wizard.
// Displays the four license categories as selectable cards in a 2×2 grid.
// Each card shows the category icon, title, price, and requirement tags
// (minimum grade, medical cert, duration, prerequisite license). Selected
// cards are highlighted with a blue border and checkmark. The user cannot
// proceed without selecting a category (the "Continue" button is disabled).
// Icons are mapped via iconMap and requirementIconMap from lucide-react icons.

"use client";

import {
  Car,
  Check,
  Clock,
  GraduationCap,
  IdCard,
  Stethoscope,
  Truck,
  Bike,
  Bus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import {
  LICENSE_CATEGORIES,
  type LicenseCategory,
} from "@/lib/enrollment-types";
import { formatEtb } from "@/lib/enrollment-types";
import { cn } from "@/lib/utils";

type CategoryStepProps = {
  onBack: () => void;
  onContinue: () => void;
};

const iconMap = {
  car: Car,
  motorcycle: Bike,
  bus: Bus,
  truck: Truck,
};

const requirementIconMap = {
  graduation: GraduationCap,
  medical: Stethoscope,
  clock: Clock,
  license: IdCard,
};

export function CategoryStep({ onBack, onContinue }: CategoryStepProps) {
  const { state, setCategory } = useEnrollment();
  const selectedId = state.categoryId;

  const handleContinue = () => {
    if (!selectedId) return;
    onContinue();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="font-serif text-xl font-bold text-[#0f172a]">
          Select License Category
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {LICENSE_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedId === category.id}
              onSelect={() => setCategory(category.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          disabled={!selectedId}
          className="bg-[#2563eb] hover:bg-[#1d4ed8]"
          onClick={handleContinue}
        >
          Continue to Documents
        </Button>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  isSelected,
  onSelect,
}: {
  category: LicenseCategory;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = iconMap[category.icon];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative rounded-xl border-2 p-5 text-left transition-all",
        isSelected
          ? "border-[#2563eb] bg-[#eff6ff]"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <div className="absolute right-4 top-4">
        {isSelected ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-white">
            <Check className="h-4 w-4" />
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border-2 border-slate-300" />
        )}
      </div>

      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
          isSelected ? "bg-[#2563eb]/10 text-[#2563eb]" : "bg-slate-100 text-slate-500",
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="font-semibold text-[#0f172a]">{category.title}</h3>
      <p className="mt-1 text-lg font-bold text-[#2563eb]">
        {formatEtb(category.price)} ETB
      </p>

      <ul className="mt-4 space-y-2">
        {category.requirements.map((req) => {
          const ReqIcon = requirementIconMap[req.icon];
          return (
            <li
              key={req.text}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <ReqIcon className="h-4 w-4 shrink-0 text-slate-400" />
              {req.text}
            </li>
          );
        })}
      </ul>
    </button>
  );
}
