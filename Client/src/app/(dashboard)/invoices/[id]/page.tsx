"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  DollarSign,
  Calendar,
  Hash,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentRecordModal } from "@/components/payment-record-modal";
import { getInvoice, type StudentInvoice } from "@/lib/api";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [invoice, setInvoice] = useState<StudentInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    getInvoice(id).then((res) => {
      if (res.success && res.data) {
        setInvoice(res.data);
      } else {
        setError(res.error || "Failed to load invoice");
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500">{error || "Invoice not found"}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  const statusVariant: "success" | "warning" | "destructive" =
    invoice.status === "paid" ? "success" : invoice.is_overdue ? "destructive" : "warning";

  return (
    <div className="space-y-6">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
              <ReceiptIcon className="h-6 w-6 text-slate-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-bold text-[#0f172a]">
                  Invoice #{invoice.invoice_number}
                </h1>
                <Badge variant={statusVariant}>{invoice.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{invoice.invoice_type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status !== "paid" && (
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]" onClick={() => setShowPaymentModal(true)}>
                <DollarSign className="h-4 w-4" />
                Mark as Paid
              </Button>
            )}
            <Button variant="outline" onClick={() => generateInvoicePDF(invoice)}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-[#0f172a]">Invoice Details</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b last:border-0">
                    <td className="px-4 py-3 text-slate-600">
                      {invoice.description || invoice.invoice_type}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#0f172a]">
                      {invoice.amount.toLocaleString()} ETB
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t bg-slate-50 font-semibold">
                    <td className="px-4 py-3 text-[#0f172a]">Total</td>
                    <td className="px-4 py-3 text-[#0f172a]">
                      {invoice.amount.toLocaleString()} ETB
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-[#0f172a]">Student Info</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Name:</span>
                <span className="font-medium text-[#0f172a]">
                  {invoice.student_name || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Student ID:</span>
                <span className="font-medium text-[#0f172a]">{invoice.student_id}</span>
              </div>
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link href={`/students/${invoice.student_id}`}>View Student</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-[#0f172a]">Payment Info</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Due Date:</span>
                <span className="font-medium text-[#0f172a]">
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                </span>
              </div>
              {invoice.paid_at ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-slate-500">Paid At:</span>
                    <span className="font-medium text-[#0f172a]">
                      {new Date(invoice.paid_at).toLocaleString()}
                    </span>
                  </div>
                  {invoice.payment_method && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Method:</span>
                      <span className="font-medium text-[#0f172a] capitalize">
                        {invoice.payment_method.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                  {invoice.payment_reference && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Reference:</span>
                      <span className="font-medium text-[#0f172a]">
                        {invoice.payment_reference}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-amber-600">Not yet paid</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentRecordModal
          invoice={invoice}
          open={true}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            getInvoice(id).then((res) => {
              if (res.success && res.data) setInvoice(res.data);
            });
          }}
        />
      )}
    </div>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  );
}
