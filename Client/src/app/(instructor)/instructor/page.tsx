"use client";

import { useEffect, useState, useMemo } from "react";
import { BookOpen, Users, ClipboardCheck, DollarSign, CheckCircle, AlertCircle, CalendarCheck, ClipboardList } from "lucide-react";
import { getStudents, createAttendanceLog, createMockTest, getPayrollEntries, type Student, type PayrollEntry } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  paid: "bg-emerald-100 text-emerald-800",
};

export default function InstructorPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceStudent, setAttendanceStudent] = useState("");
  const [attendancePhase, setAttendancePhase] = useState("theory");
  const [attendancePresent, setAttendancePresent] = useState(true);
  const [mockStudent, setMockStudent] = useState("");
  const [mockScore, setMockScore] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getStudents(), getPayrollEntries()]).then(([sRes, pRes]) => {
      if (sRes.success && sRes.data) {
        const data = typeof sRes.data === "object" && "data" in sRes.data ? (sRes.data as any).data : sRes.data;
        setStudents(Array.isArray(data) ? data : []);
      }
      if (pRes.success && pRes.data) {
        const data = typeof pRes.data === "object" && "data" in pRes.data ? (pRes.data as any).data : pRes.data;
        setPayrollEntries(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    });
  }, []);

  const myStudents = useMemo(
    () => students.filter((s) => ["theory_in_progress", "practical_in_progress", "exam_eligible"].includes(s.status)),
    [students],
  );

  const handleAttendanceSubmit = async () => {
    if (!attendanceStudent) return;
    setSubmitting(true);
    await createAttendanceLog(Number(attendanceStudent), {
      phase: attendancePhase,
      attendance_date: new Date().toISOString().split("T")[0],
      present: attendancePresent,
    });
    setSubmitting(false);
  };

  const handleMockSubmit = async () => {
    if (!mockStudent || !mockScore) return;
    setSubmitting(true);
    await createMockTest(Number(mockStudent), {
      score: Number(mockScore),
      test_date: new Date().toISOString().split("T")[0],
    });
    setMockScore("");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Instructor Overview</h1>
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
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Instructor Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Student progress tracking, attendance, mock tests, and payroll.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Active Students</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{myStudents.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Theory in Progress</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{myStudents.filter((s) => s.status === "theory_in_progress").length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Practical in Progress</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{myStudents.filter((s) => s.status === "practical_in_progress").length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Log Attendance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={attendanceStudent} onValueChange={setAttendanceStudent}>
              <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
              <SelectContent>
                {myStudents.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.middle_name} ({s.student_id})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={attendancePhase} onValueChange={setAttendancePhase}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="theory">Theory</SelectItem>
                <SelectItem value="practical">Practical</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant={attendancePresent ? "default" : "outline"} size="sm" onClick={() => setAttendancePresent(true)}>Present</Button>
              <Button variant={!attendancePresent ? "default" : "outline"} size="sm" onClick={() => setAttendancePresent(false)}>Absent</Button>
            </div>
            <Button onClick={handleAttendanceSubmit} disabled={!attendanceStudent || submitting}>
              <CalendarCheck className="mr-2 h-4 w-4" />
              Log Attendance
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Record Mock Test</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={mockStudent} onValueChange={setMockStudent}>
              <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
              <SelectContent>
                {myStudents.filter((s) => s.status === "theory_in_progress").map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.middle_name} ({s.student_id})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" min="0" max="100" placeholder="Score (0-100, pass > 37)" value={mockScore} onChange={(e) => setMockScore(e.target.value)} />
            <Button onClick={handleMockSubmit} disabled={!mockStudent || !mockScore || submitting}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Record Score
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Students</CardTitle>
        </CardHeader>
        <CardContent>
          {myStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active students assigned.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Theory Days</th>
                    <th className="px-4 py-3">Practical Days</th>
                    <th className="px-4 py-3">Mock Score</th>
                  </tr>
                </thead>
                <tbody>
                  {myStudents.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.student_id}</td>
                      <td className="px-4 py-3 font-medium">{s.first_name} {s.last_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === "exam_eligible" ? "success" : "secondary"}>
                          {s.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{s.theory_days_completed}</td>
                      <td className="px-4 py-3">{s.practical_days_completed}</td>
                      <td className="px-4 py-3">{s.mock_test_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Exam Ready Students</CardTitle></CardHeader>
          <CardContent>
            {myStudents.filter((s) => s.status === "exam_eligible").length === 0 ? (
              <p className="text-sm text-muted-foreground">No students ready for exam.</p>
            ) : (
              <div className="space-y-2">
                {myStudents.filter((s) => s.status === "exam_eligible").map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-950">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium">{s.first_name} {s.last_name}</span>
                    <Badge variant="success">Exam Ready</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Students Under Penalty</CardTitle></CardHeader>
          <CardContent>
            {students.filter((s) => s.under_penalty).length === 0 ? (
              <p className="text-sm text-muted-foreground">No students under penalty.</p>
            ) : (
              <div className="space-y-2">
                {students.filter((s) => s.under_penalty).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-md bg-red-50 px-3 py-2 dark:bg-red-950">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">{s.first_name} {s.last_name}</span>
                    <Badge variant="destructive">Penalty</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>My Payroll</CardTitle></CardHeader>
        <CardContent>
          {payrollEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payroll entries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Base Pay</th>
                    <th className="px-4 py-3">Student Load</th>
                    <th className="px-4 py-3">Training Days</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollEntries.slice(0, 12).map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{e.period_start} &mdash; {e.period_end}</td>
                      <td className="px-4 py-3">{e.base_pay.toLocaleString()} ETB</td>
                      <td className="px-4 py-3">{e.active_student_loads}</td>
                      <td className="px-4 py-3">{e.active_training_days}</td>
                      <td className="px-4 py-3 font-semibold">{e.total_pay.toLocaleString()} ETB</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[e.status] || "bg-blue-100 text-blue-800"}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
