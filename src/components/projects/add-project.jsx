"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const initialFormData = {
  name: "",
  clientId: "",
  description: "",
  status: "DRAFT",
  priority: "MEDIUM",
  budget: "",
  currency: "INR",
  startDate: "",
  dueDate: "",
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

export default function AddProject({
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchClients();
    } else {
      setFormData(initialFormData);
      setError("");
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      setError("");

      const response = await fetch("/api/clients");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch clients");
      }

      setClients(data.clients || []);
    } catch (err) {
      console.error("FETCH CLIENTS ERROR:", err);
      setError(err.message || "Could not load clients list.");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setError("");
    if (onOpenChange) {
      onOpenChange(false);
    }
    if (onCancel) {
      onCancel();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!formData.clientId) {
      setError("Please select a client for this project");
      return;
    }

    if (formData.startDate && formData.dueDate) {
      if (new Date(formData.startDate) > new Date(formData.dueDate)) {
        setError("Due date cannot be earlier than start date");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        clientId: formData.clientId,
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget !== "" ? Number(formData.budget) : null,
        currency: formData.currency,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create project");
      }

      toast.success("Project created successfully!");
      setFormData(initialFormData);

      if (onSuccess) {
        onSuccess(data.project);
      }

      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error("CREATE PROJECT ERROR:", err);
      const msg = err.message || "Failed to create project";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange || handleClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md md:max-w-lg">
        <form onSubmit={handleSubmit} className="flex h-full flex-col px-1">
          <SheetHeader className="text-left pb-4 border-b">
            <SheetTitle className="text-lg font-semibold">
              Create New Project
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
              Add a new project and assign it to a client to start tracking
              progress, budgets, and deadlines.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 py-5">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Project Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Website Redesign"
                required
                className="h-9 text-sm"
              />
            </div>

            {/* Client Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="clientId" className="text-xs font-semibold">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(val) => handleSelectChange("clientId", val)}
                disabled={loadingClients}
              >
                <SelectTrigger id="clientId" className="h-9 w-full text-sm">
                  <SelectValue
                    placeholder={
                      loadingClients
                        ? "Loading clients..."
                        : clients.length === 0
                        ? "No clients found (create client first)"
                        : "Select a client"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.companyName ? ` (${client.companyName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief project outline, scope, goals..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => handleSelectChange("status", val)}
                >
                  <SelectTrigger id="status" className="h-9 w-full text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-xs font-semibold">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => handleSelectChange("priority", val)}
                >
                  <SelectTrigger id="priority" className="h-9 w-full text-sm">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="budget" className="text-xs font-semibold">
                  Budget
                </Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs font-semibold">
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(val) => handleSelectChange("currency", val)}
                >
                  <SelectTrigger id="currency" className="h-9 w-full text-sm">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start Date & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-semibold">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="h-9 text-xs sm:text-sm"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting || loadingClients}
              className="h-9 text-xs sm:text-sm gap-2"
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              {submitting ? "Creating Project..." : "Create Project"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
