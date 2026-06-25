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
