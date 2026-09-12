"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Mail,
  FileText,
  AlertCircle,
  Building2,
  IndianRupee,
  Calendar,
  CheckCircle2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

function formatCurrency(val = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(val);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function SendInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  onInvoiceSent,
}) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (invoice && open) {
      setRecipientEmail(invoice.client?.email || "");
      setSubject(
        `Invoice #${invoice.invoiceNumber || ""} - ${formatCurrency(invoice.total || 0)}`
      );
      setMessage(
        `Hello ${invoice.client?.name || ""},\n\nPlease find attached invoice #${invoice.invoiceNumber || ""} for your review. Let us know if you have any questions.\n\nThank you!`
      );
    }
  }, [invoice, open]);

  if (!invoice) return null;

  const handleSend = async (e) => {
    e.preventDefault();

    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send invoice email");
      }

      toast.success(
        `Invoice #${invoice.invoiceNumber || invoice.id} sent to ${recipientEmail}`
      );
      if (onInvoiceSent) {
        onInvoiceSent(data.invoice || invoice);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("SEND INVOICE ERROR:", err);
      toast.error(err.message || "Could not send invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <Mail className="size-4" />
            <span>Email Delivery</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Send Invoice #{invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate and dispatch the formal PDF invoice directly to your client’s inbox.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary Card */}
        <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {invoice.client?.name || "Client"}
              </span>
              {invoice.client?.companyName && (
                <span className="text-muted-foreground">
                  ({invoice.client.companyName})
                </span>
              )}
            </div>
            <Badge variant="outline" className="font-mono text-[11px] font-bold">
              {formatCurrency(invoice.total || 0)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground border-t pt-2.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span>Due: <strong className="text-foreground">{formatDate(invoice.dueDate)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <FileText className="size-3.5 text-primary" />
              <span className="text-primary font-medium">Auto PDF Attachment</span>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSend} className="space-y-4 pt-1">
          {/* Recipient Email */}
          <div className="space-y-1.5">
            <Label htmlFor="recipientEmail" className="text-xs font-semibold">
              Recipient Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                id="recipientEmail"
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="client@company.com"
                className="pl-9 text-xs h-9"
                disabled={sending}
              />
            </div>
            {!invoice.client?.email && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3 shrink-0" />
                <span>Client profile does not have an email. Please specify recipient above.</span>
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-semibold">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Invoice subject line"
              className="text-xs h-9"
              disabled={sending}
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-xs font-semibold">
              Custom Message / Notes
            </Label>
            <Textarea
              id="message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a polite message to your client..."
              className="text-xs resize-none"
              disabled={sending}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={sending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={sending}
              className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {sending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Generating PDF & Sending...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Send Invoice Now</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
