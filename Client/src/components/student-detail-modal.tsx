"use client";

import { useState } from "react";
import { X, CheckCircle, Clock, User, Hash, MapPin, Droplets, GraduationCap, Gauge, Ban } from "lucide-react";
import type { Student } from "@/lib/api";
import { updateStudent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Props = {
  student: Student;
  open: boolean;
  onClose: () => void;
  onVerified?: (id: number) => void;
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  registered: { label: "Registered", variant: "secondary" },
  theory_in_progress: { label: "Theory in Progress", variant: "warning" },
  practical_in_progress: { label: "Practical in Progress", variant: "warning" },
  exam_eligible: { label: "Exam Eligible", variant: "success" },
  graduated: { label: "Graduated", variant: "default" },
};

export function StudentDetailModal({ student, open, onClose, onVerified }: Props) {
  const [verifying, setVerifying] = useState(false);

  if (!open) return null;

  const handleVerify = async () => {
    setVerifying(true);
    const result = await updateStudent(student.id, { verified: true, verified_at: new Date().toISOString() });
    setVerifying(false);
    if (result.success) {
      toast.success("Student verified successfully");
      onVerified?.(student.id);
      onClose();
    } else {
      toast.error(result.error || "Failed to verify student");
    }
  };

  const statusInfo = statusLabels[student.status] ?? { label: student.status, variant: "secondary" as const };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-2xl border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-[#0f172a]">Student Details</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-[#0f172a]">
                {student.first_name} {student.middle_name} {student.last_name}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">Student ID: {student.student_id}</p>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Hash className="h-3.5 w-3.5" /> Document ID
              </span>
              <p className="font-medium text-[#0f172a]">{student.document_id}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-slate-500">
                <User className="h-3.5 w-3.5" /> Batch
              </span>
              <p className="font-medium text-[#0f172a]">Batch #{student.batch_id}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-slate-500">
                <CalendarIcon className="h-3.5 w-3.5" /> Date of Birth
              </span>
              <p className="font-medium text-[#0f172a]">{student.date_of_birth}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Droplets className="h-3.5 w-3.5" /> Blood Type
              </span>
              <p className="font-medium text-[#0f172a]">{student.blood_type}</p>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> Address
            </span>
            <p className="font-medium text-[#0f172a]">
              {student.address}, H.No {student.house_number}
              {student.kebele ? `, Kebele ${student.kebele}` : ""}, Woreda {student.woreda}
              {student.subcity ? `, ${student.subcity}` : ""}, {student.city}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <GraduationCap className="mx-auto h-4 w-4 text-slate-400" />
              <p className="mt-1 text-xs text-slate-500">Theory Days</p>
              <p className="text-lg font-bold text-[#0f172a]">{student.theory_days_completed}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <Gauge className="mx-auto h-4 w-4 text-slate-400" />
              <p className="mt-1 text-xs text-slate-500">Mock Test</p>
              <p className="text-lg font-bold text-[#0f172a]">{student.mock_test_score}%</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <Clock className="mx-auto h-4 w-4 text-slate-400" />
              <p className="mt-1 text-xs text-slate-500">Practical Days</p>
              <p className="text-lg font-bold text-[#0f172a]">{student.practical_days_completed}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle className="h-3.5 w-3.5" /> Verification
            </span>
            {student.verified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
          </div>

          {student.under_penalty && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <Ban className="h-4 w-4 flex-shrink-0" />
              Under penalty until {student.penalty_end_date ? new Date(student.penalty_end_date).toLocaleDateString() : "N/A"}
            </div>
          )}

          <div className="border-t pt-4 text-xs text-slate-400">
            Created: {new Date(student.created_at).toLocaleString()} &middot; Updated: {new Date(student.updated_at).toLocaleString()}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!student.verified && (
            <Button onClick={handleVerify} disabled={verifying} className="bg-emerald-600 hover:bg-emerald-700">
              {verifying ? "Verifying..." : "Verify Student"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
