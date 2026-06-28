"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  User,
  Hash,
  MapPin,
  Droplets,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Gauge,
  Ban,
  Receipt,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStudent, getStudentInvoices, getStudentAttendance, getStudentLmsProgress, type Student, type StudentInvoice, type AttendanceLog, type LmsProgress } from "@/lib/api";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "invoices" | "attendance" | "lms";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  registered: { label: "Registered", variant: "secondary" },
  theory_in_progress: { label: "Theory in Progress", variant: "warning" },
  practical_in_progress: { label: "Practical in Progress", variant: "warning" },
  exam_eligible: { label: "Exam Eligible", variant: "success" },
  graduated: { label: "Graduated", variant: "default" },
};

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "invoices", label: "Invoices", icon: Receipt },
  { key: "attendance", label: "Attendance", icon: Clock },
  { key: "lms", label: "LMS Progress", icon: BarChart3 },
];

export default function StudentDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [lmsProgress, setLmsProgress] = useState<LmsProgress | null>(null);
  const [lmsLoading, setLmsLoading] = useState(false);
  const invoicesFetched = useRef(false);
  const attendanceFetched = useRef(false);
  const lmsFetched = useRef(false);

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

  useEffect(() => {
    if (activeTab !== "invoices" || invoicesFetched.current) return;
    invoicesFetched.current = true;
    getStudentInvoices(id).then((res) => {
      if (res.success && res.data) setInvoices(res.data);
      setInvoicesLoading(false);
    });
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== "attendance" || attendanceFetched.current) return;
    attendanceFetched.current = true;
    getStudentAttendance(id).then((res) => {
      if (res.success && res.data) setAttendance(res.data);
      setAttendanceLoading(false);
    });
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== "lms" || lmsFetched.current) return;
    lmsFetched.current = true;
    getStudentLmsProgress(id).then((res) => {
      if (res.success && res.data) setLmsProgress(res.data);
      setLmsLoading(false);
    });
  }, [activeTab, id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
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

  const statusInfo = statusLabels[student.status] ?? { label: student.status, variant: "secondary" as const };
  const initials = [student.first_name, student.last_name].map((n) => n?.charAt(0).toUpperCase()).join("");

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/students" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Link>

      {/* Profile Header */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-bold text-[#0f172a]">
                  {student.first_name} {student.middle_name} {student.last_name}
                </h1>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">Student ID: {student.student_id}</p>
            </div>
          </div>
          <Button asChild className="bg-[#2563eb] hover:bg-[#1d4ed8]">
            <Link href={`/students/${student.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit Student
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <Hash className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Document ID:</span>
            <span className="font-medium text-[#0f172a]">{student.document_id}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">DOB:</span>
            <span className="font-medium text-[#0f172a]">{student.date_of_birth}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Blood Type:</span>
            <span className="font-medium text-[#0f172a]">{student.blood_type}</span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Address:</span>
            <span className="font-medium text-[#0f172a]">
              {student.address}, H.No {student.house_number}
              {student.kebele ? `, Kebele ${student.kebele}` : ""}, Woreda {student.woreda}
              {student.subcity ? `, ${student.subcity}` : ""}, {student.city}
            </span>
          </div>
        </div>

        {/* Penalty banner */}
        {student.under_penalty && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <Ban className="h-4 w-4 flex-shrink-0" />
            Under penalty until {student.penalty_end_date ? new Date(student.penalty_end_date).toLocaleDateString() : "N/A"}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-[#2563eb] text-[#2563eb]"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <GraduationCap className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-1 text-xs text-slate-500">Theory Days</p>
                <p className="text-xl font-bold text-[#0f172a]">{student.theory_days_completed}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <Gauge className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-1 text-xs text-slate-500">Mock Test</p>
                <p className="text-xl font-bold text-[#0f172a]">{student.mock_test_score}%</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <Clock className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-1 text-xs text-slate-500">Practical Days</p>
                <p className="text-xl font-bold text-[#0f172a]">{student.practical_days_completed}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Verification:</span>
              {student.verified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Created: {new Date(student.created_at).toLocaleString()} &middot; Updated: {new Date(student.updated_at).toLocaleString()}
            </div>
          </div>
        )}

        {activeTab === "invoices" && (
          <div>
            {invoicesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-slate-200" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <p className="py-8 text-center text-slate-400">No invoices found.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0 transition-colors hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{inv.invoice_number}</td>
                          <td className="px-4 py-3 text-slate-600">{inv.invoice_type}</td>
                          <td className="px-4 py-3 font-medium text-[#0f172a]">{inv.amount.toLocaleString()} ETB</td>
                          <td className="px-4 py-3">
                            <Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "destructive" : "warning"}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div>
            {attendanceLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-slate-200" />
                ))}
              </div>
            ) : attendance.length === 0 ? (
              <p className="py-8 text-center text-slate-400">No attendance records found.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Phase</th>
                        <th className="px-4 py-3">Present</th>
                        <th className="px-4 py-3">Instructor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 transition-colors hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{new Date(log.attendance_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 capitalize text-slate-600">{log.phase}</td>
                          <td className="px-4 py-3">
                            <Badge variant={log.present ? "success" : "destructive"}>
                              {log.present ? "Present" : "Absent"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{log.instructor_name || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "lms" && (
          <div>
            {lmsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-slate-200" />
                ))}
              </div>
            ) : !lmsProgress ? (
              <p className="py-8 text-center text-slate-400">No LMS progress data found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Theory Progress</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a]">{lmsProgress.theory_percentage}%</p>
                  <Badge variant={lmsProgress.theory_completed ? "success" : "warning"} className="mt-2">
                    {lmsProgress.theory_completed ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Practical Progress</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a]">{lmsProgress.practical_percentage}%</p>
                  <Badge variant={lmsProgress.practical_completed ? "success" : "warning"} className="mt-2">
                    {lmsProgress.practical_completed ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Mock Test Status</p>
                  <p className="mt-1 text-lg font-semibold text-[#0f172a] capitalize">{lmsProgress.mock_test_status}</p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Next Milestone</p>
                  <p className="mt-1 text-lg font-semibold text-[#0f172a] capitalize">{lmsProgress.next_milestone}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
