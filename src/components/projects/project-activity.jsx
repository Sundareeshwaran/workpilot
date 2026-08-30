"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  FolderPlus,
  Edit3,
  RefreshCw,
  Clock,
  Activity as ActivityIcon,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ProjectStatusBadge from "@/components/projects/project-status-badge";

function getActionDetails(action, details) {
  switch (action) {
    case "PROJECT_CREATED":
      return {
        label: "Project Created",
        description: "Project was created and initialized.",
        icon: FolderPlus,
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
      };
    case "PROJECT_STATUS_CHANGED":
      return {
        label: "Status Changed",
        description: details?.from && details?.to
          ? `Status changed from ${details.from} to ${details.to}`
          : "Project status was updated.",
        icon: RefreshCw,
        badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20",
      };
    case "PROJECT_UPDATED":
      return {
        label: "Project Updated",
        description: "Project specifications, details, or timeline were modified.",
        icon: Edit3,
        badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
      };
    default:
      return {
        label: action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        description: "Project activity was recorded.",
        icon: ActivityIcon,
        badgeClass: "bg-primary/10 text-primary border-primary/20",
        iconBg: "bg-primary/10 text-primary ring-primary/20",
      };
  }
}

function formatActivityDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function ProjectActivity({ projectId, refreshTrigger }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/activities`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load project activity");
      }

      setActivities(data.activities || []);
    } catch (err) {
      console.error("FETCH ACTIVITIES ERROR:", err);
      setError(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities, refreshTrigger]);

  return (
    <Card className="shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 border-b bg-muted/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="size-4 text-primary" />
              Activity Timeline
            </CardTitle>
            {!loading && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                {activities.length} {activities.length === 1 ? "event" : "events"}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Audit trail of project updates, status transitions, and history.
          </CardDescription>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchActivities}
          disabled={loading}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
          title="Refresh activity logs"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="size-9 rounded-full shrink-0" />
                <div className="space-y-2 flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-destructive font-medium mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border/80 bg-muted/10">
            <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 ring-6 ring-primary/5">
              <Sparkles className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No activities recorded yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Events will be automatically logged when changes are made to this project.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-8 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
            {activities.map((item, index) => {
              const info = getActionDetails(item.action, item.details);
              const Icon = info.icon;
              const formattedDate = formatActivityDate(item.createdAt);
              const isStatusChange = item.action === "PROJECT_STATUS_CHANGED" && item.details?.from && item.details?.to;

              return (
                <div key={item.id || index} className="relative flex items-start gap-4 group">
                  {/* Timeline Dot Icon */}
                  <div
                    className={cn(
                      "absolute -left-[30px] top-0 size-7 rounded-full flex items-center justify-center ring-4 ring-background shadow-xs z-10 transition-transform group-hover:scale-110",
                      info.iconBg
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 min-w-0 bg-card border rounded-xl p-3.5 shadow-2xs hover:border-primary/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-semibold px-2 py-0.5", info.badgeClass)}
                        >
                          {info.label}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground/80 hidden sm:inline">
                          #{item.action}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <Clock className="size-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {isStatusChange ? (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Transitioned:</span>
                        <ProjectStatusBadge status={item.details.from} />
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <ProjectStatusBadge status={item.details.to} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        {info.description}
                      </p>
                    )}

                    {item.details &&
                      typeof item.details === "object" &&
                      !isStatusChange &&
                      Object.keys(item.details).length > 0 && (
                        <div className="mt-2 text-[11px] font-mono bg-muted/50 p-2 rounded-md border text-muted-foreground overflow-x-auto">
                          <pre>{JSON.stringify(item.details, null, 2)}</pre>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
