"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import AddClient from "@/components/shared/add-client";
import SearchClients from "@/components/shared/search-clients";

export default function ClientHeader({ totalClients }) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (state) => setOpen(typeof state === "boolean" ? state : !open);

  return (
    <div className="pb-2 border-b border-border/40">
      <AddClient open={open} onOpenChange={handleOpenChange} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Stats */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Clients
            </h1>
            {typeof totalClients === "number" && (
              <Badge variant="secondary" className="px-2 py-0.5 font-semibold text-xs rounded-full">
                {totalClients}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your client accounts, directory, and contact details.
          </p>
        </div>

        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SearchClients />

          <Button
            onClick={() => setOpen(true)}
            className="cursor-pointer gap-2 shrink-0 shadow-sm transition-transform active:scale-95"
          >
            <Plus className="size-4" />
            <span>Add Client</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
