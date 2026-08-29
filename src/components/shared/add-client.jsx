"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const initialClient = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  notes: "",
};

export default function AddClient({
  open,
  onOpenChange,
  clientToEdit = null,
  onSuccess,
}) {
  const router = useRouter();
  const [client, setClient] = useState(initialClient);
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(clientToEdit?.id);

  // Sync state when editing a client or opening the modal
  useEffect(() => {
    if (clientToEdit) {
      setClient({
        name: clientToEdit.name || "",
        companyName: clientToEdit.companyName || "",
        email: clientToEdit.email || "",
        phone: clientToEdit.phone || "",
        website: clientToEdit.website || "",
        address: clientToEdit.address || "",
        notes: clientToEdit.notes || "",
      });
    } else {
      setClient(initialClient);
    }
  }, [clientToEdit, open]);

  function handleChange(e) {
    const { name, value } = e.target;

    setClient((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditMode
        ? `/api/clients/${clientToEdit.id}`
        : "/api/clients";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (isEditMode
              ? "Failed to update client"
              : "Failed to create client"),
        );
      }

      toast.success(
        data.message ||
          (isEditMode
            ? "Client updated successfully"
            : "Client created successfully"),
      );

      // Reset form if creating
      if (!isEditMode) {
        setClient(initialClient);
      }

      if (onSuccess) {
        onSuccess(data.client);
      }

      // Refresh data & Close sheet
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred", {
        description: "Please verify the details and resolve any duplicate conflicts.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex h-full flex-col px-2">
          <SheetHeader className="text-left">
            <SheetTitle>{isEditMode ? "Edit Client" : "Add Client"}</SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Update your client's contact information and company details."
                : "Add a new client to your workspace database."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. John Doe"
                value={client.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="e.g. Acme Studio Inc."
                value={client.companyName}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="e.g. john@acme.com"
                value={client.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="e.g. +1 555-0199"
                value={client.phone}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                placeholder="e.g. https://acmestudio.com"
                value={client.website}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address / Location</Label>
              <Input
                id="address"
                name="address"
                placeholder="e.g. San Francisco, CA"
                value={client.address}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes & Background</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Project preferences, billing details, key contacts..."
                value={client.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <SheetFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading
                ? isEditMode
                  ? "Saving Changes..."
                  : "Creating Client..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Client"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
