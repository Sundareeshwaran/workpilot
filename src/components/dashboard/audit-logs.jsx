"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  History,
  FolderPlus,
  RefreshCw,
  Edit3,
  Trash2,
  FileText,
  Activity as ActivityIcon,
  FolderKanban,
  AlertCircle,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import AuditLogSheet from "./audit-log-sheet";

const ACTION_CONFIG = {
  TASK_CREATED: {
    label: "Task Created",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: FolderPlus,
  },
  TASK_STATUS_CHANGED: {
    label: "Status Changed",
    badgeClass:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    icon: RefreshCw,
  },
  TASK_UPDATED: {
    label: "Task Updated",
    badgeClass:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    icon: Edit3,
  },
  TASK_DELETED: {
    label: "Task Deleted",
    badgeClass:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    icon: Trash2,
  },
  PROJECT_CREATED: {
    label: "Project Created",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: FolderPlus,
  },
  PROJECT_STATUS_CHANGED: {
    label: "Project Status",
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: RefreshCw,
  },
  PROJECT_UPDATED: {
    label: "Project Updated",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: Edit3,
  },
  INVOICE_CREATED: {
    label: "Invoice Created",
    badgeClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    icon: FileText,
  },
  INVOICE_STATUS_CHANGED: {
    label: "Invoice Status",
    badgeClass:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    icon: RefreshCw,
  },
  INVOICE_UPDATED: {
    label: "Invoice Updated",
    badgeClass:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    icon: Edit3,
  },
  INVOICE_DELETED: {
    label: "Invoice Deleted",
    badgeClass:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    icon: Trash2,
  },
};

