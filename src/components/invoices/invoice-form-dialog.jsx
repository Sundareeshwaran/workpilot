"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  Loader2,
  FileText,
  Building2,
  Briefcase,
  AlertCircle,
  Sparkles,
  Receipt,
  FileCode2,
  Tag,
  Percent,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { INVOICE_STATUS_CONFIG } from "./invoice-status-badge";

export const TAX_PRESETS = [
  {
    group: "India - GST (Central & State / Interstate)",
    options: [
      { id: "GST_18_INTRA", label: "GST 18% (CGST 9% + SGST 9%) - Central & State", rate: 18 },
      { id: "GST_18_INTER", label: "IGST 18% (Central) - Interstate", rate: 18 },
      { id: "GST_12_INTRA", label: "GST 12% (CGST 6% + SGST 6%) - Central & State", rate: 12 },
      { id: "GST_12_INTER", label: "IGST 12% (Central) - Interstate", rate: 12 },
      { id: "GST_5_INTRA", label: "GST 5% (CGST 2.5% + SGST 2.5%) - Central & State", rate: 5 },
      { id: "GST_5_INTER", label: "IGST 5% (Central) - Interstate", rate: 5 },
      { id: "GST_28_INTRA", label: "GST 28% (CGST 14% + SGST 14%) - Central & State", rate: 28 },
      { id: "GST_28_INTER", label: "IGST 28% (Central) - Interstate", rate: 28 },
      { id: "GST_0", label: "GST 0% - Exempted / Nil Rated", rate: 0 },
    ],
  },
  {
    group: "United States - State & Local Sales Tax",
    options: [
      { id: "US_10", label: "10% - Combined State & County Tax", rate: 10 },
      { id: "US_8_25", label: "8.25% - State & Local Sales Tax", rate: 8.25 },
      { id: "US_6", label: "6% - State Sales Tax", rate: 6 },
      { id: "US_4", label: "4% - State Sales Tax", rate: 4 },
    ],
  },
  {
    group: "United Kingdom & Europe - VAT",
    options: [
      { id: "UK_VAT_20", label: "20% - Standard Rate VAT (Central)", rate: 20 },
      { id: "UK_VAT_5", label: "5% - Reduced Rate VAT", rate: 5 },
    ],
  },
  {
    group: "Zero Tax & Custom",
    options: [
      { id: "TAX_0", label: "0% - No Tax (0.00)", rate: 0 },
      { id: "CUSTOM", label: "Custom Tax Amount (Manual Entry)", rate: null },
    ],
  },
];

export const DISCOUNT_PERCENT_OPTIONS = [
  { value: "0", label: "0% (No Discount)", percent: 0 },
  { value: "2", label: "2% Discount", percent: 2 },
  { value: "3", label: "3% Discount", percent: 3 },
  { value: "4", label: "4% Discount", percent: 4 },
  { value: "5", label: "5% Discount", percent: 5 },
  { value: "6", label: "6% Discount", percent: 6 },
  { value: "7", label: "7% Discount", percent: 7 },
  { value: "8", label: "8% Discount", percent: 8 },
  { value: "9", label: "9% Discount", percent: 9 },
  { value: "10", label: "10% Discount", percent: 10 },
  { value: "12", label: "12% Discount", percent: 12 },
  { value: "15", label: "15% Discount", percent: 15 },
  { value: "18", label: "18% Discount", percent: 18 },
  { value: "20", label: "20% Discount", percent: 20 },
  { value: "CUSTOM", label: "Custom Amount (₹)", percent: null },
];

