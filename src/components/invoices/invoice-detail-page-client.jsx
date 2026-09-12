"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  Edit2,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  IndianRupee,
  Clock,
  ExternalLink,
  Receipt,
  FileCode2,
  ShieldCheck,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InvoiceStatusBadge, { INVOICE_STATUS_CONFIG } from "./invoice-status-badge";
import InvoiceFormDialog from "./invoice-form-dialog";
import DeleteInvoiceDialog from "./delete-invoice-dialog";
import SendInvoiceDialog from "./send-invoice-dialog";
import PaymentHistoryTable from "@/components/payments/payment-history-table";
import PaymentFormDialog from "@/components/payments/payment-form-dialog";

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

export default function InvoiceDetailPageClient({
  initialInvoice,
  clients = [],
  projects = [],
}) {
  const router = useRouter();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Download PDF Handler
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const res = await fetch(`/api/invoices/${invoice.id}/pdf?download=true`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to download invoice PDF");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded successfully");
    } catch (err) {
      console.error("PDF DOWNLOAD ERROR:", err);
      toast.error(err.message || "Could not generate invoice PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isOverdue =
    invoice.status !== "PAID" &&
    invoice.status !== "CANCELLED" &&
    invoice.dueDate &&
    new Date(invoice.dueDate) < new Date();

  // Dynamic Payment Financials
  const invoiceTotal = Number(invoice.total || 0);
  const paidAmount = Number(
    (invoice.payments || [])
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      .toFixed(2)
  );
  const balanceDue =
    invoice.status === "PAID"
      ? 0
      : Math.max(0, Number((invoiceTotal - paidAmount).toFixed(2)));

  const isFullyPaid = invoice.status === "PAID" || (paidAmount >= invoiceTotal && invoiceTotal > 0);
  const isPartiallyPaid = paidAmount > 0 && paidAmount < invoiceTotal;

  // Status Change Handler
  const handleStatusChange = async (newStatus) => {
    if (newStatus === invoice.status) return;

    // Optimistic update
    const previousStatus = invoice.status;
    setInvoice((prev) => ({ ...prev, status: newStatus }));
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update invoice status");
      }

      toast.success(`Invoice status updated to ${newStatus}`);
      if (data.invoice) {
        setInvoice((prev) => ({
          ...prev,
          ...data.invoice,
        }));
      }
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      toast.error(err.message || "Failed to update invoice status");
      setInvoice((prev) => ({ ...prev, status: previousStatus }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleInvoiceUpdated = (updated) => {
    setInvoice((prev) => ({
      ...prev,
      ...updated,
      items: updated.items || prev.items,
      client: updated.client || prev.client,
      project: updated.project || prev.project,
    }));
    router.refresh();
  };

  const handleInvoiceDeleted = () => {
    router.push("/invoices");
  };

  // Payment Synchronization Handlers
  const handlePaymentCreated = (payment) => {
    setInvoice((prev) => {
      const newPayments = [payment, ...(prev.payments || [])];
      const newTotalPaid = Number(
        newPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toFixed(2)
      );
      const newStatus =
        payment.invoice?.status ||
        (newTotalPaid >= Number(prev.total)
          ? "PAID"
          : prev.status === "DRAFT"
          ? "SENT"
          : prev.status);

      return {
        ...prev,
        status: newStatus,
        payments: newPayments,
      };
    });
    router.refresh();
  };

  const handlePaymentUpdated = (updatedPayment) => {
    setInvoice((prev) => {
      const newPayments = (prev.payments || []).map((p) =>
        p.id === updatedPayment.id ? updatedPayment : p
      );
      const newTotalPaid = Number(
        newPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toFixed(2)
      );
      const newStatus =
        updatedPayment.invoice?.status ||
        (newTotalPaid >= Number(prev.total)
          ? "PAID"
          : prev.status === "PAID"
          ? isOverdue
            ? "OVERDUE"
            : "SENT"
          : prev.status);

      return {
        ...prev,
        status: newStatus,
        payments: newPayments,
      };
    });
    router.refresh();
  };

  const handlePaymentDeleted = (res) => {
    setInvoice((prev) => {
      const newPayments = (prev.payments || []).filter(
        (p) => p.id !== res.deletedId
      );
      return {
        ...prev,
        status: res.invoice?.status || prev.status,
        payments: newPayments,
      };
    });
    router.refresh();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Print Specific Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Navigation & Action Toolbar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer -ml-2"
          >
            <Link href="/invoices">
              <ArrowLeft className="size-4" />
              <span>Back to Invoices</span>
            </Link>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Send Invoice Action */}
          <Button
            size="sm"
            onClick={() => setSendOpen(true)}
            className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-2xs font-medium"
          >
            <Send className="size-3.5" />
            <span>Send Invoice</span>
          </Button>

          {/* Record Payment Button */}
          {balanceDue > 0 && invoice.status !== "CANCELLED" && (
            <Button
              size="sm"
              onClick={() => setPaymentFormOpen(true)}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>Record Payment</span>
            </Button>
          )}

          {/* Quick Lifecycle Action: Mark as Sent (Manual) */}
          {invoice.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("SENT")}
              disabled={updatingStatus}
              className="gap-1.5 text-xs cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="size-3.5 text-sky-600" />
              <span>Mark as Sent</span>
            </Button>
          )}

          {/* Quick Lifecycle Action: Mark as Paid */}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange("PAID")}
              disabled={updatingStatus}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Mark as Paid</span>
            </Button>
          )}

          {/* Quick Lifecycle Action: Reopen Draft */}
          {invoice.status === "CANCELLED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("DRAFT")}
              disabled={updatingStatus}
              className="gap-1.5 text-xs cursor-pointer shadow-2xs"
            >
              <RotateCcw className="size-3.5" />
              <span>Reopen as Draft</span>
            </Button>
          )}

          {/* Change Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer shadow-2xs"
              >
                <span>Change Status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                Set Status
              </DropdownMenuLabel>
              {Object.entries(INVOICE_STATUS_CONFIG).map(([val, conf]) => (
                <DropdownMenuItem
                  key={val}
                  onClick={() => handleStatusChange(val)}
                  disabled={val === invoice.status || updatingStatus}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <conf.icon className="size-3.5" />
                  <span>{conf.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Download PDF Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="gap-1.5 text-xs cursor-pointer shadow-2xs"
          >
            {downloadingPdf ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Download className="size-3.5 text-primary" />
            )}
            <span>{downloadingPdf ? "Generating..." : "Download PDF"}</span>
          </Button>

          {/* Print Invoice Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs cursor-pointer shadow-2xs"
          >
            <Printer className="size-3.5" />
            <span>Print Invoice</span>
          </Button>

          {/* Edit Invoice Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="gap-1.5 text-xs cursor-pointer shadow-2xs"
          >
            <Edit2 className="size-3.5" />
            <span>Edit</span>
          </Button>

          {/* Delete Invoice Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive size-9 p-0 cursor-pointer"
            title="Delete Invoice"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-4 ring-primary/5 shrink-0">
                <Receipt className="size-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                #{invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
              {isOverdue && (
                <Badge
                  variant="destructive"
                  className="text-[10px] uppercase font-bold px-2 py-0.5"
                >
                  Overdue
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>Issued: {formatDate(invoice.issueDate)}</span>
              </div>
              <span className="text-muted-foreground/40">•</span>
              <div
                className={`flex items-center gap-1.5 ${
                  isOverdue ? "text-destructive font-semibold" : ""
                }`}
              >
                <Clock className="size-3.5" />
                <span>Due: {formatDate(invoice.dueDate)}</span>
              </div>
              <span className="text-muted-foreground/40">•</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                <span>Billed To: {invoice.client?.name || "Client"}</span>
              </div>
            </div>
          </div>

          {/* Big Total Badge */}
          <div className="md:text-right bg-muted/40 md:bg-transparent p-4 md:p-0 rounded-xl border md:border-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total Invoiced
            </p>
            <p className="text-3xl font-extrabold text-foreground font-mono tracking-tight mt-0.5">
              {formatCurrency(invoice.total)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Balance Due:{" "}
              <strong
                className={`font-mono ${
                  balanceDue > 0
                    ? isOverdue
                      ? "text-destructive"
                      : "text-foreground"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(balanceDue)}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoiced */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Invoiced</p>
              <p className="text-xl font-bold text-foreground font-mono">
                {formatCurrency(invoice.total)}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Paid */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">Amount Paid</p>
                {(invoice.payments || []).length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {(invoice.payments || []).length}
                  </Badge>
                )}
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(paidAmount)}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Balance Due */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Remaining Balance</p>
              <p
                className={`text-xl font-bold font-mono ${
                  balanceDue > 0
                    ? isOverdue
                      ? "text-destructive"
                      : "text-foreground"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(balanceDue)}
              </p>
            </div>
            <div
              className={`size-10 rounded-xl flex items-center justify-center ${
                balanceDue > 0
                  ? isOverdue
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-amber-500/10 text-amber-600"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {balanceDue === 0 ? (
                <ShieldCheck className="size-5" />
              ) : isOverdue ? (
                <AlertCircle className="size-5" />
              ) : (
                <Clock className="size-5" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Payment State */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Payment Status</p>
              <p className="text-base font-bold text-foreground">
                {isFullyPaid
                  ? "Settled in Full"
                  : isPartiallyPaid
                  ? `Partially Paid`
                  : isOverdue
                  ? "Payment Overdue"
                  : "Payment Pending"}
              </p>
            </div>
            <div
              className={`size-10 rounded-xl flex items-center justify-center ${
                isFullyPaid
                  ? "bg-emerald-500/10 text-emerald-600"
                  : isPartiallyPaid
                  ? "bg-amber-500/10 text-amber-600"
                  : isOverdue
                  ? "bg-rose-500/10 text-rose-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isFullyPaid ? (
                <ShieldCheck className="size-5" />
              ) : isPartiallyPaid ? (
                <Clock className="size-5" />
              ) : isOverdue ? (
                <AlertCircle className="size-5" />
              ) : (
                <Clock className="size-5" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Printable Document Section */}
      <div id="printable-invoice" className="space-y-6">
        {/* Printable Document Header (shown in print layout) */}
        <div className="hidden print:flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">INVOICE</h2>
            <p className="font-mono text-sm text-gray-600">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Status: {invoice.status}</p>
            <p className="text-xs text-gray-500">Issued: {formatDate(invoice.issueDate)}</p>
            <p className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Client & Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bill To Card */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Building2 className="size-3.5 text-primary" />
                  <span>Billed Client</span>
                </CardTitle>
                {invoice.client?.id && (
                  <Link
                    href={`/clients/${invoice.client.id}`}
                    className="no-print text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View Client</span>
                    <ExternalLink className="size-3" />
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs">
              <h3 className="text-sm font-bold text-foreground">
                {invoice.client?.name || "Client Name"}
              </h3>
              {invoice.client?.companyName && (
                <p className="text-muted-foreground font-medium">
                  {invoice.client.companyName}
                </p>
              )}
              {invoice.client?.email && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="size-3.5 text-primary shrink-0" />
                  <span>{invoice.client.email}</span>
                </p>
              )}
              {invoice.client?.phone && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Phone className="size-3.5 text-primary shrink-0" />
                  <span>{invoice.client.phone}</span>
                </p>
              )}
              {invoice.client?.address && (
                <p className="text-muted-foreground flex items-start gap-2">
                  <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{invoice.client.address}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Project & Billing Specifications */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Briefcase className="size-3.5 text-primary" />
                <span>Project & Billing Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <p className="text-[11px] text-muted-foreground">Associated Project</p>
                {invoice.project?.name ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Link
                      href={`/projects/${invoice.project.id}`}
                      className="no-print text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>{invoice.project.name}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                    <span className="print:inline hidden font-semibold text-xs">
                      {invoice.project.name}
                    </span>
                    {invoice.project.status && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                        {invoice.project.status}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground/70 italic mt-0.5">
                    Standalone Invoice (No project linked)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-[11px] text-muted-foreground">Issue Date</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formatDate(invoice.issueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Due Date</p>
                  <p
                    className={`font-semibold mt-0.5 ${
                      isOverdue ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Itemized Services Table */}
        <Card className="shadow-2xs overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileCode2 className="size-3.5 text-primary" />
              <span>Itemized Services</span>
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              {invoice.items?.length || 0} {invoice.items?.length === 1 ? "item" : "items"}
            </Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[40px] text-xs font-semibold text-center">#</TableHead>
                  <TableHead className="text-xs font-semibold">Service / Description</TableHead>
                  <TableHead className="w-[100px] text-right text-xs font-semibold">Quantity</TableHead>
                  <TableHead className="w-[140px] text-right text-xs font-semibold">Unit Rate</TableHead>
                  <TableHead className="w-[160px] text-right text-xs font-semibold pr-6">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <TableRow key={item.id || idx} className="hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground text-center font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground py-3">
                        {item.service || item.description || "Service"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {formatCurrency(item.rate || item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-foreground font-mono pr-6">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                      No line items recorded for this invoice.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Financial Breakdown & Notes Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes & Terms */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-2 border-b bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="size-3.5 text-primary" />
                <span>Notes & Payment Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {invoice.notes ? (
                invoice.notes
              ) : (
                <span className="italic text-muted-foreground/60">
                  Standard 14-day payment term applies. Please submit payments via bank transfer or online gateway. Thank you for your partnership!
                </span>
              )}
            </CardContent>
          </Card>

          {/* Financial Totals */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-2 border-b bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Receipt className="size-3.5 text-primary" />
                <span>Financial Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Line Items Subtotal</span>
                <span className="font-semibold text-foreground font-mono">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>

              {Number(invoice.tax) > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tax Added (+)</span>
                  <span className="font-semibold text-foreground font-mono">
                    {formatCurrency(invoice.tax)}
                  </span>
                </div>
              )}

              {Number(invoice.discount) > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Discount Applied (-)</span>
                  <span className="font-semibold text-foreground font-mono">
                    {formatCurrency(invoice.discount)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Grand Total:</span>
                <span className="text-2xl font-extrabold text-primary font-mono">
                  {formatCurrency(invoice.total)}
                </span>
              </div>

              {paidAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="font-medium">Amount Paid (-)</span>
                  <span className="font-bold font-mono">
                    -{formatCurrency(paidAmount)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Remaining Balance:</span>
                <span
                  className={`font-bold font-mono text-sm ${
                    balanceDue > 0
                      ? isOverdue
                        ? "text-destructive"
                        : "text-foreground"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments & Settlement Section (Non-Printable in main view or custom printable) */}
        <div className="no-print pt-2">
          <PaymentHistoryTable
            payments={invoice.payments || []}
            invoice={invoice}
            onPaymentUpdated={handlePaymentUpdated}
            onPaymentDeleted={handlePaymentDeleted}
            onAddPaymentClick={() => setPaymentFormOpen(true)}
          />
        </div>
      </div>

      {/* Payment Form Dialog */}
      <PaymentFormDialog
        open={paymentFormOpen}
        onOpenChange={setPaymentFormOpen}
        invoice={invoice}
        onSuccess={handlePaymentCreated}
      />

      {/* Edit Form Dialog */}
      <InvoiceFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoiceToEdit={invoice}
        clients={clients}
        projects={projects}
        onSuccess={handleInvoiceUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteInvoiceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        invoice={invoice}
        onInvoiceDeleted={handleInvoiceDeleted}
      />

      {/* Send Invoice Email Dialog */}
      <SendInvoiceDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        invoice={invoice}
        onInvoiceSent={handleInvoiceUpdated}
      />
    </div>
  );
}
