"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DeleteInvoiceDialog({
  open,
  onOpenChange,
  invoice = null,
  onInvoiceDeleted,
}) {
  const [deleting, setDeleting] = useState(false);

  if (!invoice) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete invoice");
      }

      toast.success(`Invoice "${invoice.invoiceNumber}" deleted successfully.`);
      if (onInvoiceDeleted) onInvoiceDeleted(invoice.id);
      onOpenChange(false);
    } catch (err) {
      console.error("DELETE INVOICE ERROR:", err);
      toast.error(err.message || "Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
          <div className="size-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center ring-8 ring-destructive/5">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Delete Invoice
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to permanently delete invoice{" "}
              <strong className="text-foreground font-semibold">
                #{invoice.invoiceNumber}
              </strong>
              ? This action will remove the invoice, line items, and financial records.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs gap-2 cursor-pointer shadow-xs"
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            <span>{deleting ? "Deleting..." : "Delete Invoice"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
