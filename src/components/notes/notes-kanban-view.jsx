"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  FolderKanban,
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import KanbanBoard from "@/components/kanban/kanban-board";
import AddTaskDialog from "@/components/tasks/add-task-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function NotesKanbanView({
  initialTasks = [],
  projects = [],
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState("TODO");

  const handleOpenAddTask = (status = "TODO") => {
    setDefaultStatus(status);
    setAddTaskOpen(true);
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update task status");
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...data.task } : t)),
      );

      toast.success(
        `Task moved to ${newStatus.replace("_", " ").toLowerCase()}`,
      );
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      toast.error(err.message || "Failed to update task status");
      throw err;
    }
  };

  const handleDropTask = async (taskId, targetStatus, sourceStatus) => {
    // 1. Same-status drop: do not make unnecessary API call
    if (targetStatus === sourceStatus) {
      return;
    }

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    // 2. Snapshot previous state for rollback on error
    const previousTasks = [...tasks];

    // 3. Optimistic UI update immediately
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)),
    );

    try {
      // 4. PATCH request reaches /api/tasks/[id]
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update task status");
      }

      // 5. Update task with server response
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...data.task } : t)),
      );

      toast.success(
        `Task moved to ${targetStatus.replace("_", " ").toLowerCase()}`,
      );
    } catch (err) {
      console.error("DRAG & DROP ERROR:", err);
      // 6. Rollback to previous state on failure
      setTasks(previousTasks);
      toast.error(err.message || "Failed to move task. Reverting change.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (err) {
      console.error("DELETE TASK ERROR:", err);
      toast.error(err.message || "Failed to delete task");
    }
  };

  // Filter tasks by project, priority, and search text
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery.trim() ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.project?.name &&
          task.project.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProject =
        selectedProject === "ALL" || task.projectId === selectedProject;

      const matchesPriority =
        selectedPriority === "ALL" || task.priority === selectedPriority;

      return matchesSearch && matchesProject && matchesPriority;
    });
  }, [tasks, searchQuery, selectedProject, selectedPriority]);

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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card/60 backdrop-blur-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search tasks, notes, or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-9 text-xs"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Project Filter */}
          {projects && projects.length > 0 && (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <FolderKanban className="size-3.5 mr-1.5 text-primary" />
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="ALL">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Priority Filter */}
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <Filter className="size-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={filteredTasks}
        onAddTask={handleOpenAddTask}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteTask}
        onDropTask={handleDropTask}
      />

      {/* Add Task / Note Modal */}
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        projects={projects}
        projectId={selectedProject !== "ALL" ? selectedProject : undefined}
        defaultStatus={defaultStatus}
        onTaskCreated={(newTask) => {
          handleTaskCreated(newTask);
          setAddTaskOpen(false);
        }}
      />
    </div>
  );
}
