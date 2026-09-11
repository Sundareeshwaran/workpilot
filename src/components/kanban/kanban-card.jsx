"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  MoreVertical,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  FolderKanban,
  GripVertical,
} from "lucide-react";
import TaskPriorityBadge from "@/components/tasks/task-priority-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isDateOverdue(dueDate) {
  if (!dueDate) return false;
  const target = new Date(dueDate);
  const now = new Date();
  return target.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0);
}

export default function KanbanCard({
  task,
  onStatusChange,
  onDelete,
  isUpdating = false,
}) {
  const [updating, setUpdating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isBusy = updating || isUpdating;
  const isDone = task.status === "DONE";
  const formattedDueDate = formatDate(task.dueDate);
  const isOverdue = !isDone && isDateOverdue(task.dueDate);

  const handleStatusSelect = async (newStatus) => {
    if (newStatus === task.status || isBusy) return;
    setUpdating(true);
    try {
      await onStatusChange?.(task.id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const handleDragStart = (e) => {
    if (isBusy) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        taskId: task.id,
        sourceStatus: task.status || "TODO",
      }),
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={!isBusy}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      aria-label={`Task: ${task.title}. Status: ${task.status?.replace("_", " ") || "To Do"}. Priority: ${task.priority || "Medium"}.${isUpdating ? " Updating..." : ""}`}
      className={cn(
        "group relative rounded-xl border bg-card p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:border-border/80 dark:hover:border-slate-700 select-none",
        isBusy ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
        isDone && "bg-card/60 opacity-80",
        isUpdating && !isDragging && "opacity-60 pointer-events-none",
        isDragging &&
          "opacity-40 scale-[0.98] ring-2 ring-primary/40 border-primary shadow-lg rotate-1",
      )}
    >
      {/* Per-task loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[1px]">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}
      {/* Top row: Status/Priority badges, project tag, and action dropdown */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <GripVertical className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/80 shrink-0 -ml-1 transition-colors" />
          {task.project?.name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 max-w-[140px] truncate">
              <FolderKanban className="size-2.5 shrink-0" />
              <span className="truncate">{task.project.name}</span>
            </span>
          )}
          {task.priority && <TaskPriorityBadge priority={task.priority} />}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {updating && !isUpdating && <Loader2 className="size-3.5 animate-spin text-primary mr-1" />}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-muted-foreground opacity-70 group-hover:opacity-100 hover:bg-accent hover:text-foreground cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-3.5" />
                <span className="sr-only">Task options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                Move Status
              </DropdownMenuLabel>
              {task.status !== "TODO" && (
                <DropdownMenuItem
                  onClick={() => handleStatusSelect("TODO")}
                  className="cursor-pointer gap-2"
                >
                  <Circle className="size-3.5 text-slate-500" />
                  <span>To Do</span>
                </DropdownMenuItem>
              )}
              {task.status !== "IN_PROGRESS" && (
                <DropdownMenuItem
                  onClick={() => handleStatusSelect("IN_PROGRESS")}
                  className="cursor-pointer gap-2"
                >
                  <Clock className="size-3.5 text-blue-500" />
                  <span>In Progress</span>
                </DropdownMenuItem>
              )}
              {task.status !== "DONE" && (
                <DropdownMenuItem
                  onClick={() => handleStatusSelect("DONE")}
                  className="cursor-pointer gap-2"
                >
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span>Done</span>
                </DropdownMenuItem>
              )}

              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Task</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task Title */}
      <h4
        className={cn(
          "text-sm font-semibold text-foreground leading-snug break-words mb-1.5",
          isDone && "line-through text-muted-foreground",
        )}
      >
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p
          className={cn(
            "text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3 break-words",
            isDone && "line-through text-muted-foreground/60",
          )}
        >
          {task.description}
        </p>
      )}

      {/* Footer: Due date and quick status toggle */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {formattedDueDate ? (
            <span
              className={cn(
                "flex items-center gap-1 text-[11px]",
                isOverdue
                  ? "text-rose-600 dark:text-rose-400 font-medium"
                  : "text-muted-foreground",
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="size-3 shrink-0" />
              ) : (
                <Calendar className="size-3 shrink-0" />
              )}
              <span>{formattedDueDate}</span>
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/50">No due date</span>
          )}
        </div>

        {/* Quick next-state advance shortcut button */}
        {task.status === "TODO" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusSelect("IN_PROGRESS")}
            disabled={isBusy}
            className="h-6 px-2 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 gap-1 rounded-md cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span>Start</span>
            <ArrowRight className="size-3" />
          </Button>
        )}
        {task.status === "IN_PROGRESS" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusSelect("DONE")}
            disabled={isBusy}
            className="h-6 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1 rounded-md cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span>Complete</span>
            <CheckCircle2 className="size-3" />
          </Button>
        )}
        {task.status === "DONE" && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>Completed</span>
          </span>
        )}
      </div>
    </div>
  );
}
