"use client";

import { useEffect, useState, startTransition } from "react";
import { GraduationCap, Search, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firstError, getStudents, getGraduationRecord, getLmsProgress, type Student } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("driving_school_token") : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function GraduationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentsList = async () => {
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

  useEffect(() => { startTransition(() => fetchStudentsList()); }, []);

  const selectStudent = async (s: Student) => {
    setSelected(s);
    setProgress(null);
    setRecord(null);
    setError(null);
    try {
      const [pRes, gRes] = await Promise.all([getLmsProgress(s.id), getGraduationRecord(s.id)]);
      if (pRes.success && pRes.data) setProgress(pRes.data);
      if (gRes.success && gRes.data) setRecord(gRes.data);
    } catch {
      setError("Failed to load student details");
    }
  };

  const handleGraduate = async () => {
    if (!selected) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/students/${selected.id}/graduation_record`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setRecord(json.data);
        selectStudent(selected);
      } else {
        setError(firstError(json.errors) || "Graduation failed");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setProcessing(false);
  };

  const examEligible = students.filter((s) => s.status === "exam_eligible");
  const graduated = students.filter((s) => s.status === "graduated");
  const filtered = examEligible.filter((s) =>
    `${s.first_name} ${s.middle_name} ${s.student_id}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Graduation Processing</h1>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Ready: <strong>{examEligible.length}</strong></span>
          <span>Graduated: <strong>{graduated.length}</strong></span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => { setError(null); fetchStudentsList(); }}>
            <RefreshCw className="mr-1 h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Eligible Students</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {loading ? (
              <div className="space-y-1">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No eligible students found.</p>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${selected?.id === s.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  >
                    {s.first_name} {s.middle_name}
                    <span className="block text-xs text-muted-foreground">{s.student_id}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-muted-foreground py-8 text-center">Select a student from the list.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selected.first_name} {selected.middle_name} {selected.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{selected.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{selected.status.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mock Test Score</p>
                    <p className="font-medium">{selected.mock_test_score}/100</p>
                  </div>
                </div>

                {progress && (
                  <div>
                    <p className="text-sm font-medium mb-2">Progress</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm"><span>Theory</span><span>{progress.theory.days_completed}/{progress.theory.days_required} days</span></div>
                        <div className="h-2 bg-muted rounded overflow-hidden">
                          <div className="h-full bg-blue-500 rounded" style={{ width: `${progress.theory.percentage}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm"><span>Practical</span><span>{progress.practical.days_completed}/{progress.practical.days_required} days</span></div>
                        <div className="h-2 bg-muted rounded overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded" style={{ width: `${progress.practical.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {record ? (
                  <div>
                    <p className="text-sm font-medium mb-1">Graduation Record</p>
                    <div className="rounded-lg border p-3 space-y-1 text-sm">
                      <p>Graduated: {new Date(record.graduation_date).toLocaleDateString()}</p>
                      <p>Dossier Status: <span className="font-medium capitalize">{record.dossier_status}</span></p>
                      <p>Destination: {record.transfer_destination || "ERTA (Default)"}</p>
                    </div>
                  </div>
                ) : selected.status === "exam_eligible" && (
                  <Button onClick={handleGraduate} disabled={processing} className="w-full">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    {processing ? "Processing..." : "Graduate Student"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
