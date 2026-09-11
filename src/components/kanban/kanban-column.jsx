"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Circle, Clock, CheckCircle2, ListTodo, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import KanbanCard from "./kanban-card";

const COLUMN_CONFIG = {
  TODO: {
    title: "To Do",
    icon: Circle,
    accentColor: "bg-slate-500",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    headerBg: "bg-slate-500/5",
    borderTint: "border-t-slate-400 dark:border-t-slate-600",
    emptyText: "No tasks to do",
    dropGlow: "ring-slate-400/40 border-slate-400 bg-slate-500/5",
  },
  IN_PROGRESS: {
    title: "In Progress",
    icon: Clock,
    accentColor: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    headerBg: "bg-blue-500/5",
    borderTint: "border-t-blue-500",
    emptyText: "No tasks in progress",
    dropGlow: "ring-blue-500/40 border-blue-500 bg-blue-500/5",
  },
  DONE: {
    title: "Done",
    icon: CheckCircle2,
    accentColor: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    headerBg: "bg-emerald-500/5",
    borderTint: "border-t-emerald-500",
    emptyText: "No completed tasks yet",
    dropGlow: "ring-emerald-500/40 border-emerald-500 bg-emerald-500/5",
  },
};

export default function KanbanColumn({
  status,
  title: customTitle,
  tasks = [],
  onAddTask,
  onStatusChange,
  onDelete,
  onDropTask,
  updatingTaskIds = new Set(),
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const config = COLUMN_CONFIG[status] || {
    title: customTitle || status || "Column",
    icon: ListTodo,
    accentColor: "bg-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
    headerBg: "bg-muted/30",
    borderTint: "border-t-muted",
    emptyText: "No tasks in this column",
    dropGlow: "ring-primary/40 border-primary bg-primary/5",
  };

  const title = customTitle || config.title;
  const Icon = config.icon;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    // Only deactivate if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const rawData = e.dataTransfer.getData("application/json");
      if (!rawData) return;
      const data = JSON.parse(rawData);
      if (data?.taskId) {
        onDropTask?.(data.taskId, status, data.sourceStatus);
      }
    } catch (err) {
      console.error("KANBAN DROP PARSE ERROR:", err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col h-full rounded-2xl border bg-muted/25 border-border/80 p-3 sm:p-4 min-w-[280px] transition-all duration-200",
        isDragOver &&
          cn(
            "ring-2 shadow-lg scale-[1.01]",
            config.dropGlow,
          ),
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("size-2 rounded-full shrink-0", config.accentColor)} />
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground truncate">
              {title}
            </h3>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 transition-colors",
              config.badgeClass,
            )}
          >
            {tasks.length}
          </span>
        </div>

        {onAddTask && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddTask(status)}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer"
            title={`Add task to ${title}`}
          >
            <Plus className="size-3.5" />
            <span className="sr-only">Add task to {title}</span>
          </Button>
        )}
      </div>

      {/* Task List / Column Content */}
      <div className="flex-1 space-y-3 min-h-[160px] overflow-y-auto">
        {/* Drop zone visual hint when dragging over */}
        {isDragOver && (
          <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-dashed border-primary bg-primary/10 text-primary text-xs font-semibold animate-pulse">
            <ArrowDown className="size-3.5" />
            <span>Drop to move to {title}</span>
          </div>
        )}

        {tasks.length > 0 ? (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              isUpdating={updatingTaskIds.has(task.id)}
            />
          ))
        ) : !isDragOver ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[140px] rounded-xl border border-dashed border-border/70 p-4 text-center bg-card/30">
            <p className="text-xs font-medium text-muted-foreground/70 mb-2">
              {config.emptyText}
            </p>
            {onAddTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddTask(status)}
                className="h-7 text-xs gap-1 border-dashed text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add Task</span>
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
