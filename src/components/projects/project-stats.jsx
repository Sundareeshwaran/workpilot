"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FolderGit2,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  FileEdit,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_DETAILS = [
  {
    key: "DRAFT",
    label: "Draft",
    icon: FileEdit,
    color: "bg-slate-500",
    textColor: "text-slate-700 dark:text-slate-300",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    icon: PlayCircle,
    color: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-300",
    badgeBg: "bg-blue-50 dark:bg-blue-950/60",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    key: "REVIEW",
    label: "In Review",
    icon: Clock,
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-50 dark:bg-amber-950/60",
    border: "border-amber-200 dark:border-amber-800",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
    icon: XCircle,
    color: "bg-rose-500",
    textColor: "text-rose-700 dark:text-rose-300",
    badgeBg: "bg-rose-50 dark:bg-rose-950/60",
    border: "border-rose-200 dark:border-rose-800",
  },
];

export default function ProjectStats({ refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/projects/stats");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load project statistics");
      }

      setStats(data.stats);
    } catch (err) {
      console.error("FETCH PROJECT STATS ERROR:", err);
      setError(err.message || "Unable to fetch project statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Failed to load statistics
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="gap-1.5 shrink-0"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>

        {/* Status Distribution Skeleton */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const total = stats?.totalProjects || 0;
  const inProgress = stats?.inProgressProjects || 0;
  const completed = stats?.completedProjects || 0;
  const overdue = stats?.overdueProjects || 0;
  const statusCounts = stats?.statusCounts || {
    DRAFT: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Four Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Projects */}
        <Card className="relative overflow-hidden transition-all hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Projects
            </CardTitle>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FolderGit2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All active & archived projects
            </p>
          </CardContent>
        </Card>

        {/* Card 2: In Progress */}
        <Card className="relative overflow-hidden transition-all hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              In Progress
            </CardTitle>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PlayCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {inProgress}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Completed */}
        <Card className="relative overflow-hidden transition-all hover:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed
            </CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {completed}
              </span>
              {total > 0 && (
                <span className="text-xs font-medium text-emerald-600/90 dark:text-emerald-400/90">
                  ({completionRate}%)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Overdue */}
        <Card
          className={cn(
            "relative overflow-hidden transition-all hover:shadow-sm",
            overdue > 0 &&
              "border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overdue
            </CardTitle>
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center",
                overdue > 0
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold tracking-tight",
                overdue > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              )}
            >
              {overdue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdue > 0
                ? "Past due date & uncompleted"
                : "No overdue deliverables"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Breakdown */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight">
              Status Distribution
            </h3>
            <span className="text-xs text-muted-foreground">
              ({total} {total === 1 ? "total project" : "total projects"})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStats}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto gap-1"
          >
            <RefreshCw className="size-3" />
            <span>Refresh Stats</span>
          </Button>
        </div>

        {/* Multi-segment distribution progress bar */}
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex mb-4">
          {total === 0 ? (
            <div className="w-full h-full bg-muted" />
          ) : (
            STATUS_DETAILS.map((status) => {
              const count = statusCounts[status.key] || 0;
              const percentage = (count / total) * 100;
              if (percentage === 0) return null;
              return (
                <div
                  key={status.key}
                  style={{ width: `${percentage}%` }}
                  className={cn("h-full transition-all", status.color)}
                  title={`${status.label}: ${count} (${Math.round(percentage)}%)`}
                />
              );
            })
          )}
        </div>

        {/* Status items cards/chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {STATUS_DETAILS.map((status) => {
            const count = statusCounts[status.key] || 0;
            const percentage =
              total > 0 ? Math.round((count / total) * 100) : 0;
            const Icon = status.icon;

            return (
              <div
                key={status.key}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg border bg-card/60 transition-colors",
                  status.border
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      "size-6 rounded-md flex items-center justify-center shrink-0",
                      status.badgeBg,
                      status.textColor
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {status.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {percentage}%
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold ml-2 tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
