"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  History,
  FolderPlus,
  Edit3,
  RefreshCw,
  Clock,
  Activity as ActivityIcon,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import ProjectStatusBadge from "@/components/projects/project-status-badge";
import TaskStatusBadge from "@/components/tasks/task-status-badge";

const ITEMS_PER_PAGE = 5;

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
    case "TASK_CREATED":
      return {
        label: "Task Created",
        description: details?.taskTitle || details?.title
          ? `Task "${details.taskTitle || details.title}" was created.`
          : "A new task was created.",
        icon: FolderPlus,
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
      };
    case "TASK_STATUS_CHANGED":
      return {
        label: "Task Status",
        description: details?.from && details?.to
          ? `${details.taskTitle ? `"${details.taskTitle}": ` : ""}${details.from.replace("_", " ")} → ${details.to.replace("_", " ")}`
          : "Task status was updated.",
        icon: RefreshCw,
        badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800",
        iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20",
      };
    case "TASK_UPDATED":
      return {
        label: "Task Updated",
        description: details?.taskTitle
          ? `Task "${details.taskTitle}" details were updated.`
          : "Task details were updated.",
        icon: Edit3,
        badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20",
      };
    case "TASK_DELETED":
      return {
        label: "Task Deleted",
        description: details?.taskTitle
          ? `Task "${details.taskTitle}" was deleted.`
          : "A task was deleted.",
        icon: ActivityIcon,
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
      };
    default:
      return {
        label: action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        description: "Activity was recorded.",
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
  const [currentPage, setCurrentPage] = useState(1);

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

  // Calculate pagination values
  const totalPages = Math.max(1, Math.ceil(activities.length / ITEMS_PER_PAGE));

  // Reset page to 1 if currentPage exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return activities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activities, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, activities.length);

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
            Audit trail of project updates, status transitions, and task history.
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

      <CardContent className="p-0">
        {loading ? (
          <div className="p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-7 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
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
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-none bg-muted/10">
            <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 ring-6 ring-primary/5">
              <Sparkles className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No activities recorded yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Events will be automatically logged when changes are made to this project.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[180px] text-xs font-semibold">Event</TableHead>
                  <TableHead className="text-xs font-semibold">Details</TableHead>
                  <TableHead className="w-[190px] text-right text-xs font-semibold">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.map((item, index) => {
                  const info = getActionDetails(item.action, item.details);
                  const Icon = info.icon;
                  const formattedDate = formatActivityDate(item.createdAt);
                  const isProjectStatusChange =
                    item.action === "PROJECT_STATUS_CHANGED" &&
                    item.details?.from &&
                    item.details?.to;
                  const isTaskStatusChange =
                    item.action === "TASK_STATUS_CHANGED" &&
                    item.details?.from &&
                    item.details?.to;

                  return (
                    <TableRow key={item.id || index} className="hover:bg-muted/30 transition-colors">
                      {/* Event Type & Badge */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "size-7 rounded-full flex items-center justify-center shrink-0 ring-2 ring-background shadow-2xs",
                              info.iconBg
                            )}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-medium px-2 py-0.5", info.badgeClass)}
                          >
                            {info.label}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Details */}
                      <TableCell className="align-middle">
                        {isProjectStatusChange ? (
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="text-muted-foreground">Status transitioned:</span>
                            <ProjectStatusBadge status={item.details.from} />
                            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                            <ProjectStatusBadge status={item.details.to} />
                          </div>
                        ) : isTaskStatusChange ? (
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {item.details.taskTitle && (
                              <span className="font-medium text-foreground">
                                &ldquo;{item.details.taskTitle}&rdquo;:
                              </span>
                            )}
                            <TaskStatusBadge status={item.details.from} />
                            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                            <TaskStatusBadge status={item.details.to} />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs text-foreground font-normal">
                              {info.description}
                            </p>
                            {item.details &&
                              typeof item.details === "object" &&
                              !isProjectStatusChange &&
                              !isTaskStatusChange &&
                              Object.keys(item.details).length > 0 &&
                              !item.details.taskTitle &&
                              !item.details.title && (
                                <div className="text-[11px] font-mono text-muted-foreground/90 bg-muted/40 px-2 py-1 rounded border inline-block max-w-full truncate">
                                  {JSON.stringify(item.details)}
                                </div>
                              )}
                          </div>
                        )}
                      </TableCell>

                      {/* Timestamp */}
                      <TableCell className="text-right align-middle">
                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3 shrink-0" />
                          <span className="whitespace-nowrap">{formattedDate}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Pagination Footer */}
      {!loading && !error && activities.length > 0 && (
        <CardFooter className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {startIndex}–{endIndex}
            </span>{" "}
            of <span className="font-medium text-foreground">{activities.length}</span>{" "}
            {activities.length === 1 ? "event" : "events"}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
