"use client";

import React from "react";
import { Search, X, RotateCcw, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" },
  { value: "name", label: "Project Name" },
  { value: "budget", label: "Budget" },
  { value: "dueDate", label: "Due Date" },
  { value: "startDate", label: "Start Date" },
];

export default function ProjectFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onReset,
}) {
  const isFiltered = Boolean(
    search ||
      status ||
      priority ||
      (sortBy && sortBy !== "createdAt") ||
      (sortOrder && sortOrder !== "desc")
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/60 p-3.5 backdrop-blur-xs">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects or clients..."
            className="pl-9 pr-8 h-9 text-sm rounded-lg bg-background/80"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select
            value={status || "all"}
            onValueChange={(val) => onStatusChange(val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-9 min-w-[130px] bg-background text-xs sm:text-sm font-medium">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priority || "all"}
            onValueChange={(val) => onPriorityChange(val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-9 min-w-[130px] bg-background text-xs sm:text-sm font-medium">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By Field */}
          <Select
            value={sortBy || "createdAt"}
            onValueChange={(val) => onSortByChange(val)}
          >
            <SelectTrigger className="h-9 min-w-[140px] bg-background text-xs sm:text-sm font-medium">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Direction Toggle Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
            className="h-9 px-2.5 gap-1.5 text-xs font-medium"
            title={`Sort order: ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            <ArrowUpDown className="size-3.5" />
            <span className="hidden sm:inline">
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </span>
          </Button>

          {/* Reset Filters Button */}
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 px-2.5 gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
