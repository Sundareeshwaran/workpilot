"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  History,
  FolderKanban,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Circle,
  FolderPlus,
  Edit3,
  RefreshCw,
  Trash2,
  FileText,
  Activity as ActivityIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code2,
  Receipt,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import TaskStatusBadge from "@/components/tasks/task-status-badge";
import ProjectStatusBadge from "@/components/projects/project-status-badge";
import InvoiceStatusBadge from "@/components/invoices/invoice-status-badge";

const ACTION_CONFIG = {
  TASK_CREATED: {
    label: "Task Created",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: FolderPlus,
  },
  TASK_STATUS_CHANGED: {
    label: "Task Status Changed",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    icon: RefreshCw,
  },
  TASK_UPDATED: {
    label: "Task Updated",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    icon: Edit3,
  },
  TASK_DELETED: {
    label: "Task Deleted",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    icon: Trash2,
  },
  PROJECT_CREATED: {
    label: "Project Created",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: FolderPlus,
  },
  PROJECT_STATUS_CHANGED: {
    label: "Project Status Changed",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: RefreshCw,
  },
  PROJECT_UPDATED: {
    label: "Project Updated",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: Edit3,
  },
  INVOICE_CREATED: {
    label: "Invoice Created",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    icon: FileText,
  },
  INVOICE_SENT: {
    label: "Invoice Sent",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    icon: RefreshCw,
  },
  INVOICE_PAID: {
    label: "Invoice Paid",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  INVOICE_OVERDUE: {
    label: "Invoice Overdue",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    icon: Clock,
  },
  INVOICE_CANCELLED: {
    label: "Invoice Cancelled",
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    icon: Trash2,
  },
  INVOICE_STATUS_CHANGED: {
    label: "Invoice Status",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    icon: RefreshCw,
  },
  INVOICE_UPDATED: {
    label: "Invoice Updated",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    icon: Edit3,
  },
  INVOICE_DELETED: {
    label: "Invoice Deleted",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    icon: Trash2,
  },
  PAYMENT_CREATED: {
    label: "Payment Recorded",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: Receipt,
  },
  PAYMENT_UPDATED: {
    label: "Payment Updated",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Edit3,
  },
  PAYMENT_DELETED: {
    label: "Payment Deleted",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    icon: Trash2,
  },
};

function formatTimestamp(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export default function AuditLogSheet({
  log,
  open,
  onOpenChange,
}) {
  const [showRaw, setShowRaw] = useState(false);

  if (!log) return null;

  const config = ACTION_CONFIG[log.action] || {
    label: log.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    icon: ActivityIcon,
  };

  const Icon = config.icon;
  const details = log.details || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md md:max-w-lg p-0">
        {/* Header */}
        <SheetHeader className="p-6 border-b bg-card/60">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant="outline"
              className={cn("gap-1.5 px-2.5 py-0.5 text-xs font-semibold shadow-none", config.badgeClass)}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{config.label}</span>
            </Badge>
          </div>
          <SheetTitle className="text-lg font-bold text-foreground">
            Audit Event Details
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Event ID: <span className="font-mono text-foreground/80">{log.id}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Timestamp & Metadata Card */}
          <div className="rounded-xl border bg-card p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                <span>Recorded Timestamp</span>
              </span>
              <span className="font-medium text-foreground text-right">
                {formatTimestamp(log.createdAt)}
              </span>
            </div>

            {log.project && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FolderKanban className="size-3.5 text-primary" />
                  <span>Associated Project</span>
                </span>
                <Link
                  href={`/projects/${log.project.id}`}
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                >
                  <span className="truncate">{log.project.name}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </Link>
              </div>
            )}
          </div>

          {/* Human-Readable Event Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Event Summary
            </h4>

            {/* TASK STATUS CHANGED */}
            {log.action === "TASK_STATUS_CHANGED" && (
              <div className="rounded-xl border bg-card p-4 space-y-4">
                {details.taskTitle && (
                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-0.5">
                      Task
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {details.taskTitle}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[11px] text-muted-foreground block mb-2">
                    Status Transition
                  </span>
                  <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border">
                    <TaskStatusBadge status={details.from || "TODO"} />
                    <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                    <TaskStatusBadge status={details.to || "IN_PROGRESS"} />
                  </div>
                </div>
              </div>
            )}

            {/* TASK CREATED */}
            {log.action === "TASK_CREATED" && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <span className="text-[11px] text-muted-foreground block">
                  New Task
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {details.taskTitle || details.title || "Untitled Task"}
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  Task was initialized and assigned to this project.
                </p>
              </div>
            )}

            {/* TASK UPDATED */}
            {log.action === "TASK_UPDATED" && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <span className="text-[11px] text-muted-foreground block">
                  Modified Task
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {details.taskTitle || details.title || "Task"}
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  Task specifications or properties were updated.
                </p>
              </div>
            )}

            {/* TASK DELETED */}
            {log.action === "TASK_DELETED" && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <span className="text-[11px] text-muted-foreground block">
                  Deleted Task
                </span>
                <p className="text-sm font-semibold text-foreground line-through text-muted-foreground">
                  {details.taskTitle || details.title || "Task"}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 pt-1">
                  Task was removed from the database.
                </p>
              </div>
            )}

            {/* PROJECT STATUS CHANGED */}
            {log.action === "PROJECT_STATUS_CHANGED" && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <span className="text-[11px] text-muted-foreground block">
                  Project Status Transition
                </span>
                <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border">
                  <ProjectStatusBadge status={details.from || "DRAFT"} />
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  <ProjectStatusBadge status={details.to || "IN_PROGRESS"} />
                </div>
              </div>
            )}

            {/* PROJECT CREATED */}
            {log.action === "PROJECT_CREATED" && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Project Initialized
                </p>
                <p className="text-xs text-muted-foreground">
                  Project {log.project?.name ? `"${log.project.name}"` : ""} was created and initialized.
                </p>
              </div>
            )}

            {/* INVOICE STATUS CHANGED / LIFECYCLE */}
            {["INVOICE_STATUS_CHANGED", "INVOICE_SENT", "INVOICE_PAID", "INVOICE_OVERDUE", "INVOICE_CANCELLED"].includes(log.action) && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Invoice #{details.invoiceNumber || "N/A"}</span>
                  {details.total !== undefined && (
                    <span className="text-xs font-bold text-foreground font-mono">
                      ₹{Number(details.total).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {details.clientName && (
                  <p className="text-xs text-muted-foreground">
                    Client: <strong className="text-foreground">{details.clientName}</strong>
                  </p>
                )}
                {details.from && details.to ? (
                  <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border">
                    <InvoiceStatusBadge status={details.from} />
                    <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                    <InvoiceStatusBadge status={details.to} />
                  </div>
                ) : (
                  <div className="bg-muted/40 p-3 rounded-lg border">
                    <InvoiceStatusBadge status={details.to || log.action.replace("INVOICE_", "")} />
                  </div>
                )}
              </div>
            )}

            {/* INVOICE CREATED */}
            {log.action === "INVOICE_CREATED" && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Invoice #{details.invoiceNumber || "Created"}
                  </span>
                  {details.total !== undefined && (
                    <span className="text-xs font-bold text-primary font-mono">
                      ₹{Number(details.total).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {details.clientName && (
                  <p className="text-xs text-muted-foreground">
                    Billed to: <strong className="text-foreground">{details.clientName}</strong>
                  </p>
                )}
                {details.itemCount !== undefined && (
                  <p className="text-[11px] text-muted-foreground">
                    Contains {details.itemCount} itemized service{details.itemCount === 1 ? "" : "s"}.
                  </p>
                )}
              </div>
            )}

            {/* INVOICE UPDATED */}
            {log.action === "INVOICE_UPDATED" && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Invoice #{details.invoiceNumber || "Updated"}
                  </span>
                  {details.total !== undefined && (
                    <span className="text-xs font-bold text-foreground font-mono">
                      ₹{Number(details.total).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Invoice billing specifications and line items were updated.
                </p>
              </div>
            )}

            {/* INVOICE DELETED */}
            {log.action === "INVOICE_DELETED" && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <span className="text-sm font-semibold text-foreground line-through text-muted-foreground">
                  Invoice #{details.invoiceNumber || "Deleted"}
                </span>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Invoice and associated line items were removed from the database.
                </p>
              </div>
            )}

            {/* PAYMENT CREATED */}
            {log.action === "PAYMENT_CREATED" && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payment Received
                  </span>
                  {details.amount !== undefined && (
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      +₹{Number(details.amount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Method</span>
                    <span className="font-medium text-foreground">{details.paymentMethod || "Standard"}</span>
                  </div>
                  {details.referenceNumber && (
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Reference / TXN</span>
                      <span className="font-mono font-medium text-foreground truncate block">{details.referenceNumber}</span>
                    </div>
                  )}
                  {details.invoiceId && (
                    <div className="col-span-2 pt-1">
                      <span className="text-muted-foreground block text-[11px]">Applied to Invoice</span>
                      <Link
                        href={`/invoices/${details.invoiceId}`}
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>#{details.invoiceNumber || details.invoiceId}</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  )}
                  {details.remainingBalance !== undefined && (
                    <div className="col-span-2 flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                      <span className="text-muted-foreground">Remaining Invoice Balance:</span>
                      <span className="font-mono font-bold text-foreground">
                        ₹{Number(details.remainingBalance).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PAYMENT UPDATED */}
            {log.action === "PAYMENT_UPDATED" && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payment Adjusted
                  </span>
                  {details.newAmount !== undefined && (
                    <div className="flex items-center gap-2 font-mono">
                      {details.oldAmount !== undefined && (
                        <span className="text-xs line-through text-muted-foreground">
                          ₹{Number(details.oldAmount).toLocaleString("en-IN")}
                        </span>
                      )}
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span className="text-sm font-bold text-foreground">
                        ₹{Number(details.newAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Method</span>
                    <span className="font-medium text-foreground">{details.paymentMethod || "Standard"}</span>
                  </div>
                  {details.referenceNumber && (
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Reference / TXN</span>
                      <span className="font-mono font-medium text-foreground truncate block">{details.referenceNumber}</span>
                    </div>
                  )}
                  {details.invoiceId && (
                    <div className="col-span-2 pt-1">
                      <span className="text-muted-foreground block text-[11px]">Invoice</span>
                      <Link
                        href={`/invoices/${details.invoiceId}`}
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>#{details.invoiceNumber || details.invoiceId}</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PAYMENT DELETED */}
            {log.action === "PAYMENT_DELETED" && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    Payment Removed
                  </span>
                  {details.amount !== undefined && (
                    <span className="text-xs font-bold line-through text-muted-foreground font-mono">
                      ₹{Number(details.amount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment record was deleted and invoice balance capacity was restored.
                </p>
                {details.invoiceId && (
                  <div className="pt-1 text-xs">
                    <Link
                      href={`/invoices/${details.invoiceId}`}
                      className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>View Invoice #{details.invoiceNumber || details.invoiceId}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Generic fallback */}
            {!["TASK_STATUS_CHANGED", "TASK_CREATED", "TASK_UPDATED", "TASK_DELETED", "PROJECT_STATUS_CHANGED", "PROJECT_CREATED", "INVOICE_STATUS_CHANGED", "INVOICE_SENT", "INVOICE_PAID", "INVOICE_OVERDUE", "INVOICE_CANCELLED", "INVOICE_CREATED", "INVOICE_UPDATED", "INVOICE_DELETED", "PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_DELETED"].includes(log.action) && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {config.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Activity event was executed and recorded.
                </p>
              </div>
            )}
          </div>

          {/* Collapsible Raw Technical Data */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-9 px-3 border border-dashed rounded-lg cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <Code2 className="size-3.5" />
                <span>Raw Audit Payload</span>
              </span>
              {showRaw ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </Button>

            {showRaw && (
              <pre className="mt-2.5 p-3 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground overflow-x-auto border">
                {JSON.stringify(
                  {
                    id: log.id,
                    action: log.action,
                    userId: log.userId,
                    projectId: log.projectId,
                    details: log.details,
                    createdAt: log.createdAt,
                  },
                  null,
                  2,
                )}
              </pre>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
