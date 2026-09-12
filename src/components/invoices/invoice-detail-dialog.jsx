"use client";

import React, { useRef } from "react";
import {
  FileText,
  Printer,
  Edit2,
  Calendar,
  Building2,
  Briefcase,
  Clock,
  CheckCircle2,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import InvoiceStatusBadge from "./invoice-status-badge";

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

function formatCurrency(val = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(val);
}

export default function InvoiceDetailDialog({
  open,
  onOpenChange,
  invoice = null,
  onEditClick,
}) {
  const printRef = useRef(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isOverdue =
    invoice.status !== "PAID" &&
    invoice.status !== "CANCELLED" &&
    new Date(invoice.dueDate) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl max-w-[95vw] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b space-y-0">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <DialogTitle className="text-lg font-bold">
              Invoice #{invoice.invoiceNumber}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            <InvoiceStatusBadge status={invoice.status} />
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                Overdue
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Printable Area */}
        <div ref={printRef} className="space-y-6 pt-2">
          {/* Header Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-xl border">
            {/* Bill To Info */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Billed To
              </p>
              <h4 className="text-sm font-bold text-foreground">
                {invoice.client?.name || "Client"}
              </h4>
              {invoice.client?.companyName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5" />
                  <span>{invoice.client.companyName}</span>
                </p>
              )}
              {invoice.client?.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  <span>{invoice.client.email}</span>
                </p>
              )}
              {invoice.client?.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  <span>{invoice.client.phone}</span>
                </p>
              )}
            </div>

            {/* Dates & Linked Project */}
            <div className="space-y-2 text-xs sm:text-right">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Invoice Details
                </p>
                <p className="text-muted-foreground mt-1">
                  Issue Date: <strong className="text-foreground">{formatDate(invoice.issueDate)}</strong>
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Due Date:{" "}
                  <strong className={isOverdue ? "text-destructive font-bold" : "text-foreground"}>
                    {formatDate(invoice.dueDate)}
                  </strong>
                </p>
              </div>

              {invoice.project?.name && (
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-md">
                    <Briefcase className="size-3.5" />
                    <span>Project: {invoice.project.name}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Service / Description</TableHead>
                  <TableHead className="w-[80px] text-right text-xs font-semibold">Qty</TableHead>
                  <TableHead className="w-[120px] text-right text-xs font-semibold">Unit Rate</TableHead>
                  <TableHead className="w-[140px] text-right text-xs font-semibold">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="text-xs font-medium text-foreground">
                        {item.service}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {formatCurrency(item.rate)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-foreground font-mono">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                      No line items recorded for this invoice.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Financial Breakdown & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes Section */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Payment Instructions & Terms
              </p>
              <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border whitespace-pre-wrap">
                {invoice.notes || "Standard 14-day payment term applies. Thank you for your partnership!"}
              </p>
            </div>

            {/* Financial Totals Card */}
            <div className="bg-card rounded-xl border p-4 space-y-2 shadow-2xs self-start">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-semibold text-foreground font-mono">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>

              {Number(invoice.tax) > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tax Added (+):</span>
                  <span className="font-semibold text-foreground font-mono">
                    {formatCurrency(invoice.tax)}
                  </span>
                </div>
              )}

              {Number(invoice.discount) > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Discount Applied (-):</span>
                  <span className="font-semibold text-foreground font-mono">
                    {formatCurrency(invoice.discount)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Total Due:</span>
                <span className="text-xl font-bold text-primary font-mono">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t flex flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>Print / Save PDF</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                if (onEditClick) onEditClick(invoice);
              }}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Edit2 className="size-3.5" />
              <span>Edit Invoice</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
