"use client";

import { useEffect, useState, startTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { firstError, getRenewalRequests, type RenewalRequest } from "@/lib/api";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function RenewalRequestsPage() {
  const [requests, setRequests] = useState<RenewalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRenewalRequests();
      if (res.success && res.data) {
        const data = typeof res.data === "object" && "data" in res.data ? (res.data as any).data : res.data;
        setRequests(Array.isArray(data) ? data : []);
      } else {
        setError(firstError(res.errors) || "Failed to load renewal requests");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  };

  useEffect(() => { startTransition(() => fetchRequests()); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Renewal Requests</h1>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            <RefreshCw className="mr-1 h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      {!error && (loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
      ) : requests.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No renewal requests found.</CardContent></Card>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 text-sm font-medium">ID</th>
              <th className="text-left p-3 text-sm font-medium">Student ID</th>
              <th className="text-left p-3 text-sm font-medium">Status</th>
              <th className="text-left p-3 text-sm font-medium">Created</th>
            </tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3 text-sm font-mono">#{r.id}</td>
                  <td className="p-3 text-sm">{r.student_id}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusStyles[r.status] || "bg-gray-100"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
