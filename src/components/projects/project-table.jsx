"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import ProjectStatusBadge from "@/components/projects/project-status-badge";
import ProjectPriorityBadge from "@/components/projects/project-priority-badge";

function formatCurrency(amount, currency = "INR") {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = Number(amount);
  if (isNaN(num)) return "—";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === "COMPLETED" || status === "CANCELLED") return false;
  return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

export default function ProjectTable({
  projects = [],
  sortBy,
  sortOrder,
  onSort,
}) {
  const renderSortIcon = (field) => {
    if (!onSort) return null;
    if (sortBy === field) {
      return sortOrder === "asc" ? (
        <ArrowUp className="size-3.5 text-primary ml-1 inline-block" />
      ) : (
        <ArrowDown className="size-3.5 text-primary ml-1 inline-block" />
      );
    }
    return (
      <ArrowUpDown className="size-3 text-muted-foreground/50 ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity" />
    );
  };

  const handleHeaderClick = (field) => {
    if (!onSort) return;
    if (sortBy === field) {
      onSort(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "asc");
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {/* Project Name Column */}
            <TableHead
              className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[28%] cursor-pointer select-none group"
              onClick={() => handleHeaderClick("name")}
            >
              <div className="flex items-center">
                <span>Project</span>
                {renderSortIcon("name")}
              </div>
            </TableHead>

            {/* Client Column */}
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[22%]">
              <span>Client</span>
            </TableHead>

            {/* Status Column */}
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[13%]">
              <span>Status</span>
            </TableHead>

            {/* Priority Column */}
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[12%]">
              <span>Priority</span>
            </TableHead>

            {/* Budget Column */}
            <TableHead
              className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[13%] cursor-pointer select-none group"
              onClick={() => handleHeaderClick("budget")}
            >
              <div className="flex items-center">
                <span>Budget</span>
                {renderSortIcon("budget")}
              </div>
            </TableHead>

            {/* Due Date Column */}
            <TableHead
              className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[12%] cursor-pointer select-none group"
              onClick={() => handleHeaderClick("dueDate")}
            >
              <div className="flex items-center">
                <span>Due Date</span>
                {renderSortIcon("dueDate")}
              </div>
            </TableHead>

            {/* Actions Column */}
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right w-[8%]">
              <span>Action</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {projects.map((project) => {
            const overdue = isOverdue(project.dueDate, project.status);
            const clientName = project.client?.name || "No Client";
            const companyName = project.client?.companyName;

            return (
              <TableRow
                key={project.id}
                className="group hover:bg-muted/40 transition-colors"
              >
                {/* Project Name & Description */}
                <TableCell className="py-3.5 pl-4 pr-3">
                  <div className="flex items-start gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-[280px]">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Client Information */}
                <TableCell className="py-3.5 px-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {clientName}
                    </span>
                    {companyName ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                        <Building2 className="size-3 shrink-0" />
                        <span className="truncate">{companyName}</span>
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="py-3.5 px-3">
                  <ProjectStatusBadge status={project.status} />
                </TableCell>

                {/* Priority */}
                <TableCell className="py-3.5 px-3">
                  <ProjectPriorityBadge priority={project.priority} />
                </TableCell>

                {/* Budget */}
                <TableCell className="py-3.5 px-3 font-medium text-sm text-foreground">
                  {formatCurrency(project.budget, project.currency)}
                </TableCell>

                {/* Due Date */}
                <TableCell className="py-3.5 px-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                    <span
                      className={
                        overdue
                          ? "text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1"
                          : "text-muted-foreground"
                      }
                    >
                      {formatDate(project.dueDate)}
                      {overdue && (
                        <AlertTriangle className="size-3 text-rose-500 inline-block" />
                      )}
                    </span>
                  </div>
                </TableCell>

                {/* Action button */}
                <TableCell className="py-3.5 pl-3 pr-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link href={`/projects/${project.id}`}>
                      <Eye className="size-3.5 mr-1" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
