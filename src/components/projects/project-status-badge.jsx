"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  FileEdit,
  XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: FileEdit,
    className:
      "bg-slate-100 text-slate-700 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: PlayCircle,
    className:
      "bg-blue-50 text-blue-700 hover:bg-blue-50/80 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  REVIEW: {
    label: "In Review",
    icon: Clock,
    className:
      "bg-amber-50 text-amber-700 hover:bg-amber-50/80 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-50/80 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className:
      "bg-rose-50 text-rose-700 hover:bg-rose-50/80 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
};

export default function ProjectStatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    icon: AlertCircle,
    className: "bg-muted text-muted-foreground",
  };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-0.5 font-medium transition-colors shadow-none text-xs",
        config.className,
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{config.label}</span>
    </Badge>
  );
}
