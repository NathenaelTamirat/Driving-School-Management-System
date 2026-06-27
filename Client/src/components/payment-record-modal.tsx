"use client";

import { useState } from "react";
import { X, DollarSign, Calendar, FileText, CreditCard, Hash } from "lucide-react";
import type { StudentInvoice } from "@/lib/api";
import { markInvoiceAsPaid } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  invoice: StudentInvoice;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "other", label: "Other" },
];

export function PaymentRecordModal({ invoice, open, onClose, onSuccess }: Props) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: { payment_method: string; payment_reference?: string; paid_at?: string } = {
      payment_method: paymentMethod,
      paid_at: new Date(paidAt).toISOString(),
    };
    if (paymentReference.trim()) payload.payment_reference = paymentReference.trim();

    const result = await markInvoiceAsPaid(invoice.id, payload);

    setSubmitting(false);
    if (result.success) {
      toast.success("Invoice marked as paid successfully");
      onSuccess();
    } else {
      toast.error(result.error || "Failed to mark invoice as paid");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-[#0f172a]">Record Payment</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-mono font-medium text-[#0f172a]">{invoice.invoice_number}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-slate-500">Student:</span>
              <span className="font-medium text-[#0f172a]">{invoice.student_name || "N/A"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-slate-500">Total Due:</span>
              <span className="text-lg font-bold text-[#0f172a]">{invoice.amount.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              Amount
            </Label>
            <Input
              id="amount"
              value={`${invoice.amount.toLocaleString()} ETB`}
              disabled
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentReference" className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-slate-400" />
              Reference (optional)
            </Label>
            <Input
              id="paymentReference"
              placeholder="Transaction/receipt number"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAt" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Payment Date
            </Label>
            <Input
              id="paidAt"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Notes (optional)
            </Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
