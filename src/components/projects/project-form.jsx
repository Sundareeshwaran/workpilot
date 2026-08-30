"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { DatePicker } from "@/components/ui/date-picker";

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

function formatDateForInput(dateString) {
  if (!dateString) return "";
  if (typeof dateString === "string") {
    const trimmed = dateString.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.includes("T")) {
      const datePart = trimmed.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ProjectForm({
  initialData = null,
  isEdit = false,
  onSuccess,
  onCancel,
}) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    clientId: initialData?.clientId || initialData?.client?.id || "",
    description: initialData?.description || "",
    status: initialData?.status || "DRAFT",
    priority: initialData?.priority || "MEDIUM",
    budget:
      initialData?.budget !== null && initialData?.budget !== undefined
        ? initialData.budget
        : "",
    currency: initialData?.currency || "INR",
    startDate: formatDateForInput(initialData?.startDate),
    dueDate: formatDateForInput(initialData?.dueDate),
  });

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const response = await fetch("/api/clients");
      const data = await response.json();

      if (response.ok && data.success) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("FETCH CLIENTS ERROR:", err);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData?.name || "",
        clientId: initialData?.clientId || initialData?.client?.id || "",
        description: initialData?.description || "",
        status: initialData?.status || "DRAFT",
        priority: initialData?.priority || "MEDIUM",
        budget:
          initialData?.budget !== null && initialData?.budget !== undefined
            ? initialData.budget
            : "",
        currency: initialData?.currency || "INR",
        startDate: formatDateForInput(initialData?.startDate),
        dueDate: formatDateForInput(initialData?.dueDate),
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      // If user sets a start date that is later than the existing due date, adjust due date to match
      if (name === "startDate" && value && next.dueDate) {
        if (new Date(value) > new Date(next.dueDate)) {
          next.dueDate = value;
        }
      }

      return next;
    });
  };

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayDateString = `${year}-${month}-${day}`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!formData.clientId) {
      setError("Please select a client for this project");
      return;
    }

    if (!isEdit && formData.startDate && formData.startDate < todayDateString) {
      setError("Start date cannot be in the past");
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
        description: formData.description?.trim() || null,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget !== "" ? Number(formData.budget) : null,
        currency: formData.currency,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
      };

      const url =
        isEdit && initialData?.id
          ? `/api/projects/${initialData.id}`
          : "/api/projects";
      const method = isEdit && initialData?.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (isEdit ? "Failed to update project" : "Failed to create project"),
        );
      }

      toast.success(
        data.message ||
          (isEdit
            ? "Project updated successfully!"
            : "Project created successfully!"),
      );

      router.refresh();

      if (onSuccess) {
        onSuccess(data.project);
      }
    } catch (err) {
      console.error("PROJECT FORM SUBMISSION ERROR:", err);
      const msg = err.message || "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Project Name */}
      <div className="space-y-1.5">
        <Label htmlFor="project-form-name" className="text-xs font-semibold">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="project-form-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Mobile Application Development"
          required
          className="h-9 text-sm"
        />
      </div>

      {/* Client Selection */}
      <div className="space-y-1.5">
        <Label htmlFor="project-form-client" className="text-xs font-semibold">
          Client <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.clientId}
          onValueChange={(val) => handleSelectChange("clientId", val)}
          disabled={loadingClients}
        >
          <SelectTrigger
            id="project-form-client"
            className="h-9 w-full text-sm"
          >
            <SelectValue
              placeholder={
                loadingClients
                  ? "Loading clients..."
                  : clients.length === 0
                    ? "No clients found"
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
        <Label htmlFor="project-form-desc" className="text-xs font-semibold">
          Description
        </Label>
        <Textarea
          id="project-form-desc"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Deliverables, scope, milestones..."
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label
            htmlFor="project-form-status"
            className="text-xs font-semibold"
          >
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(val) => handleSelectChange("status", val)}
          >
            <SelectTrigger
              id="project-form-status"
              className="h-9 w-full text-sm"
            >
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
          <Label
            htmlFor="project-form-priority"
            className="text-xs font-semibold"
          >
            Priority
          </Label>
          <Select
            value={formData.priority}
            onValueChange={(val) => handleSelectChange("priority", val)}
          >
            <SelectTrigger
              id="project-form-priority"
              className="h-9 w-full text-sm"
            >
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
          <Label
            htmlFor="project-form-budget"
            className="text-xs font-semibold"
          >
            Budget
          </Label>
          <Input
            id="project-form-budget"
            name="budget"
            type="number"
            min="0"
            step="any"
            value={formData.budget}
            onChange={handleChange}
            placeholder="e.g. 75000"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="project-form-currency"
            className="text-xs font-semibold"
          >
            Currency
          </Label>
          <Select
            value={formData.currency}
            onValueChange={(val) => handleSelectChange("currency", val)}
          >
            <SelectTrigger
              id="project-form-currency"
              className="h-9 w-full text-sm"
            >
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
          <Label htmlFor="project-form-start" className="text-xs font-semibold">
            Start Date
          </Label>
          <DatePicker
            id="project-form-start"
            name="startDate"
            value={formData.startDate}
            onChange={(val) => handleSelectChange("startDate", val)}
            minDate={!isEdit ? todayDateString : undefined}
            placeholder="Select start date"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="project-form-due" className="text-xs font-semibold">
            Due Date
          </Label>
          <DatePicker
            id="project-form-due"
            name="dueDate"
            value={formData.dueDate}
            onChange={(val) => handleSelectChange("dueDate", val)}
            minDate={formData.startDate || (!isEdit ? todayDateString : undefined)}
            placeholder="Select due date"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="h-9 text-xs sm:text-sm"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={submitting || loadingClients}
          className="h-9 text-xs sm:text-sm gap-2"
        >
          {submitting && <Loader2 className="size-3.5 animate-spin" />}
          {submitting
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
