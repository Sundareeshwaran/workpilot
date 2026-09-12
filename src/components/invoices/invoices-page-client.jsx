"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceStats from "./invoice-stats";
import InvoiceFilters from "./invoice-filters";
import InvoiceTable from "./invoice-table";
import InvoiceFormDialog from "./invoice-form-dialog";
import InvoiceDetailDialog from "./invoice-detail-dialog";
import DeleteInvoiceDialog from "./delete-invoice-dialog";
import { useDebounce } from "@/hooks/use-debounce";

export default function InvoicesPageClient({
  initialClients = [],
  initialProjects = [],
}) {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalInvoices: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Available Clients & Projects for selectors
  const [clients, setClients] = useState(initialClients);
  const [projects, setProjects] = useState(initialProjects);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query to prevent unnecessary API hammering while user types
  const debouncedSearch = useDebounce(searchQuery, 350);

  // Reset to first page whenever debounced search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, clientFilter]);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [invoiceToView, setInvoiceToView] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Fetch Clients & Projects once for dropdowns
  useEffect(() => {
    async function loadAuxData() {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/projects?limit=100"),
        ]);
        if (cRes.ok) {
          const cData = await cRes.json();
          setClients(cData.clients || []);
        }
        if (pRes.ok) {
          const pData = await pRes.json();
          setProjects(pData.projects || []);
        }
      } catch (err) {
        console.error("AUX DATA FETCH ERROR:", err);
      }
    }
    loadAuxData();
  }, []);

  // Fetch Invoices
  const fetchInvoices = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "10",
      });

      if (debouncedSearch && debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (clientFilter !== "ALL") params.set("clientId", clientFilter);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load invoices");
      }

      setInvoices(data.invoices || []);
      setStats(data.stats || {});
      setPagination(data.pagination || { page: 1, limit: 10, totalInvoices: 0, totalPages: 1 });
    } catch (err) {
      console.error("FETCH INVOICES ERROR:", err);
      toast.error(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, clientFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handle Quick Status Change
  const handleStatusChange = async (invoiceId, newStatus) => {
    // Optimistic update
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    );
    setInvoiceToView((prev) =>
      prev && prev.id === invoiceId ? { ...prev, status: newStatus } : prev
    );

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      toast.success(`Invoice status updated to ${newStatus}`);
      fetchInvoices(true);
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      toast.error(err.message || "Failed to update invoice status");
      fetchInvoices(true);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setClientFilter("ALL");
    setCurrentPage(1);
  };

  const handleCreateNew = () => {
    setInvoiceToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (invoice) => {
    setInvoiceToEdit(invoice);
    setFormOpen(true);
  };

  const handleView = (invoice) => {
    setInvoiceToView(invoice);
    setDetailOpen(true);
  };

  const handleDelete = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteOpen(true);
  };

  const handleInvoiceSuccess = () => {
    fetchInvoices(true);
  };

  const handleInvoiceDeleted = () => {
    fetchInvoices(true);
  };

  const isFiltered = Boolean(searchQuery) || statusFilter !== "ALL" || clientFilter !== "ALL";

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card/70 backdrop-blur-md p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <FileText className="size-3.5" />
              <span>Billing & Invoicing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Invoice Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Create, track, and manage client invoices, line items, taxes, discounts, and payment lifecycle statuses.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInvoices(true)}
            disabled={refreshing || loading}
            className="gap-2 cursor-pointer shadow-xs self-start md:self-auto shrink-0"
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? "animate-spin text-primary" : ""}`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <InvoiceStats stats={stats} loading={loading} />

      {/* Filter Bar */}
      <InvoiceFilters
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        clientFilter={clientFilter}
        onClientChange={(val) => {
          setClientFilter(val);
          setCurrentPage(1);
        }}
        clients={clients}
        onClearFilters={handleClearFilters}
        onCreateClick={handleCreateNew}
      />

      {/* Invoices Table */}
      <InvoiceTable
        invoices={invoices}
        loading={loading}
        pagination={pagination}
        onPageChange={setCurrentPage}
        onViewInvoice={handleView}
        onEditInvoice={handleEdit}
        onDeleteInvoice={handleDelete}
        onStatusChange={handleStatusChange}
        isFiltered={isFiltered}
        onClearFilters={handleClearFilters}
        onCreateClick={handleCreateNew}
      />

      {/* Create / Edit Form Dialog */}
      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoiceToEdit={invoiceToEdit}
        clients={clients}
        projects={projects}
        onSuccess={handleInvoiceSuccess}
      />

      {/* Detail / Print Preview Dialog */}
      <InvoiceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        invoice={invoiceToView}
        onEditClick={handleEdit}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteInvoiceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        invoice={invoiceToDelete}
        onInvoiceDeleted={handleInvoiceDeleted}
      />
    </div>
  );
}
