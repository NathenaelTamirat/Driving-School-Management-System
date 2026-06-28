"use client";

import { useEffect, useState, startTransition } from "react";
import { Send, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("driving_school_token") : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

type Batch = {
  id: number;
  name: string;
  status: string;
  created_at: string;
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  submitted: Send,
  approved: CheckCircle,
  rejected: XCircle,
};

const statusColors: Record<string, string> = {
  pending: "text-yellow-600",
  submitted: "text-blue-600",
  approved: "text-emerald-600",
  rejected: "text-red-600",
};

export default function MeklitPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/batches`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        const data = json.data?.batches || json.data || [];
        setBatches(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { startTransition(() => fetchBatches()); }, []);

  const submitBatch = async (batchId: number) => {
    setSubmitting(batchId);
    try {
      await fetch(`${API_BASE_URL}/api/v1/batches/${batchId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ batch: { status: "submitted" } }),
      });
      fetchBatches();
    } catch { /* silent */ }
    setSubmitting(null);
  };

  const pending = batches.filter((b) => b.status === "pending");
  const submitted = batches.filter((b) => b.status === "submitted");
  const approved = batches.filter((b) => b.status === "approved");
  const rejected = batches.filter((b) => b.status === "rejected");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meklit Batch Export</h1>
          <p className="text-sm text-muted-foreground">Submit student batches to ERTA and track response status.</p>
        </div>
        <Button variant="outline" onClick={fetchBatches}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{pending.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Submitted</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{submitted.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{approved.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{rejected.length}</div></CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
      ) : batches.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No batches available. Create one from the admin panel first.</CardContent></Card>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 text-sm font-medium">Batch</th>
              <th className="text-left p-3 text-sm font-medium">Status</th>
              <th className="text-left p-3 text-sm font-medium">Created</th>
              <th className="text-right p-3 text-sm font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {batches.map((b) => {
                const Icon = statusIcons[b.status] || Clock;
                const color = statusColors[b.status] || "text-gray-600";
                return (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="p-3 text-sm font-medium">{b.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-sm ${color}`}>
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{b.status}</span>
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {b.status === "pending" && (
                        <Button size="sm" onClick={() => submitBatch(b.id)} disabled={submitting === b.id}>
                          <Send className="mr-1 h-4 w-4" />
                          {submitting === b.id ? "Submitting..." : "Submit to Meklit"}
                        </Button>
                      )}
                      {b.status === "submitted" && (
                        <Badge variant="secondary">Awaiting Response</Badge>
                      )}
                      {b.status === "approved" && (
                        <Badge variant="success">Approved</Badge>
                      )}
                      {b.status === "rejected" && (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
