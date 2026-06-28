"use client";

import { useEffect, useState, startTransition } from "react";
import { Plus, Search, Eye, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("driving_school_token") : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

type Invoice = {
  id: number;
  student_id: number;
  invoice_number: string | null;
  amount: number;
  milestone_type: string;
  status: string;
  paid_at: string | null;
  due_date: string | null;
  description: string | null;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/invoices`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setInvoices(json.data || []);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const markAsPaid = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/invoices/${id}/mark_paid`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) fetchInvoices();
    } catch {
      // silent
    }
  };

  useEffect(() => {
    startTransition(() => fetchInvoices());
  }, []);

  const filtered = invoices.filter((inv) =>
    inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.description?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "pending").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Paid</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{stats.paid}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats.overdue}</div></CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Invoice</th>
                <th className="text-left p-3 text-sm font-medium">Description</th>
                <th className="text-left p-3 text-sm font-medium">Amount</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Due Date</th>
                <th className="text-right p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No invoices found</td></tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="p-3 text-sm font-mono">{inv.invoice_number || `#${inv.id}`}</td>
                    <td className="p-3 text-sm">{inv.description || inv.milestone_type}</td>
                    <td className="p-3 text-sm font-medium">{inv.amount.toLocaleString()} ETB</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusStyles[inv.status] || "bg-gray-100"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</td>
                    <td className="p-3 text-right">
                      {inv.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => markAsPaid(inv.id)}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
