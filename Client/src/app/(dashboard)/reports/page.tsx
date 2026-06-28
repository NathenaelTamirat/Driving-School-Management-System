"use client";

import { useEffect, useState, startTransition } from "react";
import { TrendingUp, DollarSign, CreditCard, BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("driving_school_token") : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

type SummaryData = {
  total_revenue: number;
  total_collected: number;
  total_pending: number;
  invoice_count: number;
  paid_count: number;
  pending_count: number;
};

export default function ReportsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/financial_reports/summary`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setSummary(json.data);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    startTransition(() => fetchSummary());
  }, []);

  const statCards = [
    {
      label: "Total Revenue",
      value: summary ? `${summary.total_revenue.toLocaleString()} ETB` : "—",
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
    {
      label: "Collected",
      value: summary ? `${summary.total_collected.toLocaleString()} ETB` : "—",
      icon: DollarSign,
      color: "bg-blue-500",
    },
    {
      label: "Pending",
      value: summary ? `${summary.total_pending.toLocaleString()} ETB` : "—",
      icon: CreditCard,
      color: "bg-amber-500",
    },
    {
      label: "Invoices",
      value: summary ? `${summary.paid_count}/${summary.invoice_count} paid` : "—",
      icon: BarChart3,
      color: "bg-violet-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
        <Button variant="outline" onClick={() => window.open(`${API_BASE_URL}/api/v1/financial_reports/export`, "_blank")}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><div className="h-4 w-24 bg-muted rounded animate-pulse" /></CardHeader>
              <CardContent><div className="h-8 w-32 bg-muted rounded animate-pulse" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <div className={`rounded-lg p-2 ${color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
