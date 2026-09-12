"use client";

import { useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  X,
  RotateCcw,
  LayoutList,
  Columns3,
  FolderKanban,
  CheckCircle2,
  Clock,
  Circle,
  AlertTriangle,
  Flame,
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
import { cn } from "@/lib/utils";

export default function TaskFilters({
  searchQuery = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusChange,
  priorityFilter = "ALL",
  onPriorityChange,
  dueDateFilter = "ALL",
  onDueDateChange,
  projectFilter = "ALL",
  onProjectChange,
  projects = [],
  viewMode,
  onViewModeChange,
  totalCount = 0,
  filteredCount = 0,
  onClearFilters,
  hideStatusFilter = false,
  className,
}) {
  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (!hideStatusFilter && statusFilter !== "ALL") count += 1;
    if (priorityFilter !== "ALL") count += 1;
    if (dueDateFilter !== "ALL") count += 1;
    if (projectFilter !== "ALL") count += 1;
    return count;
  }, [
    searchQuery,
    statusFilter,
    priorityFilter,
    dueDateFilter,
    projectFilter,
    hideStatusFilter,
  ]);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left / Top Controls: Search Input */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by title, description..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-8.5 pr-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Matching Count Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Badge
              variant={hasActiveFilters ? "default" : "secondary"}
              className="text-[11px] font-semibold px-2 py-0.5"
            >
              {filteredCount} {filteredCount === 1 ? "task" : "tasks"}
            </Badge>
            {hasActiveFilters && totalCount !== filteredCount && (
              <span className="text-[11px] text-muted-foreground">
                of {totalCount}
              </span>
            )}
          </div>
        </div>

        {/* Right Controls: Filter Selectors & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Optional Project Filter */}
          {projects && projects.length > 0 && onProjectChange && (
            <Select value={projectFilter} onValueChange={onProjectChange}>
              <SelectTrigger className="w-[140px] sm:w-[155px] h-9 text-xs">
                <FolderKanban className="size-3.5 mr-1 text-primary shrink-0" />
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="ALL">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status Filter */}
          {!hideStatusFilter && onStatusChange && (
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger
                className={cn(
                  "w-[120px] sm:w-[130px] h-9 text-xs transition-colors",
                  statusFilter !== "ALL" &&
                    "border-primary/50 bg-primary/5 font-medium text-primary",
                )}
              >
                <Filter className="size-3.5 mr-1 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="TODO">
                  <span className="flex items-center gap-1.5">
                    <Circle className="size-3 text-slate-500" />
                    <span>To Do</span>
                  </span>
                </SelectItem>
                <SelectItem value="IN_PROGRESS">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3 text-blue-500" />
                    <span>In Progress</span>
                  </span>
                </SelectItem>
                <SelectItem value="DONE">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    <span>Done</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Priority Filter */}
          {onPriorityChange && (
            <Select value={priorityFilter} onValueChange={onPriorityChange}>
              <SelectTrigger
                className={cn(
                  "w-[120px] sm:w-[130px] h-9 text-xs transition-colors",
                  priorityFilter !== "ALL" &&
                    "border-primary/50 bg-primary/5 font-medium text-primary",
                )}
              >
                <Flame className="size-3.5 mr-1 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Due Date State Filter */}
          {onDueDateChange && (
            <Select value={dueDateFilter} onValueChange={onDueDateChange}>
              <SelectTrigger
                className={cn(
                  "w-[130px] sm:w-[145px] h-9 text-xs transition-colors",
                  dueDateFilter !== "ALL" &&
                    "border-primary/50 bg-primary/5 font-medium text-primary",
                )}
              >
                <Calendar className="size-3.5 mr-1 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Due Date" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="ALL">All Due Dates</SelectItem>
                <SelectItem value="DUE_SOON">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3 text-amber-500" />
                    <span>Due Soon (≤3d)</span>
                  </span>
                </SelectItem>
                <SelectItem value="OVERDUE">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3 text-rose-500" />
                    <span>Overdue</span>
                  </span>
                </SelectItem>
                <SelectItem value="NO_DUE_DATE">No Due Date</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Clear Filters Action Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-destructive/40 hover:bg-destructive/10 gap-1.5 cursor-pointer shrink-0 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
              <span className="inline sm:hidden">Clear</span>
              <Badge
                variant="secondary"
                className="size-4 p-0 flex items-center justify-center text-[10px] rounded-full ml-0.5"
              >
                {activeFiltersCount}
              </Badge>
            </Button>
          )}

          {/* Optional View Mode Switcher */}
          {viewMode && onViewModeChange && (
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 shrink-0 ml-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("list")}
                className={cn(
                  "h-7 px-2.5 text-xs gap-1.5 rounded-md cursor-pointer transition-all",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="List View"
              >
                <LayoutList className="size-3.5" />
                <span className="hidden md:inline">List</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("kanban")}
                className={cn(
                  "h-7 px-2.5 text-xs gap-1.5 rounded-md cursor-pointer transition-all",
                  viewMode === "kanban"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Kanban Board View"
              >
                <Columns3 className="size-3.5" />
                <span className="hidden md:inline">Board</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
