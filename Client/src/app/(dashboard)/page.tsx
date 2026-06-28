"use client";

import { useEffect, useState, useMemo, startTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  Layers,
  BookOpen,
  GraduationCap,
  ClipboardList,
  FileText,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStudents, getBatches, type Student, type Batch } from "@/lib/api";
import { cn } from "@/lib/utils";

const statCards = [
  { label: "Total Students", key: "totalStudents" as const, icon: Users, color: "bg-blue-500" },
  { label: "Active Batches", key: "totalBatches" as const, icon: Layers, color: "bg-violet-500" },
  { label: "Currently Learning", key: "currentlyLearning" as const, icon: BookOpen, color: "bg-amber-500" },
  { label: "Graduated", key: "graduated" as const, icon: GraduationCap, color: "bg-emerald-500" },
];

const quickActions = [
  {
    label: "New Student Enrollment",
    description: "Register a new student into the program",
    href: "/students/new",
    icon: Plus,
    color: "bg-blue-500",
  },
  {
    label: "View All Students",
    description: "Browse, search, and manage student records",
    href: "/students",
    icon: ClipboardList,
    color: "bg-violet-500",
  },
  {
    label: "Exam Bookings",
    description: "Schedule and manage exam appointments",
    href: "/exam-bookings",
    icon: CalendarCheck,
    color: "bg-amber-500",
  },
  {
    label: "Reports",
    description: "View aggregate reports and analytics",
    href: "/reports",
    icon: FileText,
    color: "bg-emerald-500",
  },
];

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [sRes, bRes] = await Promise.all([getStudents(), getBatches()]);
    if (sRes.success && sRes.data) setStudents(sRes.data);
    if (bRes.success && bRes.data) setBatches(bRes.data);
    setLoading(false);
  };

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, []);

  const stats = useMemo(() => ({
    totalStudents: students.length,
    totalBatches: batches.length,
    currentlyLearning: students.filter((s) => s.status !== "graduated" && s.status !== "exam_eligible").length,
    graduated: students.filter((s) => s.status === "graduated").length,
    examReady: students.filter((s) => s.status === "exam_eligible").length,
    theoryInProgress: students.filter((s) => s.status === "theory_in_progress").length,
    practicalInProgress: students.filter((s) => s.status === "practical_in_progress").length,
  }), [students, batches]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of the Driving School Administration System
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90" size="lg">
          <Link href="/students/new">
            <Plus className="h-4 w-4" />
            New Student
          </Link>
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, key, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {loading ? (
                    <span className="inline-block h-6 w-12 animate-pulse rounded bg-muted-foreground/20" />
                  ) : (
                    stats[key]
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

      {/* Status Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student Status Overview */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-foreground">
            Student Status Overview
          </h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="inline-block h-4 w-32 animate-pulse rounded bg-muted-foreground/20" />
                  <span className="inline-block h-4 w-8 animate-pulse rounded bg-muted-foreground/20" />
                </div>
              ))
            ) : (
              <>
                <StatusRow
                  label="Registered"
                  count={students.filter((s) => s.status === "registered").length}
                  color="bg-slate-400"
                />
                <StatusRow
                  label="Theory in Progress"
                  count={stats.theoryInProgress}
                  color="bg-amber-400"
                />
                <StatusRow
                  label="Practical in Progress"
                  count={stats.practicalInProgress}
                  color="bg-orange-400"
                />
                <StatusRow
                  label="Exam Ready"
                  count={stats.examReady}
                  color="bg-blue-400"
                />
                <StatusRow
                  label="Graduated"
                  count={stats.graduated}
                  color="bg-emerald-400"
                />
                {students.filter((s) => s.under_penalty).length > 0 && (
                  <StatusRow
                    label="Under Penalty"
                    count={students.filter((s) => s.under_penalty).length}
                    color="bg-red-400"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-foreground">
            Quick Actions
          </h2>
          <div className="mt-4 grid gap-3">
            {quickActions.map(({ label, description, href, icon: Icon, color }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex items-center gap-4 rounded-lg border p-4 transition-colors",
                  href === "#"
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-accent",
                )}
                onClick={(e) => { if (href === "#") e.preventDefault(); }}
              >
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", color)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{count}</span>
    </div>
  );
}