function formatTimestamp(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getLogDescription(log) {
  const details = log.details || {};
  switch (log.action) {
    case "TASK_STATUS_CHANGED":
      return details.from && details.to
        ? `${details.taskTitle ? `"${details.taskTitle}": ` : ""}${details.from.replace("_", " ")} → ${details.to.replace("_", " ")}`
        : details.taskTitle || "Task status changed";
    case "TASK_CREATED":
      return details.taskTitle || details.title
        ? `Created task "${details.taskTitle || details.title}"`
        : "Created new task";
    case "TASK_UPDATED":
      return details.taskTitle || details.title
        ? `Updated task "${details.taskTitle || details.title}"`
        : "Updated task details";
    case "TASK_DELETED":
      return `Deleted task "${details.taskTitle || details.title || "Task"}"`;
    case "PROJECT_STATUS_CHANGED":
      return details.from && details.to
        ? `Status: ${details.from.replace("_", " ")} → ${details.to.replace("_", " ")}`
        : "Project status changed";
    case "PROJECT_CREATED":
      return log.project?.name
        ? `Created project "${log.project.name}"`
        : "Created project";
    case "PROJECT_UPDATED":
      return log.project?.name
        ? `Updated "${log.project.name}"`
        : "Updated project specifications";
    case "INVOICE_CREATED":
      return details.invoiceNumber
        ? `Created invoice #${details.invoiceNumber}${details.clientName ? ` for ${details.clientName}` : ""}${details.total ? ` (₹${Number(details.total).toLocaleString("en-IN")})` : ""}`
        : "Created new client invoice";
    case "INVOICE_STATUS_CHANGED":
      return details.invoiceNumber && details.from && details.to
        ? `Invoice #${details.invoiceNumber} status: ${details.from} → ${details.to}`
        : "Updated invoice status";
    case "INVOICE_UPDATED":
      return details.invoiceNumber
        ? `Updated invoice #${details.invoiceNumber}`
        : "Updated invoice details";
    case "INVOICE_DELETED":
      return details.invoiceNumber
        ? `Deleted invoice #${details.invoiceNumber}`
        : "Deleted client invoice";
    default:
      return log.action.replace(/_/g, " ").toLowerCase();
  }
}

export default function AuditLogs({ initialLogs = [] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(initialLogs.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Pagination state (min 15 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchLogs = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch("/api/audit-logs");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load audit logs");
      }

      setLogs(data.logs || []);
    } catch (err) {
      console.error("FETCH AUDIT LOGS ERROR:", err);
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setSheetOpen(true);
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(logs.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, logs.length);
  const currentLogs = useMemo(() => {
    return logs.slice(startIndex, endIndex);
  }, [logs, startIndex, endIndex]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card/70 backdrop-blur-md p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <History className="size-3.5" />
              <span>System Audit Trail</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Audit & Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Complete chronological audit trail of all project milestones, task
              creations, status updates, and lifecycle operations.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            className="gap-2 cursor-pointer shadow-xs self-start md:self-auto shrink-0"
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                refreshing && "animate-spin text-primary",
              )}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh Logs"}</span>
          </Button>
        </div>
      </div>

      {/* Logs Table Card */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="border-b bg-muted/20 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold">
                Activity Records Table
              </CardTitle>
              <CardDescription className="text-xs">
                Click any row to inspect complete event metadata and payload
                details
              </CardDescription>
            </div>
            {!loading && !error && (
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold px-2.5 py-0.5"
                >
                  {logs.length} Total Events
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Loading Skeleton Table */}
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(itemsPerPage)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-3 w-1/4">
                    <Skeleton className="size-7 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-7 w-14 rounded-md" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="p-12 text-center space-y-3">
              <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Error Loading Logs
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs()}
                className="gap-2 text-xs cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                Try Again
              </Button>
            </div>
          ) : logs.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                <History className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  No Audit Logs Recorded
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                  Activity events from task creations, status changes, and
                  project updates will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            /* Audit Logs Table */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[18%] pl-6">
                      Action
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[38%]">
                      Event Summary
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[18%]">
                      Project
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[18%]">
                      Timestamp
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right w-[8%] pr-6">
                      Details
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentLogs.map((log) => {
                    const config = ACTION_CONFIG[log.action] || {
                      label: log.action
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase()),
                      badgeClass:
                        "bg-primary/10 text-primary border-primary/20",
                      icon: ActivityIcon,
                    };
                    const Icon = config.icon;
                    const description = getLogDescription(log);

                    return (
                      <TableRow
                        key={log.id}
                        onClick={() => handleRowClick(log)}
                        className="group hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        {/* Action Column */}
                        <TableCell className="py-3.5 pl-6 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                              <Icon className="size-3.5 text-foreground/70 group-hover:text-primary transition-colors" />
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-semibold shadow-none whitespace-nowrap",
                                config.badgeClass,
                              )}
                            >
                              {config.label}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Summary / Description Column */}
                        <TableCell className="py-3.5 px-3">
                          <p className="text-sm font-medium text-foreground max-w-[380px] truncate group-hover:text-primary transition-colors">
                            {description}
                          </p>
                        </TableCell>

                        {/* Project Column */}
                        <TableCell className="py-3.5 px-3">
                          {log.project?.name ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium truncate max-w-[170px]">
                              <FolderKanban className="size-3.5 text-primary/70 shrink-0" />
                              <span className="truncate">
                                {log.project.name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Timestamp Column */}
                        <TableCell className="py-3.5 px-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
                            <span>{formatTimestamp(log.createdAt)}</span>
                          </div>
                        </TableCell>

                        {/* Action Inspect Button */}
                        <TableCell className="py-3.5 pl-3 pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(log);
                            }}
                            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Eye className="size-3.5 mr-1" />
                            <span>Inspect</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls (Min 15 per page) */}
          {!loading && !error && logs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/10 text-xs text-muted-foreground">
              {/* Range indicator & items per page */}
              <div className="flex items-center gap-3">
                <span>
                  Showing{" "}
                  <strong className="text-foreground font-semibold">
                    {startIndex + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-foreground font-semibold">
                    {endIndex}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-foreground font-semibold">
                    {logs.length}
                  </strong>{" "}
                  events
                </span>

                <div className="flex items-center gap-1.5 pl-2 border-l">
                  <span>Per page:</span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(val) => {
                      setItemsPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-7 w-[68px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Page navigation buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 text-xs"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  title="First Page"
                >
                  <ChevronsLeft className="size-3.5" />
                  <span className="sr-only">First Page</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 text-xs"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage <= 1}
                  title="Previous Page"
                >
                  <ChevronLeft className="size-3.5" />
                  <span className="sr-only">Previous Page</span>
                </Button>

                <span className="px-2.5 py-1 rounded-md bg-muted/60 border text-xs font-medium text-foreground">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 text-xs"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={safeCurrentPage >= totalPages}
                  title="Next Page"
                >
                  <ChevronRight className="size-3.5" />
                  <span className="sr-only">Next Page</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 text-xs"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  title="Last Page"
                >
                  <ChevronsRight className="size-3.5" />
                  <span className="sr-only">Last Page</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Detail Sheet */}
      <AuditLogSheet
        log={selectedLog}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
