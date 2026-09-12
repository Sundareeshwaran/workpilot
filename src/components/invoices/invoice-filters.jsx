"use client";

import React from "react";
import {
  Search,
  X,
  RotateCcw,
  Plus,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVOICE_STATUS_CONFIG } from "./invoice-status-badge";

export default function InvoiceFilters({
  searchQuery = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusChange,
  clientFilter = "ALL",
  onClientChange,
  clients = [],
  onClearFilters,
  onCreateClick,
}) {
  const activeFilterCount = [
    Boolean(searchQuery),
    statusFilter !== "ALL",
    clientFilter !== "ALL",
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/60 backdrop-blur-xs p-3.5 rounded-xl border shadow-2xs">
      {/* Search & Filter Controls */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search invoice #, client, project..."
            className="pl-8 pr-8 h-9 text-xs sm:text-sm bg-background/80"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 w-[135px] text-xs bg-background/80">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="ALL" className="text-xs">
              All Statuses
            </SelectItem>
            {Object.entries(INVOICE_STATUS_CONFIG).map(([val, conf]) => (
              <SelectItem key={val} value={val} className="text-xs">
                {conf.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Client Filter */}
        {clients.length > 0 && (
          <Select value={clientFilter} onValueChange={onClientChange}>
            <SelectTrigger className="h-9 w-[150px] text-xs bg-background/80">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="ALL" className="text-xs">
                All Clients
              </SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name} {c.companyName ? `(${c.companyName})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Active Filter Indicator & Clear Button */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 animate-in fade-in">
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5 font-medium gap-1">
              <Filter className="size-3" />
              {activeFilterCount} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          onClick={onCreateClick}
          size="sm"
          className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Create Invoice</span>
        </Button>
      </div>
    </div>
  );
}
