"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Briefcase,
  Calendar,
  IndianRupee,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Download,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InvoiceStatusBadge, { INVOICE_STATUS_CONFIG } from "./invoice-status-badge";

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

export default function InvoiceTable({
  invoices = [],
  loading = false,
  pagination = {},
  onPageChange,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onStatusChange,
  isFiltered = false,
  onClearFilters,
  onCreateClick,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card/80 overflow-hidden shadow-xs">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-3 border-b last:border-0"
            >
              <div className="flex items-center gap-3 w-1/4">
                <Skeleton className="size-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center space-y-3">
        <div className="size-12 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto ring-6 ring-muted/20">
          <FileText className="size-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isFiltered ? "No matching invoices found" : "No invoices created yet"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {isFiltered
              ? "No invoices match your current search and filter criteria. Try adjusting your query."
              : "Generate professional client invoices, track dues, and manage billing for your projects."}
          </p>
        </div>

        <div className="pt-2">
          {isFiltered ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reset Filters
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onCreateClick}
              className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="size-3.5" />
              Create Your First Invoice
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { page = 1, limit = 10, totalInvoices = 0, totalPages = 1 } = pagination;
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalInvoices);
  const now = new Date();

  return (
    <div className="rounded-xl border bg-card/80 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px] text-xs font-semibold pl-6">Invoice #</TableHead>
              <TableHead className="text-xs font-semibold">Client</TableHead>
              <TableHead className="text-xs font-semibold">Project</TableHead>
              <TableHead className="text-xs font-semibold">Dates</TableHead>
              <TableHead className="text-right text-xs font-semibold">Amount</TableHead>
              <TableHead className="w-[160px] text-xs font-semibold text-center">Status</TableHead>
              <TableHead className="w-[80px] text-right text-xs font-semibold pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {invoices.map((invoice) => {
              const isOverdue =
                invoice.status !== "PAID" &&
                invoice.status !== "CANCELLED" &&
                new Date(invoice.dueDate) < now;

              return (
                <TableRow
                  key={invoice.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  {/* Invoice Number */}
                  <TableCell className="pl-6 py-3.5 align-middle">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center gap-2.5 text-left group-hover:text-primary transition-colors cursor-pointer"
                    >
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors font-mono">
                          #{invoice.invoiceNumber}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {invoice.items?.length || 0} line {invoice.items?.length === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Client */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">
                        {invoice.client?.name || "—"}
                      </p>
                      {invoice.client?.companyName && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-[180px]">
                          <Building2 className="size-3 shrink-0" />
                          <span className="truncate">{invoice.client.companyName}</span>
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Project */}
                  <TableCell className="py-3.5 align-middle">
                    {invoice.project?.name ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-md border truncate max-w-[160px]">
                        <Briefcase className="size-3 text-primary shrink-0" />
                        <span className="truncate">{invoice.project.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">Standalone</span>
                    )}
                  </TableCell>

                  {/* Dates */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="space-y-0.5 text-xs">
                      <p className="text-muted-foreground text-[11px]">
                        Issued: <span className="text-foreground">{formatDate(invoice.issueDate)}</span>
                      </p>
                      <p
                        className={`text-[11px] font-medium ${
                          isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
                        }`}
                      >
                        Due: {formatDate(invoice.dueDate)}
                        {isOverdue && " (Overdue)"}
                      </p>
                    </div>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="py-3.5 text-right align-middle">
                    <p className="text-xs font-bold text-foreground font-mono">
                      {formatCurrency(invoice.total)}
                    </p>
                    {Number(invoice.tax) > 0 && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        incl. {formatCurrency(invoice.tax)} tax
                      </p>
                    )}
                  </TableCell>

                  {/* Status Dropdown */}
                  <TableCell className="py-3.5 text-center align-middle">
                    <Select
                      value={invoice.status}
                      onValueChange={(newStatus) => onStatusChange(invoice.id, newStatus)}
                    >
                      <SelectTrigger className="h-7 w-[125px] text-xs mx-auto border-0 shadow-none bg-transparent hover:bg-muted/50 p-1">
                        <SelectValue>
                          <InvoiceStatusBadge status={invoice.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="center">
                        {Object.entries(INVOICE_STATUS_CONFIG).map(([val, conf]) => (
                          <SelectItem key={val} value={val} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span>{conf.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="pr-6 py-3.5 text-right align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <MoreVertical className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-xs">
                        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                          Invoice Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="gap-2 text-xs cursor-pointer flex items-center"
                          >
                            <ExternalLink className="size-3.5" />
                            <span>View Full Page</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={`/api/invoices/${invoice.id}/pdf?download=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`invoice-${invoice.invoiceNumber}.pdf`}
                            className="gap-2 text-xs cursor-pointer flex items-center"
                          >
                            <Download className="size-3.5" />
                            <span>Download PDF</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onViewInvoice(invoice)}
                          className="gap-2 text-xs cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                          <span>Quick Preview & Print</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditInvoice(invoice)}
                          className="gap-2 text-xs cursor-pointer"
                        >
                          <Edit2 className="size-3.5" />
                          <span>Edit Invoice</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteInvoice(invoice)}
                          className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Delete Invoice</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalInvoices > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t bg-muted/10 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {startIndex}–{endIndex}
            </span>{" "}
            of <span className="font-semibold text-foreground">{totalInvoices}</span>{" "}
            {totalInvoices === 1 ? "invoice" : "invoices"}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
