import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EnrollmentProvider } from "@/components/enrollment/enrollment-provider";
import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";

export default function NewStudentPage() {
  return (
    <EnrollmentProvider>
      <div className="min-h-screen bg-[#f4f6f9]">
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
          <Link
            href="/students"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </Link>
        </div>
        <EnrollmentWizard />
      </div>
    </EnrollmentProvider>
  );
}
