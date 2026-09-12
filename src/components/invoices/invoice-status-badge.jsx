"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileEdit,
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";

export const INVOICE_STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: FileEdit,
    badgeClass:
      "bg-slate-100 text-slate-700 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  SENT: {
    label: "Sent",
    icon: Send,
    badgeClass:
      "bg-sky-50 text-sky-700 hover:bg-sky-50/80 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  PAID: {
    label: "Paid",
    icon: CheckCircle2,
    badgeClass:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-50/80 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  OVERDUE: {
    label: "Overdue",
    icon: AlertCircle,
    badgeClass:
      "bg-rose-50 text-rose-700 hover:bg-rose-50/80 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    badgeClass:
      "bg-zinc-100 text-zinc-600 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  },
};

export default function InvoiceStatusBadge({ status, className }) {
  const config = INVOICE_STATUS_CONFIG[status] || {
    label: status || "Unknown",
    icon: AlertCircle,
    badgeClass: "bg-muted text-muted-foreground",
  };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-0.5 font-medium transition-colors shadow-none text-xs whitespace-nowrap",
        config.badgeClass,
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{config.label}</span>
    </Badge>
  );
}
