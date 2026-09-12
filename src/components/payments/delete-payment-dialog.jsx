"use client";

import React, { useState } from "react";
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
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

function formatCurrency(val = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(val);
}

export default function DeletePaymentDialog({
  open,
  onOpenChange,
  payment,
  invoiceNumber = "",
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  if (!payment) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete payment record");
      }

      toast.success(
        `Payment record of ${formatCurrency(payment.amount)} deleted successfully`
      );

      if (onSuccess) {
        onSuccess(data);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("DELETE PAYMENT ERROR:", err);
      toast.error(err.message || "Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Delete Payment Record?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove the payment of{" "}
            <strong className="text-foreground font-mono">
              {formatCurrency(payment.amount)}
            </strong>
            {invoiceNumber ? ` recorded for invoice #${invoiceNumber}` : ""}?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-1.5 text-destructive">
          <p className="font-semibold flex items-center gap-1.5">
            <Trash2 className="size-3.5" />
            <span>Accounting Impact Notice:</span>
          </p>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Removing this payment will increase the remaining unpaid balance on the invoice. If the invoice is currently marked as PAID, its status will automatically revert to SENT or OVERDUE.
          </p>
        </div>

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
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="gap-1.5 cursor-pointer font-semibold"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            <span>Delete Payment</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
