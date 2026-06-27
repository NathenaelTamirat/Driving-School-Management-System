"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStudent, type Student } from "@/lib/api";
import { StudentForm } from "@/components/student-form";

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getStudent(id).then((res) => {
      if (res.success && res.data) {
        setStudent(res.data);
      } else {
        setError(res.error || "Failed to load student");
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500">{error || "Student not found"}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/students">Back to Students</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/students/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#0f172a]">
          Edit Student
        </h1>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="mb-2 text-xs text-amber-600">
          Note: The backend PATCH /api/v1/students/:id route may not be implemented yet.
          If the update fails, check that the backend students controller includes the <code>:update</code> action.
        </p>
        <StudentForm
          initialData={student}
          onSuccess={() => router.push(`/students/${id}`)}
        />
      </div>
    </div>
  );
}
