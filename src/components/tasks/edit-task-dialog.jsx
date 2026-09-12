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
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, Edit3 } from "lucide-react";

export default function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "TODO");
      setPriority(task.priority || "MEDIUM");
      if (task.dueDate) {
        const dateStr =
          typeof task.dueDate === "string"
            ? task.dueDate.split("T")[0]
            : new Date(task.dueDate).toISOString().split("T")[0];
        setDueDate(dateStr);
      } else {
        setDueDate("");
      }
    }
  }, [open, task]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!task?.id) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update task");
      }

      toast.success(data.message || "Task updated successfully");
      onOpenChange?.(false);
      onTaskUpdated?.(data.task);
    } catch (err) {
      console.error("EDIT TASK ERROR:", err);
      toast.error(err.message || "Something went wrong updating the task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-4 text-primary" />
            Edit Task
          </DialogTitle>
          <DialogDescription>
            Update task details, priority, status, and due date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-task-title" className="text-xs font-medium">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-task-title"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-task-description"
              className="text-xs font-medium"
            >
              Description / Notes{" "}
              <span className="text-muted-foreground text-[10px]">
                (optional)
              </span>
            </Label>
            <Textarea
              id="edit-task-description"
              placeholder="Add key notes or instructions..."
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
              <Label htmlFor="edit-task-status" className="text-xs font-medium">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={setStatus}
                disabled={loading}
              >
                <SelectTrigger id="edit-task-status" className="w-full">
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
              <Label
                htmlFor="edit-task-priority"
                className="text-xs font-medium"
              >
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={setPriority}
                disabled={loading}
              >
                <SelectTrigger id="edit-task-priority" className="w-full">
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

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-task-duedate" className="text-xs font-medium">
              Due Date{" "}
              <span className="text-muted-foreground text-[10px]">
                (optional)
              </span>
            </Label>
            <DatePicker
              id="edit-task-duedate"
              value={dueDate}
              onChange={(dateStr) => setDueDate(dateStr)}
              placeholder="Select due date"
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="size-4 animate-spin mr-1.5" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
