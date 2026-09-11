"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import KanbanBoard from "./kanban-board";
import AddTaskDialog from "@/components/tasks/add-task-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [updatingTaskIds, setUpdatingTaskIds] = useState(new Set());

  const handleOpenAddTask = (status = "TODO") => {
    setSelectedStatus(status);
    setAddTaskOpen(true);
  };

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

  // Filter tasks by search query and priority
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery.trim() ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority =
      priorityFilter === "ALL" || task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-4">
      {/* Board Controls: Search, Priority filter, Add Task */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 text-xs"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[125px] h-9 text-xs">
              <Filter className="size-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={() => handleOpenAddTask("TODO")}
          className="gap-1.5 h-9 text-xs font-medium cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Add Task</span>
        </Button>
      </div>

      {/* Kanban Board Component */}
      <KanbanBoard
        tasks={filteredTasks}
        onAddTask={handleOpenAddTask}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteTask}
        onDropTask={handleDropTask}
        updatingTaskIds={updatingTaskIds}
      />

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
