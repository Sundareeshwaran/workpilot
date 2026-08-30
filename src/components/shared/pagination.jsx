"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  hasNextPage = false,
  hasPreviousPage = false,
  isLoading = false,
  itemName = "results",
}) {
  // If there are no items, show 0-0 of 0 or empty summary
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const isFirstPage = currentPage <= 1 || !hasPreviousPage;
  const isLastPage = currentPage >= totalPages || !hasNextPage;

  const handlePrev = () => {
    if (!isFirstPage && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Showing X–Y of Z */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{startItem}–{endItem}</span> of{" "}
        <span className="font-medium text-foreground">{totalItems}</span> {itemName}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Page status indicator */}
        <div className="text-xs text-muted-foreground mr-2 font-medium">
          Page {currentPage} of {Math.max(1, totalPages)}
        </div>

        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={isFirstPage || isLoading}
          className="h-8 px-2.5 gap-1 text-xs font-medium"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden xs:inline">Previous</span>
        </Button>

        {/* Page numbers (visible on larger screens) */}
        {totalPages > 1 && (
          <div className="hidden md:flex items-center gap-1">
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-xs text-muted-foreground select-none"
                  >
                    …
                  </span>
                );
              }

              const isActive = pageNum === currentPage;
              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  disabled={isLoading}
                  className={`h-8 w-8 p-0 text-xs font-medium ${
                    isActive
                      ? "pointer-events-none shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={`Page ${pageNum}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
        )}

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={isLastPage || isLoading}
          className="h-8 px-2.5 gap-1 text-xs font-medium"
          aria-label="Next page"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
