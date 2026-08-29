"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Flame,
} from "lucide-react";

const PRIORITY_CONFIG = {
  LOW: {
    label: "Low",
    icon: ArrowDown,
    className:
      "bg-slate-100 text-slate-700 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  MEDIUM: {
    label: "Medium",
    icon: ArrowRight,
    className:
      "bg-sky-50 text-sky-700 hover:bg-sky-50/80 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  HIGH: {
    label: "High",
    icon: ArrowUp,
    className:
      "bg-orange-50 text-orange-700 hover:bg-orange-50/80 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
  URGENT: {
    label: "Urgent",
    icon: Flame,
    className:
      "bg-red-50 text-red-700 hover:bg-red-50/80 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse",
  },
};

export default function ProjectPriorityBadge({ priority, className }) {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority || "Normal",
    icon: ArrowRight,
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
