"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  TODO: {
    label: "To Do",
    icon: Circle,
    className:
      "bg-slate-100 text-slate-700 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Clock,
    className:
      "bg-blue-50 text-blue-700 hover:bg-blue-50/80 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  DONE: {
    label: "Done",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-50/80 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
};

export default function TaskStatusBadge({ status, className }) {
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
        "gap-1 px-2 py-0.5 font-medium transition-colors shadow-none text-xs",
        config.className,
        className
      )}
    >
      <Icon className="size-3 shrink-0" />
      <span>{config.label}</span>
    </Badge>
  );
}