export default function InvoiceFormDialog({
  open,
  onOpenChange,
  invoiceToEdit = null,
  clients = [],
  projects = [],
  onSuccess,
}) {
  const isEdit = Boolean(invoiceToEdit);

  // Form State
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("NONE");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [notes, setNotes] = useState("");

  // Tax & Discount States
  const [taxPreset, setTaxPreset] = useState("GST_18_INTRA");
  const [customTax, setCustomTax] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [customDiscount, setCustomDiscount] = useState("");

  const [items, setItems] = useState([
    {
      id: "temp-1",
      service: "Software Development & Consulting",
      quantity: 1,
      rate: 0,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [availableClients, setAvailableClients] = useState(clients);
  const [availableProjects, setAvailableProjects] = useState(projects);

  // Synchronize when props update
  useEffect(() => {
    if (clients && clients.length > 0) setAvailableClients(clients);
  }, [clients]);

  useEffect(() => {
    if (projects && projects.length > 0) setAvailableProjects(projects);
  }, [projects]);

  // Fetch latest clients and projects whenever modal is opened
  useEffect(() => {
    if (open) {
      async function refreshDropdownData() {
        try {
          const [cRes, pRes] = await Promise.all([
            fetch("/api/clients"),
            fetch("/api/projects?limit=100"),
          ]);
          if (cRes.ok) {
            const cData = await cRes.json();
            if (cData.clients) setAvailableClients(cData.clients);
          }
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData.projects) setAvailableProjects(pData.projects);
          }
        } catch (err) {
          console.error("DROPDOWN REFRESH ERROR:", err);
        }
      }
      refreshDropdownData();
    }
  }, [open]);

  // Filter projects by selected client if client is chosen
  const clientProjects = useMemo(() => {
    if (!clientId) return availableProjects;
    return availableProjects.filter(
      (p) => p.clientId === clientId || p.client?.id === clientId
    );
  }, [availableProjects, clientId]);

  // Handle client change: reset project if incompatible
  const handleClientChange = (newClientId) => {
    setClientId(newClientId);
    if (projectId !== "NONE") {
      const match = availableProjects.find(
        (p) =>
          p.id === projectId &&
          (p.clientId === newClientId || p.client?.id === newClientId)
      );
      if (!match) {
        setProjectId("NONE");
      }
    }
  };

  // Handle project change: autofill client if not selected
  const handleProjectChange = (newProjectId) => {
    setProjectId(newProjectId);
    if (newProjectId !== "NONE") {
      const selectedProj = availableProjects.find((p) => p.id === newProjectId);
      const projClientId = selectedProj?.clientId || selectedProj?.client?.id;
      if (projClientId && (!clientId || clientId !== projClientId)) {
        setClientId(projClientId);
      }
    }
  };

  // Populate form on edit or reset on open
  useEffect(() => {
    if (open) {
      setFormError("");
      const nowStr = new Date().toISOString().split("T")[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const futureStr = futureDate.toISOString().split("T")[0];

      if (invoiceToEdit) {
        setClientId(invoiceToEdit.clientId || "");
        setProjectId(invoiceToEdit.projectId || "NONE");
        setInvoiceNumber(invoiceToEdit.invoiceNumber || "");
        setIssueDate(
          invoiceToEdit.issueDate
            ? new Date(invoiceToEdit.issueDate).toISOString().split("T")[0]
            : nowStr,
        );
        setDueDate(
          invoiceToEdit.dueDate
            ? new Date(invoiceToEdit.dueDate).toISOString().split("T")[0]
            : futureStr,
        );
        setStatus(invoiceToEdit.status || "DRAFT");
        setNotes(invoiceToEdit.notes || "");

        // Set edit tax values
        const editTax = Number(invoiceToEdit.tax) || 0;
        if (editTax === 0) {
          setTaxPreset("TAX_0");
          setCustomTax("");
        } else {
          setTaxPreset("CUSTOM");
          setCustomTax(String(editTax));
        }

        // Set edit discount values
        const editDiscount = Number(invoiceToEdit.discount) || 0;
        if (editDiscount === 0) {
          setDiscountPercent("0");
          setCustomDiscount("");
        } else {
          setDiscountPercent("CUSTOM");
          setCustomDiscount(String(editDiscount));
        }

        if (invoiceToEdit.items && invoiceToEdit.items.length > 0) {
          setItems(
            invoiceToEdit.items.map((it, idx) => ({
              id: it.id || `item-${idx}`,
              service: it.service || "",
              quantity: it.quantity || 1,
              rate: Number(it.rate) || 0,
            })),
          );
        } else {
          setItems([{ id: "temp-1", service: "", quantity: 1, rate: 0 }]);
        }
      } else {
        // Create Mode defaults
        setClientId(clients.length > 0 ? clients[0].id : "");
        setProjectId("NONE");
        setInvoiceNumber("");
        setIssueDate(nowStr);
        setDueDate(futureStr);
        setStatus("DRAFT");
        setNotes(
          "Payment terms: Net 14 days. Please include the invoice number in your transfer reference.",
        );
        setTaxPreset("GST_18_INTRA");
        setCustomTax("");
        setDiscountPercent("0");
        setCustomDiscount("");
        setItems([
          {
            id: "temp-1",
            service: "Software Development & Consulting",
            quantity: 1,
            rate: 0,
          },
        ]);
      }
    }
  }, [open, invoiceToEdit, clients]);

  // Handle dynamic line items
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, service: "", quantity: 1, rate: 0 },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error("An invoice must have at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Real-time calculation of subtotal
  const calculatedSubtotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = parseInt(it.quantity, 10) || 0;
      const r = Number(it.rate) || 0;
      return sum + q * r;
    }, 0);
  }, [items]);

  // Find active tax preset details
  const selectedTaxOption = useMemo(() => {
    for (const group of TAX_PRESETS) {
      const found = group.options.find((opt) => opt.id === taxPreset);
      if (found) return found;
    }
    return TAX_PRESETS[0].options[0];
  }, [taxPreset]);

  // Real-time Tax Amount calculation
  const calculatedTax = useMemo(() => {
    if (taxPreset === "CUSTOM") {
      return Math.max(0, Number(customTax) || 0);
    }
    if (!selectedTaxOption || selectedTaxOption.rate === 0) return 0;
    return Number(((calculatedSubtotal * selectedTaxOption.rate) / 100).toFixed(2));
  }, [taxPreset, selectedTaxOption, customTax, calculatedSubtotal]);

  // Real-time Discount Amount calculation (from 2% to 20% or custom)
  const calculatedDiscount = useMemo(() => {
    if (discountPercent === "CUSTOM") {
      return Math.max(0, Number(customDiscount) || 0);
    }
    const pct = Number(discountPercent) || 0;
    if (pct <= 0) return 0;
    return Number(((calculatedSubtotal * pct) / 100).toFixed(2));
  }, [discountPercent, customDiscount, calculatedSubtotal]);

  // Final Total
  const calculatedTotal = useMemo(() => {
    return Math.max(
      0,
      Number(
        (calculatedSubtotal + calculatedTax - calculatedDiscount).toFixed(2),
      ),
    );
  }, [calculatedSubtotal, calculatedTax, calculatedDiscount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!clientId) {
      setFormError("Please select a client for this invoice.");
      return;
    }

    if (!issueDate || !dueDate) {
      setFormError("Please select both issue date and due date.");
      return;
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      setFormError("Due date cannot be earlier than issue date.");
      return;
    }

    const validItems = items.filter(
      (it) => it.service && it.service.trim() !== "",
    );
    if (validItems.length === 0) {
      setFormError(
        "Please provide at least one valid line item with a service description.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        clientId,
        projectId: projectId && projectId !== "NONE" ? projectId : null,
        invoiceNumber: invoiceNumber.trim() || undefined,
        issueDate,
        dueDate,
        status,
        notes: notes.trim() || null,
        tax: calculatedTax,
        discount: calculatedDiscount,
        items: validItems.map((it) => ({
          service: it.service.trim(),
          quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
          rate: Math.max(0, Number(it.rate) || 0),
        })),
      };

      const url = isEdit
        ? `/api/invoices/${invoiceToEdit.id}`
        : "/api/invoices";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            (data.errors
              ? JSON.stringify(data.errors)
              : "Failed to save invoice"),
        );
      }

      toast.success(
        isEdit
          ? `Invoice "${data.invoice.invoiceNumber}" updated successfully!`
          : `Invoice "${data.invoice.invoiceNumber}" created successfully!`,
      );

      if (onSuccess) onSuccess(data.invoice);
      onOpenChange(false);
    } catch (err) {
      console.error("SAVE INVOICE ERROR:", err);
      setFormError(err.message || "Failed to save invoice");
      toast.error(err.message || "Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border shadow-2xl bg-card">
        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-4 ring-primary/5 shrink-0">
                <Receipt className="size-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{isEdit ? `Edit Invoice` : "Create New Invoice"}</span>
                  {isEdit && invoiceToEdit?.invoiceNumber && (
                    <Badge
                      variant="outline"
                      className="text-xs font-mono font-semibold px-2 py-0"
                    >
                      #{invoiceToEdit.invoiceNumber}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isEdit
                    ? "Modify billing specifications, line items, taxes, and status."
                    : "Generate an itemized client invoice with automated total calculation."}
                </DialogDescription>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="text-[11px] font-medium px-2.5 py-1"
              >
                {isEdit ? "Editing Mode" : "New Invoice"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {formError && (
          <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span className="font-medium">{formError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Card 1: Client, Project & Invoice Identifiers */}
          <div className="rounded-xl border bg-card/60 p-4 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1 border-b">
              <Building2 className="size-3.5 text-primary" />
              <span>Client & Invoice Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Client Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>
                    Client <span className="text-destructive">*</span>
                  </span>
                  {availableClients.length === 0 && (
                    <span className="text-[10px] text-destructive font-normal">
                      No clients found
                    </span>
                  )}
                </Label>
                <Select
                  value={clientId}
                  onValueChange={handleClientChange}
                  disabled={isEdit || availableClients.length === 0}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue
                      placeholder={
                        availableClients.length === 0
                          ? "No clients available"
                          : "Select client..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        <span className="font-medium">{c.name}</span>
                        {c.companyName && (
                          <span className="text-muted-foreground ml-1.5">
                            ({c.companyName})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Project</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Optional
                  </span>
                </Label>
                <Select value={projectId} onValueChange={handleProjectChange}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE" className="text-xs">
                      No Project (Standalone)
                    </SelectItem>
                    {clientProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        <span>{p.name}</span>
                        {p.status && (
                          <span className="text-muted-foreground text-[10px] ml-1.5 opacity-70">
                            ({p.status})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Number */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Invoice Number</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Auto if blank
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-20260912-001"
                    className="h-9 text-xs font-mono bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Dates & Status Sub-grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Issue Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Issue Date <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  value={issueDate}
                  onChange={(val) => setIssueDate(val || "")}
                  placeholder="Select issue date"
                  className="h-9 text-xs bg-background"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Due Date <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  value={dueDate}
                  onChange={(val) => setDueDate(val || "")}
                  minDate={issueDate || undefined}
                  placeholder="Select due date"
                  className="h-9 text-xs bg-background"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVOICE_STATUS_CONFIG).map(
                      ([val, conf]) => (
                        <SelectItem key={val} value={val} className="text-xs">
                          {conf.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Card 2: Line Items & Services */}
          <div className="rounded-xl border bg-card/60 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b">
              <div className="flex items-center gap-2">
                <FileCode2 className="size-3.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Itemized Services
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </Badge>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer hover:border-primary/50"
              >
                <Plus className="size-3.5" />
                <span>Add Item</span>
              </Button>
            </div>

            {/* Table Container */}
            <div className="rounded-lg border bg-background overflow-hidden divide-y">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/40 text-[11px] font-semibold text-muted-foreground items-center">
                <div className="col-span-6 pl-8">Service / Description</div>
                <div className="col-span-2 text-right pr-1">Qty</div>
                <div className="col-span-2 text-right pr-1">Rate (₹)</div>
                <div className="col-span-2 text-right pr-2">Amount (₹)</div>
              </div>

              {/* Dynamic Rows */}
              {items.map((item, idx) => {
                const rowAmount =
                  (parseInt(item.quantity, 10) || 0) * (Number(item.rate) || 0);

                return (
                  <div
                    key={item.id || idx}
                    className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-muted/20 transition-colors group"
                  >
                    {/* Description */}
                    <div className="col-span-5 sm:col-span-6 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer disabled:opacity-30"
                        title={
                          items.length <= 1
                            ? "Cannot delete the only item"
                            : "Remove item"
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                      <Input
                        value={item.service}
                        onChange={(e) =>
                          handleItemChange(idx, "service", e.target.value)
                        }
                        placeholder="e.g. UI/UX Design, Backend API, Cloud Setup"
                        className="h-8 text-xs bg-card"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", e.target.value)
                        }
                        className="h-8 text-xs text-right bg-card font-mono"
                        required
                      />
                    </div>

                    {/* Unit Rate */}
                    <div className="col-span-2 sm:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(idx, "rate", e.target.value)
                        }
                        className="h-8 text-xs text-right bg-card font-mono"
                        required
                      />
                    </div>

                    {/* Row Amount */}
                    <div className="col-span-2 text-right font-bold text-xs text-foreground pr-1 font-mono">
                      ₹
                      {rowAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Notes & Financial Calculation Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Notes Section */}
            <div className="md:col-span-6 space-y-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="size-3.5 text-muted-foreground" />
                <span>Notes & Payment Instructions</span>
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bank account details, UPI ID, terms of payment, or client message..."
                rows={5}
                className="text-xs resize-none bg-card/60"
              />
            </div>

            {/* Financial Summary Breakdown */}
            <div className="md:col-span-6 rounded-xl border bg-muted/20 p-4 space-y-3 shadow-2xs self-start">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">
                  Subtotal ({items.length} items):
                </span>
                <span className="font-semibold text-foreground font-mono">
                  ₹
                  {calculatedSubtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Tax Selection (Country, State & Central) */}
              <div className="space-y-1.5 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Receipt className="size-3.5 text-primary" />
                    <span>Tax (Country, State & Central)</span>
                  </Label>
                  <span className="font-mono font-bold text-foreground">
                    +₹
                    {calculatedTax.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <Select value={taxPreset} onValueChange={setTaxPreset}>
                  <SelectTrigger className="h-8 text-xs bg-background w-full">
                    <SelectValue placeholder="Select Tax Rate..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {TAX_PRESETS.map((grp) => (
                      <SelectGroup key={grp.group}>
                        <SelectLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 bg-muted/40">
                          {grp.group}
                        </SelectLabel>
                        {grp.options.map((opt) => (
                          <SelectItem
                            key={opt.id}
                            value={opt.id}
                            className="text-xs"
                          >
                            <span>{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>

                {/* If Custom Tax is selected, show manual numeric input */}
                {taxPreset === "CUSTOM" && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      Custom Tax Amount:
                    </span>
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customTax}
                        onChange={(e) => setCustomTax(e.target.value)}
                        placeholder="0.00"
                        className="h-7 text-xs font-mono bg-background text-right"
                      />
                    </div>
                  </div>
                )}

                {/* Tax Central + State breakdown info */}
                {taxPreset.startsWith("GST_") &&
                  selectedTaxOption?.rate > 0 &&
                  selectedTaxOption.id.includes("INTRA") && (
                    <p className="text-[10px] text-muted-foreground">
                      Central CGST {(selectedTaxOption.rate / 2).toFixed(1)}% (₹
                      {(calculatedTax / 2).toFixed(2)}) + State SGST{" "}
                      {(selectedTaxOption.rate / 2).toFixed(1)}% (₹
                      {(calculatedTax / 2).toFixed(2)})
                    </p>
                  )}
              </div>

              {/* Discount Selection (2% to 20%) */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Percent className="size-3.5 text-primary" />
                    <span>Discount (2% to 20%)</span>
                  </Label>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {calculatedDiscount > 0
                      ? `-₹${calculatedDiscount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}`
                      : "₹0.00"}
                  </span>
                </div>

                <Select
                  value={discountPercent}
                  onValueChange={setDiscountPercent}
                >
                  <SelectTrigger className="h-8 text-xs bg-background w-full">
                    <SelectValue placeholder="Select discount percentage..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {DISCOUNT_PERCENT_OPTIONS.map((d) => (
                      <SelectItem
                        key={d.value}
                        value={d.value}
                        className="text-xs"
                      >
                        <span>{d.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* If Custom Discount is selected, show manual numeric input */}
                {discountPercent === "CUSTOM" && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      Custom Discount (₹):
                    </span>
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customDiscount}
                        onChange={(e) => setCustomDiscount(e.target.value)}
                        placeholder="0.00"
                        className="h-7 text-xs font-mono bg-background text-right"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Grand Total
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    Inclusive of all taxes & discounts
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg sm:text-xl font-extrabold text-primary font-mono tracking-tight">
                    ₹
                    {calculatedTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer Actions */}
          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="text-xs font-semibold h-9 px-5 gap-2 cursor-pointer shadow-xs"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              <span>{isEdit ? "Save Changes" : "Generate Invoice"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
