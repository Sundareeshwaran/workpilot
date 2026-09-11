"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, FolderKanban } from "lucide-react";

export default function AddTaskDialog({
  open,
  onOpenChange,
  projectId,
  projects = [],
  onTaskCreated,
  defaultStatus = "TODO",
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState("MEDIUM");
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectId || projects[0]?.id || "",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(defaultStatus || "TODO");
      if (projectId) {
        setSelectedProjectId(projectId);
      } else if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [open, defaultStatus, projectId, projects, selectedProjectId]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus(defaultStatus || "TODO");
    setPriority("MEDIUM");
    if (!projectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange?.(nextOpen);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    const targetProjectId = projectId || selectedProjectId;
    if (!targetProjectId) {
      toast.error("Please select a project for this task");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${targetProjectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create task");
      }

      toast.success(data.message || "Task created successfully");
      resetForm();
      onOpenChange?.(false);
      onTaskCreated?.(data.task);
    } catch (err) {
      toast.error(err.message || "Something went wrong creating task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Add New Task / Note
          </DialogTitle>
          <DialogDescription>
            Create a task or note to track deliverables and milestones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Project Selection (shown if projects list is available and no fixed projectId is set) */}
          {!projectId && projects && projects.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="task-project" className="text-xs font-medium flex items-center gap-1.5">
                <FolderKanban className="size-3.5 text-primary" />
                <span>Project</span> <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={loading}
              >
                <SelectTrigger id="task-project" className="w-full">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-medium">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="e.g. Design mobile navbar or review copy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description" className="text-xs font-medium">
              Description / Notes <span className="text-muted-foreground text-[10px]">(optional)</span>
            </Label>
            <Textarea
              id="task-description"
              placeholder="Add key notes, design requirements, or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Status & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="task-status" className="text-xs font-medium">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus} disabled={loading}>
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label htmlFor="task-priority" className="text-xs font-medium">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority} disabled={loading}>
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
