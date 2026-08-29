"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Loader2, User, Building2, Mail, Phone, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

export default function SearchClients({ className }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce for 350ms
  const debouncedSearch = useDebounce(search, 350);

  // Synchronize state if URL search param changes externally
  useEffect(() => {
    const currentParam = searchParams.get("search") || "";
    if (currentParam !== search) {
      setSearch(currentParam);
    }
  }, [searchParams]);

  // Handle outside click to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live fetch + URL sync on debounced value change
  useEffect(() => {
    const trimmed = debouncedSearch.trim();

    // 1. Update URL query params
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });

    // 2. Fetch live dropdown results if focused and has content
    if (trimmed.length > 0) {
      setLoading(true);
      fetch(`/api/clients?search=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.clients)) {
            setResults(data.clients);
          } else {
            setResults([]);
          }
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setLoading(false);
          if (isFocused) {
            setIsOpen(true);
          }
        });
    } else {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
    }
  }, [debouncedSearch]);

  const handleClear = () => {
    setSearch("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectClient = (client) => {
    setIsOpen(false);
    // You can scroll to or filter specifically for this client
    setSearch(client.name);
  };

  const getInitials = (name) => {
    if (!name) return "CL";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full sm:w-72 md:w-80", className)}>
      {/* Search Input Container */}
      <div
        className={cn(
          "group relative flex items-center rounded-xl border bg-background/80 backdrop-blur-sm transition-all duration-200 shadow-xs",
          isFocused
            ? "border-primary ring-2 ring-primary/20 shadow-sm"
            : "border-input hover:border-muted-foreground/40"
        )}
      >
        <Search
          className={cn(
            "absolute left-3 size-4 transition-colors duration-200 pointer-events-none",
            isFocused ? "text-primary" : "text-muted-foreground"
          )}
        />

        <Input
          ref={inputRef}
          id="client-search-input"
          type="text"
          placeholder="Search by name, email, company..."
          value={search}
          onFocus={() => {
            setIsFocused(true);
            if (results.length > 0 && search.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen && e.target.value.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          className="w-full pl-9 pr-14 py-2 text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground/70"
        />

        {/* Right side Actions / Indicators */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {loading || isPending ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : search ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted/60 border rounded-md select-none pointer-events-none">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Live Results Dropdown */}
      {isOpen && search.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border bg-popover/95 backdrop-blur-md shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="p-2 border-b bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {loading
                ? "Searching..."
                : `${results.length} ${results.length === 1 ? "match" : "matches"} found`}
            </span>
            <span className="text-[10px]">Press Esc to close</span>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-xs">Searching clients...</span>
              </div>
            ) : results.length > 0 ? (
              results.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-accent/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 ring-1 ring-border">
                      <AvatarImage
                        src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(
                          c.name || c.companyName || "client"
                        )}`}
                      />
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {getInitials(c.name || c.companyName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {c.name}
                        </span>
                        {c.companyName && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground hidden sm:inline-flex"
                          >
                            <Building2 className="size-2.5 mr-1" />
                            {c.companyName}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground truncate mt-0.5">
                        {c.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="size-3 shrink-0" />
                            {c.email}
                          </span>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Phone className="size-3" />
                            {c.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ExternalLink className="size-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center px-4">
                <User className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No clients found</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No matching results for &ldquo;{search}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
