"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function DeleteTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskDeleted,
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!task?.id) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete task");
      }

      toast.success(data.message || "Task deleted successfully");
      onOpenChange?.(false);
      onTaskDeleted?.(task.id);
    } catch (err) {
      console.error("DELETE TASK ERROR:", err);
      toast.error(err.message || "Something went wrong deleting the task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
          <div className="size-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center ring-8 ring-destructive/5 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Delete Task
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-semibold">
                &ldquo;{task?.title || "this task"}&rdquo;
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Deleting..." : "Delete Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
