"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function DeleteClientDialog({
  client,
  open,
  onOpenChange,
  redirectTo = null,
  onSuccess,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!client) return null;

  async function handleDelete() {
    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete client");
      }

      toast.success("Client deleted successfully");

      onOpenChange(false);

      if (onSuccess) {
        onSuccess(client);
      }

      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting the client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
          <div className="size-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center ring-8 ring-destructive/5">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Delete Client
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong className="text-foreground font-semibold">
                {client.name || client.companyName || "this client"}
              </strong>
              ? This will permanently remove their profile, along with all associated projects,
              invoices, and activity records.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
            {loading ? "Deleting..." : "Delete Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
