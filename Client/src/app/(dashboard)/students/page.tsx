"use client";

import { useEffect, useState, useMemo, startTransition } from "react";
import Link from "next/link";
import { Plus, Search, Users, Layers, BookOpen, GraduationCap, ChevronLeft, ChevronRight, Eye, Pencil, ArrowUpDown, AlertCircle, RefreshCw } from "lucide-react";
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
import { firstError, getStudents, getBatches, type Student, type Batch } from "@/lib/api";
import { DataTable, type Column } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "registered", label: "Registered" },
  { value: "theory_in_progress", label: "Theory in Progress" },
  { value: "practical_in_progress", label: "Practical in Progress" },
  { value: "exam_eligible", label: "Exam Eligible" },
  { value: "graduated", label: "Graduated" },
];

const statusBadgeVariant: Record<string, "secondary" | "warning" | "success" | "default"> = {
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

const LICENSE_CATEGORY_LABELS: Record<string, string> = {
  auto: "Auto (B)",
  motor: "Motorcycle (A)",
  public1: "Public-1 (C1)",
  drycargo1: "Dry Cargo-1 (C)",
};

type SortKey = "student_id" | "full_name" | "status";

export default function StudentsPage() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("student_id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const perPage = 20;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, bRes] = await Promise.all([getStudents(), getBatches()]);
      if (sRes.success && sRes.data) {
        const data = typeof sRes.data === "object" && "data" in sRes.data ? (sRes.data as any).data : sRes.data;
        setAllStudents(Array.isArray(data) ? data : []);
      } else {
        setError(firstError(sRes.errors) || "Failed to load students");
      }
      if (bRes.success && bRes.data) {
        const data = typeof bRes.data === "object" && "data" in bRes.data ? (bRes.data as any).data : bRes.data;
        setBatches(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { startTransition(() => { fetchData(); }); }, []);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = allStudents;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.student_id.toLowerCase().includes(q) ||
          s.first_name.toLowerCase().includes(q) ||
          s.middle_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q),
      );
    }
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [allStudents, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  const stats = useMemo(() => ({
    total: allStudents.length,
    batches: batches.length,
    learning: allStudents.filter((s) => s.status !== "graduated").length,
    graduated: allStudents.filter((s) => s.status === "graduated").length,
  }), [allStudents, batches]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const columns: Column<Student>[] = useMemo(() => [
    {
      header: "Student ID",
      accessorKey: "student_id",
      className: "font-mono text-xs text-slate-600",
    },
    {
      header: "Name",
      cell: (s) => (
        <span className="font-medium text-[#0f172a]">
          {s.first_name} {s.middle_name} {s.last_name}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (s) => (
        <Badge variant={statusBadgeVariant[s.status] ?? "secondary"}>
          {statusLabels[s.status] ?? s.status}
        </Badge>
      ),
    },
    {
      header: "Enrollment Date",
      cell: (s) => (
        <span className="text-slate-500">
          {new Date(s.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (s) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/students/${s.id}`}>
              <Eye className="h-4 w-4" />
              View
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/students/${s.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      ),
    },
  ], []);

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
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

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
              ) : filtered.length === 0 && !error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    {search || statusFilter || verifiedFilter
                      ? "No students match your filters."
                      : "No students found."}
                  </td>
                </tr>
              ) : filtered.length === 0 && error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    Failed to load data. Click Retry above.
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
                      <Badge variant={statusBadgeVariant[s.status] ?? "secondary"}>
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
                    <td className="px-4 py-3 text-slate-500">
                      {s.license_category
                        ? LICENSE_CATEGORY_LABELS[s.license_category] ?? s.license_category
                        : "\u2014"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal (quick-view from other parts of the app) */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          open={true}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
