"use client";

import { useEffect, useState, startTransition } from "react";
import { ClipboardCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { firstError, getStudents, getMockTests, createMockTest, type Student } from "@/lib/api";

export default function MockTestsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [score, setScore] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudents();
      if (res.success && res.data) setStudents(res.data);
      else setError(firstError(res.errors) || "Failed to load students");
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  };

  useEffect(() => { startTransition(() => fetchStudents()); }, []);

  const loadTests = async (studentId: number) => {
    try {
      const res = await getMockTests(studentId);
      if (res.success && res.data) {
        const data = typeof res.data === "object" && "data" in res.data ? (res.data as any).data : res.data;
        setTests(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Failed to load mock tests");
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !score) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createMockTest(Number(selectedStudent), {
        score: Number(score),
        test_date: new Date().toISOString().split("T")[0],
      });
      if (res.success) {
        setScore("");
        loadTests(Number(selectedStudent));
      } else {
        setError(firstError(res.errors) || "Failed to record mock test");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mock Tests</h1>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Record Mock Test</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Student</label>
            <Select value={selectedStudent} onValueChange={(v) => { setSelectedStudent(v); loadTests(Number(v)); }}>
              <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="" disabled>Loading students...</SelectItem>
                ) : (
                  students.filter((s) => s.status === "theory_in_progress").map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.first_name} {s.middle_name} ({s.student_id})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Score (0-100, pass &gt; 37)</label>
            <Input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} disabled={!selectedStudent || !score || submitting}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            {submitting ? "Recording..." : "Record Mock Test"}
          </Button>
        </CardContent>
      </Card>

      {selectedStudent && (
        <Card>
          <CardHeader><CardTitle>Test History</CardTitle></CardHeader>
          <CardContent>
            {tests.length === 0 ? (
              <p className="text-muted-foreground">No mock tests recorded.</p>
            ) : (
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-2 text-sm">Date</th>
                    <th className="text-left p-2 text-sm">Score</th>
                    <th className="text-left p-2 text-sm">Result</th>
                  </tr></thead>
                  <tbody>
                    {tests.map((t: any) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="p-2 text-sm">{t.test_date}</td>
                        <td className="p-2 text-sm font-medium">{t.score}/100</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.result === "passed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {t.result}
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
      )}
    </div>
  );
}
