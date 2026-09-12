"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Sparkles,
  Layers,
  Circle,
  Clock,
  CheckCircle2,
  SearchX,
  RotateCcw,
  ListTodo,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import KanbanBoard from "@/components/kanban/kanban-board";
import AddTaskDialog from "@/components/tasks/add-task-dialog";
import EditTaskDialog from "@/components/tasks/edit-task-dialog";
import DeleteTaskDialog from "@/components/tasks/delete-task-dialog";
import TaskFilters from "@/components/tasks/task-filters";
import TaskStatusBadge from "@/components/tasks/task-status-badge";
import TaskPriorityBadge from "@/components/tasks/task-priority-badge";
import {
  filterTasks,
  calculateDaysRemaining,
} from "@/lib/task-filter-utils";
import { cn } from "@/lib/utils";

function formatDate(dateString) {
  if (!dateString) return "Not Set";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Not Set";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesKanbanView({
  initialTasks = [],
  projects = [],
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDueDate, setSelectedDueDate] = useState("ALL");
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "list"

  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState("TODO");

  const [taskToEdit, setTaskToEdit] = useState(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);

  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState(new Set());

  const handleOpenAddTask = (status = "TODO") => {
    setDefaultTaskStatus(status);
    setAddTaskOpen(true);
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
    );
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedProject("ALL");
    setSelectedPriority("ALL");
    setSelectedStatus("ALL");
    setSelectedDueDate("ALL");
  }, []);

  const handleStatusChange = useCallback(
    async (taskId, newStatus) => {
      if (updatingTaskIds.has(taskId)) return;

      try {
        setUpdatingTaskIds((prev) => new Set(prev).add(taskId));
        setUpdatingTaskId(taskId);

        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update task status");
        }

        handleTaskUpdated(data.task);
        toast.success(
          `Task moved to ${newStatus.replace("_", " ").toLowerCase()}`,
        );
      } catch (err) {
        console.error("STATUS UPDATE ERROR:", err);
        toast.error(err.message || "Failed to update task status");
        throw err;
      } finally {
        setUpdatingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        setUpdatingTaskId(null);
      }
    },
    [updatingTaskIds],
  );

  const handlePriorityChange = useCallback(
    async (taskId, newPriority) => {
      try {
        setUpdatingTaskId(taskId);
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority: newPriority }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update task priority");
        }
        handleTaskUpdated(data.task);
        toast.success(
          `Task priority updated to ${newPriority.toLowerCase()}`,
        );
      } catch (err) {
        console.error("PRIORITY UPDATE ERROR:", err);
        toast.error(err.message || "Failed to update task priority");
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [],
  );

  const handleDropTask = useCallback(
    async (taskId, targetStatus, sourceStatus) => {
      if (targetStatus === sourceStatus) return;
      if (updatingTaskIds.has(taskId)) return;

      const taskToMove = tasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      const previousTasks = [...tasks];

      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)),
      );

      try {
        setUpdatingTaskIds((prev) => new Set(prev).add(taskId));

        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update task status");
        }

        handleTaskUpdated(data.task);
        toast.success(
          `Task moved to ${targetStatus.replace("_", " ").toLowerCase()}`,
        );
      } catch (err) {
        console.error("DRAG & DROP ERROR:", err);
        setTasks(previousTasks);
        toast.error(err.message || "Failed to move task. Reverting change.");
      } finally {
        setUpdatingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [updatingTaskIds, tasks],
  );

  // Filter tasks client-side without mutating source data
  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, {
      searchQuery,
      statusFilter: selectedStatus,
      priorityFilter: selectedPriority,
      dueDateFilter: selectedDueDate,
      projectFilter: selectedProject,
    });
  }, [
    tasks,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedDueDate,
    selectedProject,
  ]);

  // Status counts for overview stats
  const stats = useMemo(() => {
    const todo = tasks.filter((t) => (t.status || "TODO") === "TODO").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    return {
      total: tasks.length,
      todo,
      inProgress,
      done,
    };
  }, [tasks]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card/70 backdrop-blur-md p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="size-3.5" />
              <span>Kanban Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Notes & Task Board
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Organize deliverables, design conversations, notes, and milestones across all your projects in an interactive Kanban board.
            </p>
          </div>

          <Button
            size="default"
            onClick={() => handleOpenAddTask("TODO")}
            className="gap-2 cursor-pointer shadow-xs self-start md:self-auto shrink-0"
          >
            <Plus className="size-4" />
            <span>New Task / Note</span>
          </Button>
        </div>

        {/* Metric Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border/60">
          <Card className="bg-background/60 shadow-none border-border/70">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Total Items
                </p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/60 shadow-none border-border/70">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">To Do</p>
                <p className="text-xl font-bold text-foreground">{stats.todo}</p>
              </div>
              <div className="size-8 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                <Circle className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/60 shadow-none border-border/70">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-blue-500">In Progress</p>
                <p className="text-xl font-bold text-foreground">{stats.inProgress}</p>
              </div>
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/60 shadow-none border-border/70">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-emerald-500">Done</p>
                <p className="text-xl font-bold text-foreground">{stats.done}</p>
              </div>
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="size-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Filters Bar Card */}
      <Card className="shadow-xs p-4 bg-card/60 backdrop-blur-xs">
        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={selectedStatus}
          onStatusChange={setSelectedStatus}
          priorityFilter={selectedPriority}
          onPriorityChange={setSelectedPriority}
          dueDateFilter={selectedDueDate}
          onDueDateChange={setSelectedDueDate}
          projectFilter={selectedProject}
          onProjectChange={setSelectedProject}
          projects={projects}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={tasks.length}
          filteredCount={filteredTasks.length}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {/* Main Task View: Kanban or List */}
      {tasks.length > 0 ? (
        filteredTasks.length > 0 ? (
          viewMode === "kanban" ? (
            /* Kanban Board */
            <KanbanBoard
              tasks={filteredTasks}
              onAddTask={handleOpenAddTask}
              onStatusChange={handleStatusChange}
              onTaskUpdated={handleTaskUpdated}
              onDelete={handleTaskDeleted}
              onTaskDeleted={handleTaskDeleted}
              onDropTask={handleDropTask}
              updatingTaskIds={updatingTaskIds}
            />
          ) : (
            /* List View */
            <Card className="shadow-xs overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="divide-y divide-border/60">
                  {filteredTasks.map((task) => {
                    const isDone = task.status === "DONE";
                    const taskDaysRemaining = calculateDaysRemaining(task.dueDate);
                    const isTaskOverdue =
                      taskDaysRemaining !== null &&
                      taskDaysRemaining < 0 &&
                      !isDone;
                    const formattedDueDate = formatDate(task.dueDate);

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors group",
                          isDone && "opacity-75",
                        )}
                      >
                        {/* Left: Check/Status icon, Title, Project, Description, Due Date */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="mt-0.5 shrink-0">
                            {isDone ? (
                              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            ) : task.status === "IN_PROGRESS" ? (
                              <Clock className="size-4 text-blue-500 dark:text-blue-400" />
                            ) : (
                              <Circle className="size-4 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                onClick={() => {
                                  setTaskToEdit(task);
                                  setEditTaskOpen(true);
                                }}
                                className={cn(
                                  "text-sm font-medium cursor-pointer hover:text-primary transition-colors",
                                  isDone
                                    ? "line-through text-muted-foreground hover:text-muted-foreground"
                                    : "text-foreground",
                                )}
                              >
                                {task.title}
                              </p>

                              {task.project?.name && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-medium bg-primary/10 text-primary border-primary/20"
                                >
                                  {task.project.name}
                                </Badge>
                              )}

                              {formattedDueDate !== "Not Set" && (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors",
                                    isTaskOverdue
                                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20"
                                      : "text-muted-foreground bg-muted/50 border border-border/50",
                                  )}
                                  title={
                                    isTaskOverdue
                                      ? `Overdue by ${Math.abs(taskDaysRemaining)} day${Math.abs(taskDaysRemaining) === 1 ? "" : "s"}`
                                      : `Due on ${formattedDueDate}`
                                  }
                                >
                                  {isTaskOverdue ? (
                                    <AlertTriangle className="size-3 shrink-0 text-rose-600 dark:text-rose-400 animate-pulse" />
                                  ) : (
                                    <Calendar className="size-3 shrink-0" />
                                  )}
                                  <span>
                                    {formattedDueDate}
                                    {isTaskOverdue && ` (${Math.abs(taskDaysRemaining)}d overdue)`}
                                  </span>
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p
                                className={cn(
                                  "text-xs line-clamp-1",
                                  isDone
                                    ? "line-through text-muted-foreground/60"
                                    : "text-muted-foreground",
                                )}
                              >
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Priority Selector, Status Selector, Edit and Delete */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* Priority Selector */}
                          <Select
                            value={task.priority || "MEDIUM"}
                            onValueChange={(val) =>
                              handlePriorityChange(task.id, val)
                            }
                            disabled={updatingTaskId === task.id}
                          >
                            <SelectTrigger className="h-7 text-xs border rounded-md px-2 bg-background/50 hover:bg-background cursor-pointer">
                              <SelectValue>
                                <TaskPriorityBadge priority={task.priority || "MEDIUM"} />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Status Selector */}
                          <Select
                            value={task.status}
                            onValueChange={(val) =>
                              handleStatusChange(task.id, val)
                            }
                            disabled={updatingTaskId === task.id}
                          >
                            <SelectTrigger className="h-7 text-xs border rounded-md px-2 bg-background/50 hover:bg-background cursor-pointer">
                              <SelectValue>
                                <TaskStatusBadge status={task.status} />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="TODO">To Do</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="DONE">Done</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Edit Task Action Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                            onClick={() => {
                              setTaskToEdit(task);
                              setEditTaskOpen(true);
                            }}
                            title="Edit Task"
                          >
                            <Edit2 className="size-3.5" />
                            <span className="sr-only">Edit Task</span>
                          </Button>

                          {/* Delete Task Action Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => {
                              setTaskToDelete(task);
                              setDeleteTaskOpen(true);
                            }}
                            title="Delete Task"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete Task</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          /* Filter Results Empty State */
          <div className="py-16 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 space-y-3">
            <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <SearchX className="size-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                No matching tasks found
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                No tasks match your active filters or search terms. Try clearing your filters or refining your query.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs gap-1.5 cursor-pointer mt-2"
            >
              <RotateCcw className="size-3.5" />
              <span>Clear All Filters</span>
            </Button>
          </div>
        )
      ) : (
        /* Zero Total Tasks in Board */
        <div className="py-16 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 space-y-3">
          <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <ListTodo className="size-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              No tasks added yet
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Create deliverables, design conversations, or milestones to get started on your Kanban board.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenAddTask("TODO")}
            className="gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="size-4" />
            <span>Create First Task</span>
          </Button>
        </div>
      )}

      {/* Add Task / Note Modal */}
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        projects={projects}
        projectId={selectedProject !== "ALL" ? selectedProject : undefined}
        defaultStatus={defaultTaskStatus}
        onTaskCreated={(newTask) => {
          handleTaskCreated(newTask);
          setAddTaskOpen(false);
        }}
      />

      {/* Edit Task Modal */}
      <EditTaskDialog
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
        task={taskToEdit}
        onTaskUpdated={(updated) => {
          handleTaskUpdated(updated);
          setEditTaskOpen(false);
        }}
      />

      {/* Delete Task Confirmation Modal */}
      <DeleteTaskDialog
        open={deleteTaskOpen}
        onOpenChange={setDeleteTaskOpen}
        task={taskToDelete}
        onTaskDeleted={(deletedId) => {
          handleTaskDeleted(deletedId);
          setDeleteTaskOpen(false);
        }}
      />
    </div>
  );
}
