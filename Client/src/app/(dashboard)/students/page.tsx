// Students list page — the main data-browsing view of the dashboard.
// Fetches all students and batches on mount, then provides:
// 1. Four summary stat cards (Total, Batches, Learning, Graduated)
// 2. Search bar (by name or student ID)
// 3. Status filter dropdown (registered / theory / practical / exam-ready / graduated)
// 4. Verification filter (all / verified / unverified)
// 5. Sortable table columns (Student ID, Full Name, Status) with asc/desc toggle
// 6. Click-to-open StudentDetailModal for viewing / verifying individual records
//
// Uses skeleton loading placeholders (animate-pulse) for the stat cards and
// table rows while data is fetching. Empty state shows a contextual message
// depending on whether filters are active or the list is genuinely empty.

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Users, Layers, BookOpen, GraduationCap, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StudentDetailModal } from "@/components/student-detail-modal";
import { getStudents, getBatches, type Student, type Batch } from "@/lib/api";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "registered", label: "Registered" },
  { value: "theory_in_progress", label: "Theory in Progress" },
  { value: "practical_in_progress", label: "Practical in Progress" },
  { value: "exam_eligible", label: "Exam Eligible" },
  { value: "graduated", label: "Graduated" },
];

const statusBadge: Record<string, "secondary" | "warning" | "success" | "default"> = {
  registered: "secondary",
  theory_in_progress: "warning",
  practical_in_progress: "warning",
  exam_eligible: "success",
  graduated: "default",
};

const statusLabels: Record<string, string> = {
  registered: "Registered",
  theory_in_progress: "Theory",
  practical_in_progress: "Practical",
  exam_eligible: "Exam Ready",
  graduated: "Graduated",
};

type SortKey = "student_id" | "full_name" | "status";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("student_id");
  const [sortAsc, setSortAsc] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [sRes, bRes] = await Promise.all([getStudents(), getBatches()]);
    if (sRes.success && sRes.data) setStudents(sRes.data);
    if (bRes.success && bRes.data) setBatches(bRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    total: students.length,
    batches: batches.length,
    learning: students.filter((s) => s.status !== "graduated").length,
    graduated: students.filter((s) => s.status === "graduated").length,
  }), [students, batches]);

  const filtered = useMemo(() => {
    let list = [...students];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.student_id.toLowerCase().includes(q) ||
          s.first_name.toLowerCase().includes(q) ||
          s.middle_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q),
      );
    }
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    if (verifiedFilter === "verified") list = list.filter((s) => s.verified);
    if (verifiedFilter === "unverified") list = list.filter((s) => !s.verified);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "student_id") cmp = a.student_id.localeCompare(b.student_id);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else {
        const aName = `${a.first_name} ${a.middle_name} ${a.last_name}`;
        const bName = `${b.first_name} ${b.middle_name} ${b.last_name}`;
        cmp = aName.localeCompare(bName);
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [students, search, statusFilter, verifiedFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleVerified = (id: number) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, verified: true, verified_at: new Date().toISOString() } : s)));
  };

  const statCards = [
    { label: "Total Students", value: stats.total, icon: Users, color: "bg-blue-500" },
    { label: "Total Batches", value: stats.batches, icon: Layers, color: "bg-violet-500" },
    { label: "Currently Learning", value: stats.learning, icon: BookOpen, color: "bg-amber-500" },
    { label: "Graduated", value: stats.graduated, icon: GraduationCap, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0f172a]">Students</h1>
        <Button asChild className="bg-[#2563eb] hover:bg-[#1d4ed8]" size="lg">
          <Link href="/students/new">
            <Plus className="h-4 w-4" />
            New Student
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-[#0f172a]">
                  {loading ? (
                    <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-200" />
                  ) : (
                    value
                  )}
                </p>
              </div>
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", color)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">
                  <button onClick={() => toggleSort("student_id")} className="flex items-center gap-1 hover:text-[#0f172a]">
                    Student ID <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button onClick={() => toggleSort("full_name")} className="flex items-center gap-1 hover:text-[#0f172a]">
                    Full Name <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-[#0f172a]">
                    Status <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">License Category</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <span className="inline-block h-4 w-full animate-pulse rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    {search || statusFilter || verifiedFilter
                      ? "No students match your filters."
                      : "No students found."}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className="cursor-pointer border-b last:border-0 transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.student_id}</td>
                    <td className="px-4 py-3 font-medium text-[#0f172a]">
                      {s.first_name} {s.middle_name} {s.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[s.status] ?? "secondary"}>
                        {statusLabels[s.status] ?? s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {s.verified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Unverified</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">&mdash;</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          open={true}
          onClose={() => setSelectedStudent(null)}
          onVerified={handleVerified}
        />
      )}
    </div>
  );
}
