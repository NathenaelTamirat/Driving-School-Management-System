"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PaymentRecordModal } from "@/components/payment-record-modal";
import { getInvoices, type StudentInvoice, type PaginationMeta } from "@/lib/api";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const invoiceTypeOptions = [
  { value: "", label: "All Types" },
  { value: "Registration and Theory Fee", label: "Registration & Theory" },
  { value: "Practical Fee Release", label: "Practical Fee" },
  { value: "Government Penalty", label: "Government Penalty" },
];

const statusBadgeVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [payingInvoice, setPayingInvoice] = useState<StudentInvoice | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    getInvoices({
      status: statusFilter || undefined,
      invoice_type: typeFilter || undefined,
      search: debouncedSearch || undefined,
      page,
      per_page: 20,
    }).then((res) => {
      if (res.success && res.data) {
        setInvoices(res.data.invoices);
        if (res.data.meta) setMeta(res.data.meta);
      }
      setLoading(false);
    });
  }, [statusFilter, typeFilter, debouncedSearch, page]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const totalPages = meta?.total_pages ?? 1;

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const columns: Column<StudentInvoice>[] = useMemo(() => [
    {
      header: "Invoice #",
      accessorKey: "invoice_number",
      className: "font-mono text-xs text-slate-600",
    },
    {
      header: "Student Name",
      cell: (inv) => (
        <span className="font-medium text-[#0f172a]">{inv.student_name || "—"}</span>
      ),
    },
    {
      header: "Type",
      cell: (inv) => <span className="text-slate-600">{inv.invoice_type}</span>,
    },
    {
      header: "Amount",
      cell: (inv) => (
        <span className="font-medium text-[#0f172a]">{inv.amount.toLocaleString()} ETB</span>
      ),
    },
    {
      header: "Status",
      cell: (inv) => (
        <Badge variant={statusBadgeVariant[inv.status] ?? "secondary"}>
          {inv.status}
        </Badge>
      ),
    },
    {
      header: "Due Date",
      cell: (inv) => (
        <span className="text-slate-500">{new Date(inv.due_date).toLocaleDateString()}</span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (inv) => (
        <div className="flex justify-end gap-2">
          {inv.status !== "paid" && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPayingInvoice(inv);
              }}
            >
              Mark as Paid
            </Button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0f172a]">Invoices</h1>
        {/* Create Invoice — pending backend endpoint */}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={handleTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {invoiceTypeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        emptyMessage={
          debouncedSearch || statusFilter || typeFilter
            ? "No invoices match your filters."
            : "No invoices found."
        }
        onRowClick={(inv) => router.push(`/invoices/${(inv as StudentInvoice).id}`)}
      />

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          {pageNumbers.map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {payingInvoice && (
        <PaymentRecordModal
          invoice={payingInvoice}
          open={true}
          onClose={() => setPayingInvoice(null)}
          onSuccess={() => {
            setPayingInvoice(null);
            getInvoices({
              status: statusFilter || undefined,
              invoice_type: typeFilter || undefined,
              search: debouncedSearch || undefined,
              page,
              per_page: 20,
            }).then((res) => {
              if (res.success && res.data) {
                setInvoices(res.data.invoices);
                if (res.data.meta) setMeta(res.data.meta);
              }
            });
          }}
        />
      )}
    </div>
  );
}
