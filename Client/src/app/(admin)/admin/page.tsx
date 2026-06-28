"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users, UserCheck, DollarSign, FileText, Activity, AlertTriangle, Plus, Layers, Shield, RefreshCw, AlertCircle
} from "lucide-react";
import { getStudents, getUsers, getBatches, createUser, createBatch, type Student, type User, type Batch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("clerk");
  const [userPassword, setUserPassword] = useState("");
  const [batchName, setBatchName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([getStudents(), getUsers(), getBatches()]).then(([sRes, uRes, bRes]) => {
      if (!sRes.success) setError(sRes.errors?.[0] || "Failed to load students");
      if (!uRes.success) setError(uRes.errors?.[0] || "Failed to load users");
      if (!bRes.success) setError(bRes.errors?.[0] || "Failed to load batches");
      if (sRes.success && sRes.data) {
        const data = typeof sRes.data === "object" && "data" in sRes.data ? (sRes.data as any).data : sRes.data;
        setStudents(Array.isArray(data) ? data : []);
      }
      if (uRes.success && uRes.data) {
        const data = typeof uRes.data === "object" && "data" in uRes.data ? (uRes.data as any).data : uRes.data;
        setUsers(Array.isArray(data) ? data : []);
      }
      if (bRes.success && bRes.data) {
        const data = typeof bRes.data === "object" && "data" in bRes.data ? (bRes.data as any).data : bRes.data;
        setBatches(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }).catch(() => {
      setError("Network error. Please check your connection.");
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    instructors: users.filter((u) => u.role === "instructor").length,
    clerks: users.filter((u) => u.role === "clerk").length,
    studentUsers: users.filter((u) => u.role === "student").length,
    totalStudents: students.length,
    underPenalty: students.filter((s) => s.under_penalty).length,
    unverified: students.filter((s) => !s.verified).length,
    totalBatches: batches.length,
    pendingBatches: batches.filter((b) => b.status === "pending").length,
  }), [students, users, batches]);

  const handleCreateUser = async () => {
    if (!userName || !userEmail || !userPassword) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createUser({
        full_name: userName,
        email: userEmail,
        role: userRole,
        password: userPassword,
        password_confirmation: userPassword,
      });
      if (res.success) {
        setUserName(""); setUserEmail(""); setUserPassword("");
        fetchData();
      } else {
        setError(res.errors?.[0] || "Failed to create user");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setSubmitting(false);
  };

  const handleCreateBatch = async () => {
    if (!batchName) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createBatch({ name: batchName, status: "pending" });
      if (res.success) {
        setBatchName("");
        fetchData();
      } else {
        setError(res.errors?.[0] || "Failed to create batch");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Admin Overview</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Admin Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">System administration, user management, and batch controls.</p>
        </div>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard icon={UserCheck} label="Instructors" value={stats.instructors} color="bg-violet-500" />
        <StatCard icon={Users} label="Clerks" value={stats.clerks} color="bg-amber-500" />
        <StatCard icon={Activity} label="Students" value={stats.totalStudents} color="bg-emerald-500" />
        <StatCard icon={AlertTriangle} label="Under Penalty" value={stats.underPenalty} color="bg-red-500" />
        <StatCard icon={FileText} label="Unverified" value={stats.unverified} color="bg-orange-500" />
        <StatCard icon={Shield} label="Batches" value={stats.totalBatches} color="bg-purple-500" />
        <StatCard icon={Layers} label="Pending Batches" value={stats.pendingBatches} color="bg-teal-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Create User</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} />
            <Input type="email" placeholder="Email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
            <Input type="password" placeholder="Password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />
            <Select value={userRole} onValueChange={setUserRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="clerk">Clerk</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateUser} disabled={!userName || !userEmail || !userPassword || submitting}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Create Batch</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Batch Name" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
            <Button onClick={handleCreateBatch} disabled={!batchName || submitting}>
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>User Role Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <RoleRow label="Admin" count={stats.admins} total={stats.totalUsers} color="bg-purple-500" />
              <RoleRow label="Instructor" count={stats.instructors} total={stats.totalUsers} color="bg-violet-500" />
              <RoleRow label="Clerk" count={stats.clerks} total={stats.totalUsers} color="bg-amber-500" />
              <RoleRow label="Student (User)" count={stats.studentUsers} total={stats.totalUsers} color="bg-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>System Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.underPenalty > 0 && (
                <AlertRow icon={AlertTriangle} label="Students under penalty" count={stats.underPenalty} color="text-red-600" />
              )}
              {stats.unverified > 0 && (
                <AlertRow icon={FileText} label="Unverified student records" count={stats.unverified} color="text-orange-600" />
              )}
              {stats.underPenalty === 0 && stats.unverified === 0 && (
                <p className="text-sm text-muted-foreground">No alerts at this time.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{u.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 capitalize">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Batches</CardTitle></CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batches found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={b.status === "approved" ? "success" : b.status === "rejected" ? "destructive" : "secondary"}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
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

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}

function RoleRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{count} ({pct}%)</span>
    </div>
  );
}

function AlertRow({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className="flex-1 text-sm text-foreground">{label}</span>
      <Badge variant="destructive">{count}</Badge>
    </div>
  );
}
