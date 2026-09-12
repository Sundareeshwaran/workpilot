"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, SearchX, RotateCcw, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import KanbanBoard from "./kanban-board";
import AddTaskDialog from "@/components/tasks/add-task-dialog";
import TaskFilters from "@/components/tasks/task-filters";
import { filterTasks } from "@/lib/task-filter-utils";

export default function ProjectKanban({
  projectId,
  tasks = [],
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}) {
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("TODO");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dueDateFilter, setDueDateFilter] = useState("ALL");
  const [updatingTaskIds, setUpdatingTaskIds] = useState(new Set());

  const handleOpenAddTask = (status = "TODO") => {
    setSelectedStatus(status);
    setAddTaskOpen(true);
  };

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setPriorityFilter("ALL");
    setStatusFilter("ALL");
    setDueDateFilter("ALL");
  }, []);

  // Shared status update handler used by both dropdown and drag-drop
  const handleStatusChange = useCallback(
    async (taskId, newStatus) => {
      // Guard: prevent concurrent updates for the same task
      if (updatingTaskIds.has(taskId)) return;

      try {
        setUpdatingTaskIds((prev) => new Set(prev).add(taskId));

        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update task status");
        }

        toast.success(
          `Task moved to ${newStatus.replace("_", " ").toLowerCase()}`,
        );
        onTaskUpdated?.(data.task);
      } catch (err) {
        console.error("KANBAN STATUS CHANGE ERROR:", err);
        toast.error(err.message || "Failed to update task status");
        throw err;
      } finally {
        setUpdatingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [updatingTaskIds, onTaskUpdated],
  );

  const handleDropTask = useCallback(
    async (taskId, targetStatus, sourceStatus) => {
      // Same-status drop: no API call
      if (targetStatus === sourceStatus) return;

      // Guard: prevent concurrent updates for the same task
      if (updatingTaskIds.has(taskId)) return;

      // 1. Optimistic UI update immediately
      onTaskUpdated?.({ id: taskId, status: targetStatus });

      try {
        setUpdatingTaskIds((prev) => new Set(prev).add(taskId));

        // 2. PATCH request
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: targetStatus }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update task status");
        }

        // 3. Replace optimistic task with server response
        toast.success(
          `Task moved to ${targetStatus.replace("_", " ").toLowerCase()}`,
        );
        onTaskUpdated?.(data.task);
      } catch (err) {
        console.error("KANBAN DROP TASK ERROR:", err);
        // 4. Rollback: revert to source status
        onTaskUpdated?.({ id: taskId, status: sourceStatus });
        toast.error(err.message || "Failed to move task. Reverting change.");
      } finally {
        setUpdatingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [updatingTaskIds, onTaskUpdated],
  );

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete task");
      }

      toast.success("Task deleted successfully");
      onTaskDeleted?.(taskId);
    } catch (err) {
      console.error("KANBAN DELETE TASK ERROR:", err);
      toast.error(err.message || "Failed to delete task");
    }
  };

  // Filter tasks using shared pure filter function
  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, {
      searchQuery,
      statusFilter,
      priorityFilter,
      dueDateFilter,
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, dueDateFilter]);

  return (
    <div className="space-y-4">
      {/* Board Controls: Shared TaskFilters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            dueDateFilter={dueDateFilter}
            onDueDateChange={setDueDateFilter}
            totalCount={tasks.length}
            filteredCount={filteredTasks.length}
            onClearFilters={handleClearFilters}
          />
        </div>

        <Button
          size="sm"
          onClick={() => handleOpenAddTask("TODO")}
          className="gap-1.5 h-9 text-xs font-medium cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Add Task</span>
        </Button>
      </div>

      {/* Kanban Board Component or Empty States */}
      {tasks.length > 0 ? (
        filteredTasks.length > 0 ? (
          <KanbanBoard
            tasks={filteredTasks}
            onAddTask={handleOpenAddTask}
            onStatusChange={handleStatusChange}
            onTaskUpdated={onTaskUpdated}
            onDelete={handleDeleteTask}
            onTaskDeleted={onTaskDeleted}
            onDropTask={handleDropTask}
            updatingTaskIds={updatingTaskIds}
          />
        ) : (
          /* Filter/Search Results Empty State */
          <div className="py-12 text-center rounded-xl border border-dashed border-border/80 bg-card/40 p-6 space-y-3">
            <div className="size-11 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <SearchX className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                No matching tasks found
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                No tasks match your current search query or active filter criteria. Try clearing your filters or refining your query.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs gap-1.5 cursor-pointer mt-1"
            >
              <RotateCcw className="size-3.5" />
              <span>Clear All Filters</span>
            </Button>
          </div>
        )
      ) : (
        /* Zero Total Tasks */
        <div className="py-12 text-center rounded-xl border border-dashed border-border/80 bg-card/40 p-6 space-y-3">
          <div className="size-11 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <ListTodo className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              No tasks in this project yet
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
              Create a task to get started on your Kanban board.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenAddTask("TODO")}
            className="gap-1.5 text-xs font-medium cursor-pointer mt-1"
          >
            <Plus className="size-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      )}

      {/* Add Task Modal */}
      {projectId && (
        <AddTaskDialog
          open={addTaskOpen}
          onOpenChange={setAddTaskOpen}
          projectId={projectId}
          defaultStatus={selectedStatus}
          onTaskCreated={(newTask) => {
            onTaskCreated?.(newTask);
            setAddTaskOpen(false);
          }}
        />
      )}
    </div>
  );
}
