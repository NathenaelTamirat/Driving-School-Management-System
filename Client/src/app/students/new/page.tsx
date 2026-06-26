// Full-screen new student enrollment page (outside the dashboard shell).
// Wraps the EnrollmentWizard in an EnrollmentProvider context, creating
// an isolated state container for the multi-step registration flow.
// The light grey background (bg-[#f4f6f9]) gives the wizard card a
// distinct visual separation from the rest of the app.

import { EnrollmentProvider } from "@/components/enrollment/enrollment-provider";
import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";

export default function NewStudentPage() {
  return (
    <EnrollmentProvider>
      <div className="min-h-screen bg-[#f4f6f9]">
        <EnrollmentWizard />
      </div>
    </EnrollmentProvider>
  );
}
