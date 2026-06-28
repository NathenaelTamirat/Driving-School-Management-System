"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Users, DollarSign, CalendarCheck, FileText, Search, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { firstError, getStudents, getInvoices, markInvoicePaid, type Student, type Invoice } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("driving_school_token") : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function ClerkPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [examStudent, setExamStudent] = useState("");
  const [examType, setExamType] = useState("theory");
  const [examDate, setExamDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([getStudents(), getInvoices()]).then(([sRes, iRes]) => {
      if (!sRes.success) setError(firstError(sRes.errors) || "Failed to load students");
      if (!iRes.success) setError(firstError(iRes.errors) || "Failed to load invoices");
      if (sRes.success && sRes.data) {
        const data = typeof sRes.data === "object" && "data" in sRes.data ? (sRes.data as any).data : sRes.data;
        setStudents(Array.isArray(data) ? data : []);
      }
      if (iRes.success && iRes.data) {
        const data = typeof iRes.data === "object" && "data" in iRes.data ? (iRes.data as any).data : iRes.data;
        setInvoices(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }).catch(() => {
      setError("Network error. Please check your connection.");
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter((s) =>
      s.student_id.toLowerCase().includes(q) || s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q),
    );
  }, [students, search]);

  const pendingInvoices = useMemo(() => invoices.filter((i) => i.status === "pending"), [invoices]);

  const handleMarkPaid = async (id: number) => {
    setError(null);
    try {
      const res = await markInvoicePaid(id);
      if (!res.success) setError(firstError(res.errors) || "Failed to mark invoice paid");
      fetchData();
    } catch {
      setError("Network error. Please check your connection.");
    }
  };

  const handleCreateExamBooking = async () => {
    if (!examStudent || !examDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/students/${examStudent}/exam_bookings`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ exam_booking: { exam_type: examType, scheduled_date: examDate } }),
      });
      const json = await res.json();
      if (!json.success) setError(firstError(json.errors) || "Failed to create exam booking");
    } catch {
      setError("Network error. Please check your connection.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Clerk Overview</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Clerk Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Student registration, invoice management, and daily operations.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90" size="lg">
          <Link href="/students/new">
            <Plus className="h-4 w-4" />
            New Student
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => { setError(null); fetchData(); }}>
            <RefreshCw className="mr-1 h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{students.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Pending Invoices</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{pendingInvoices.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Unverified Students</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{students.filter((s) => !s.verified).length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500">
              <Search className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <ActionButton href="/students/new" icon={Plus} label="New Student Registration" color="bg-blue-500" />
            <ActionButton href="/students" icon={Users} label="Manage Students" color="bg-violet-500" />
            <ActionButton href="/exam-bookings" icon={CalendarCheck} label="Exam Bookings" color="bg-amber-500" />
            <ActionButton href="/reports" icon={FileText} label="Financial Reports" color="bg-emerald-500" />
            <ActionButton href="/invoices" icon={DollarSign} label="All Invoices" color="bg-purple-500" />
            <ActionButton href="/attendance" icon={CalendarCheck} label="Log Attendance" color="bg-cyan-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending Invoices</CardTitle></CardHeader>
          <CardContent>
            {pendingInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invoices.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingInvoices.slice(0, 10).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <div className="flex-1">
                      <span className="text-muted-foreground">#{inv.id}</span>
                      <span className="ml-2 font-semibold">{inv.amount} ETB</span>
                      <Badge variant="warning" className="ml-2">{inv.milestone_type}</Badge>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(inv.id)}>
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Exam Booking</CardTitle></CardHeader>
        <CardContent className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Student</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={examStudent}
              onChange={(e) => setExamStudent(e.target.value)}
            >
              <option value="">Select student...</option>
              {students.filter((s) => s.status === "exam_eligible").map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.middle_name} ({s.student_id})</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="text-xs text-muted-foreground">Type</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
            >
              <option value="theory">Theory</option>
              <option value="practical">Practical</option>
            </select>
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
          <Button onClick={handleCreateExamBooking} disabled={!examStudent || !examDate || submitting}>
            Book
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Students</CardTitle></CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verification</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.student_id}</td>
                    <td className="px-4 py-3 font-medium">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "graduated" ? "success" : s.status === "exam_eligible" ? "default" : "secondary"}>
                        {s.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {s.verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionButton({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="font-medium text-foreground">{label}</span>
    </Link>
  );
}
