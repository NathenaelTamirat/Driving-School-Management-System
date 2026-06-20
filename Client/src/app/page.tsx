import { StudentForm } from "@/components/student-form";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Add New Student
        </h1>
        <p className="mt-2 text-muted-foreground">
          Register a new student in the driving school management system.
        </p>
      </div>
      <StudentForm />
    </div>
  );
}
