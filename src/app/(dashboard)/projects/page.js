"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Plus,
  RotateCcw,
  AlertCircle,
  SearchX,
  RefreshCw,
} from "lucide-react";
import AddProject from "@/components/projects/add-project";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectFilters from "@/components/projects/project-filters";
import ProjectTable from "@/components/projects/project-table";
import ProjectPagination from "@/components/projects/project-pagination";
import ProjectStats from "@/components/projects/project-stats";
import { useDebounce } from "@/hooks/use-debounce";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Filter & sorting states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showAddProject, setShowAddProject] = useState(false);

  // Debounce search input to avoid spamming the API
  const debouncedSearch = useDebounce(search, 300);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, sortBy, sortOrder]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);

      const response = await fetch(`/api/projects?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch projects");
      }

      setProjects(data.projects || []);
      setTotalProjects(data.totalProjects ?? data.pagination?.totalProjects ?? 0);
      setTotalPages(data.totalPages ?? data.pagination?.totalPages ?? 1);
      setHasNextPage(Boolean(data.hasNextPage ?? data.pagination?.hasNextPage));
      setHasPreviousPage(Boolean(data.hasPreviousPage ?? data.pagination?.hasPreviousPage));
    } catch (err) {
      console.error("FETCH PROJECTS ERROR:", err);
      setError(err.message || "Something went wrong while fetching projects.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status, priority, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    status ||
    priority ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc"
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            {!loading && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                {totalProjects}{" "}
                {totalProjects === 1 ? "project" : "projects"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track, manage, and monitor all your ongoing client projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchProjects();
              setStatsRefreshKey((k) => k + 1);
            }}
            disabled={loading}
            className="h-9 px-3 gap-1.5"
            title="Refresh projects"
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={() => setShowAddProject(true)}
            className="h-9 gap-1.5 shadow-sm"
          >
            <Plus className="size-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Project Statistics Overview */}
      <ProjectStats refreshTrigger={statsRefreshKey} />

      {/* Filter Toolbar */}
      <ProjectFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onReset={handleResetFilters}
      />

      {/* Main Content Area */}
      {error ? (
        /* Error State */
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Failed to load projects
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        /* Loading Skeleton State */
        <div className="rounded-xl border bg-card p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 hidden md:block" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 hidden sm:block" />
              <Skeleton className="h-4 w-20 hidden lg:block" />
              <Skeleton className="h-8 w-14 rounded-md" />
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        /* Project Table & Pagination */
        <div className="space-y-2">
          <ProjectTable
            projects={projects}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSortChange}
          />
          <ProjectPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalProjects}
            pageSize={limit}
            onPageChange={(newPage) => setPage(newPage)}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            isLoading={loading}
          />
        </div>
      ) : hasActiveFilters ? (
        /* Empty State when filters yield no results */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 ring-8 ring-primary/5">
            <SearchX className="size-7" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">
            No matching projects found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
            No projects matched your filter criteria. Try adjusting your search
            query or clear filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset All Filters
          </Button>
        </div>
      ) : (
        /* Empty State when zero projects exist */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 ring-8 ring-primary/5">
            <FolderGit2 className="size-7" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">
            No projects yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
            Get started by creating your first project to organize tasks, track
            budgets, and manage client deliverables.
          </p>
          <Button onClick={() => setShowAddProject(true)} className="gap-1.5">
            <Plus className="size-4" />
            Create Project
          </Button>
        </div>
      )}

      {/* Add Project Drawer */}
      <AddProject
        open={showAddProject}
        onOpenChange={setShowAddProject}
        onSuccess={() => {
          fetchProjects();
          setStatsRefreshKey((k) => k + 1);
          setShowAddProject(false);
        }}
        onCancel={() => setShowAddProject(false)}
      />
    </div>
  );
}
