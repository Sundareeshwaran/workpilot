"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Receipt,
  Calendar,
  CreditCard,
  Hash,
  FileText,
  IndianRupee,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { PAYMENT_METHOD_VALUES, PAYMENT_METHOD_LABELS } from "@/validations/payment.validation";

function formatCurrency(val = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(val);
}

export default function PaymentFormDialog({
  open,
  onOpenChange,
  invoice,
  paymentToEdit = null,
  onSuccess,
}) {
  const isEditing = Boolean(paymentToEdit);

  // Compute maximum allowable amount for this payment
  const invoiceTotal = Number(invoice?.total || 0);
  const otherPaymentsTotal = (invoice?.payments || [])
    .filter((p) => !paymentToEdit || p.id !== paymentToEdit.id)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  
  const remainingBalance = Math.max(
    0,
    Number((invoiceTotal - otherPaymentsTotal).toFixed(2))
  );

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Initialize form values when dialog opens or paymentToEdit changes
  useEffect(() => {
    if (open) {
      if (paymentToEdit) {
        setAmount(String(paymentToEdit.amount || ""));
        if (paymentToEdit.paymentDate) {
          const d = new Date(paymentToEdit.paymentDate);
          setPaymentDate(!isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "");
        } else {
          setPaymentDate(new Date().toISOString().split("T")[0]);
        }
        setPaymentMethod(paymentToEdit.paymentMethod || "UPI");
        setReferenceNumber(paymentToEdit.referenceNumber || "");
        setNotes(paymentToEdit.notes || "");
      } else {
        // Create mode: prefill with the full remaining balance
        setAmount(remainingBalance > 0 ? String(remainingBalance) : "");
        setPaymentDate(new Date().toISOString().split("T")[0]);
        setPaymentMethod("UPI");
        setReferenceNumber("");
        setNotes("");
      }
      setValidationError("");
    }
  }, [open, paymentToEdit, remainingBalance]);

  // Real-time amount validation
  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    setValidationError("");

    if (val !== "") {
      const num = Number(val);
      if (isNaN(num) || num <= 0) {
        setValidationError("Payment amount must be greater than 0");
      } else if (num > remainingBalance + 0.001) {
        setValidationError(
          `Amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`
        );
      }
    }
  };

  const handleFillMax = () => {
    setAmount(String(remainingBalance));
    setValidationError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Please enter a valid payment amount greater than 0.");
      return;
    }

    if (parsedAmount > remainingBalance + 0.001) {
      setValidationError(
        `Payment amount exceeds remaining balance of ${formatCurrency(remainingBalance)}.`
      );
      return;
    }

    if (!paymentDate) {
      setValidationError("Please select a valid payment date.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        invoiceId: invoice.id,
        amount: parsedAmount,
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        referenceNumber: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      };

      const url = isEditing
        ? `/api/payments/${paymentToEdit.id}`
        : `/api/invoices/${invoice.id}/payments`;

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process payment");
      }

      toast.success(
        isEditing
          ? `Payment of ${formatCurrency(parsedAmount)} updated successfully`
          : `Payment of ${formatCurrency(parsedAmount)} recorded successfully`
      );

      if (onSuccess) {
        onSuccess(data.payment);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("PAYMENT SUBMISSION ERROR:", err);
      toast.error(err.message || "An error occurred while saving the payment");
      setValidationError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {isEditing ? "Edit Payment Record" : "Record Invoice Payment"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {isEditing
              ? `Update transaction details for invoice #${invoice?.invoiceNumber || ""}.`
              : `Record a client payment against invoice #${invoice?.invoiceNumber || ""}.`}
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Balance Banner */}
        <div className="rounded-xl border bg-muted/30 p-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">
              Remaining Invoice Balance
            </span>
            <span className="text-base font-extrabold text-foreground font-mono">
              {formatCurrency(remainingBalance)}
            </span>
          </div>
          {!isEditing && remainingBalance > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillMax}
              className="gap-1.5 text-xs h-8 cursor-pointer font-medium"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Pay Full Balance</span>
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Amount Field */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount" className="text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <IndianRupee className="size-3.5 text-primary" />
                <span>Amount Paid (INR) *</span>
              </span>
              <span className="text-[11px] font-normal text-muted-foreground font-mono">
                Max: {formatCurrency(remainingBalance)}
              </span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                ₹
              </span>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance}
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                required
                className="pl-8 font-mono text-sm font-semibold"
                autoFocus
              />
            </div>
          </div>

          {/* Payment Date & Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="payment-date" className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                <span>Payment Date *</span>
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <Label htmlFor="payment-method" className="text-xs font-semibold flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-primary" />
                <span>Payment Method *</span>
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" className="text-xs">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_VALUES.map((method) => (
                    <SelectItem key={method} value={method} className="text-xs">
                      {PAYMENT_METHOD_LABELS[method] || method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference / Transaction ID */}
          <div className="space-y-1.5">
            <Label htmlFor="reference-number" className="text-xs font-semibold flex items-center gap-1.5">
              <Hash className="size-3.5 text-primary" />
              <span>Transaction / Reference Number (Optional)</span>
            </Label>
            <Input
              id="reference-number"
              type="text"
              placeholder="e.g. UPI Ref, IMPS-987654321, Cheque #0012"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              maxLength={100}
              className="text-xs font-mono"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-notes" className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="size-3.5 text-primary" />
              <span>Notes & Remarks (Optional)</span>
            </Label>
            <Textarea
              id="payment-notes"
              rows={2}
              placeholder="Add any internal transaction notes or confirmation details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              className="text-xs resize-none"
            />
          </div>

          {/* Inline Validation Error */}
          {validationError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || Boolean(validationError && !amount)}
              className="gap-2 cursor-pointer bg-primary text-primary-foreground font-semibold"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isEditing ? "Save Changes" : "Record Payment"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
