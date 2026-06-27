"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEnrollment } from "@/components/enrollment/enrollment-provider";
import { formatEtb } from "@/lib/enrollment-types";
import { cn } from "@/lib/utils";
import { getToken } from "@/lib/api";

type CategoryStepProps = {
  onBack: () => void;
  onContinue: () => void;
};

type ApiCategory = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  age_requirement: number;
  theory_hours: number;
  practical_hours: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function CategoryStep({ onBack, onContinue }: CategoryStepProps) {
  const { formData, updateFormData } = useEnrollment();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/license_categories`, {
          headers: { Authorization: `Bearer ${getToken()}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load categories");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchCategories();
    return () => controller.abort();
  }, []);

  const selectedId = formData.licenseCategory;

  const handleContinue = () => {
    if (!selectedId) return;
    onContinue();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading categories…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="font-serif text-xl font-bold text-[#0f172a]">
          Select License Category
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => updateFormData({ licenseCategory: category.id })}
              className={cn(
                "relative rounded-xl border-2 p-5 text-left transition-all",
                selectedId === category.id
                  ? "border-[#2563eb] bg-[#eff6ff]"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className="absolute right-4 top-4">
                {selectedId === category.id ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-white">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-slate-300" />
                )}
              </div>

              <h3 className="font-semibold text-[#0f172a]">{category.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{category.description}</p>
              <p className="mt-2 text-lg font-bold text-[#2563eb]">
                {formatEtb(category.price)} {category.currency}
              </p>

              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                <li>Min. age: {category.age_requirement}</li>
                <li>{category.theory_hours}h theory / {category.practical_hours}h practical</li>
              </ul>
            </button>
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
