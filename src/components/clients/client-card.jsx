"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Phone,
  Globe,
  FolderKanban,
  IndianRupee,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Building2,
} from "lucide-react";
import AddClient from "@/components/shared/add-client";
import DeleteClientDialog from "./delete-client-dialog";

export default function ClientCard({ client }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Compute stats
  const projectsCount = client.projects?.length || client._count?.projects || 0;
  const totalRevenue =
    client.invoices?.reduce((acc, inv) => {
      if (inv.status === "PAID") {
        return acc + Number(inv.total || 0);
      }
      return acc;
    }, 0) || 0;

  const formattedRevenue =
    totalRevenue >= 100000
      ? `₹${(totalRevenue / 100000).toFixed(1)}L`
      : totalRevenue >= 1000
        ? `₹${(totalRevenue / 1000).toFixed(1)}k`
        : `₹${totalRevenue.toLocaleString("en-IN")}`;

  const initials = (client.name || client.companyName || "CL")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <AddClient
        open={editOpen}
        onOpenChange={setEditOpen}
        clientToEdit={client}
      />

      <DeleteClientDialog
        client={client}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <Card className="w-full flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="size-14 ring-2 ring-primary/10 shrink-0">
                <AvatarImage
                  src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(
                    client.name || client.companyName || "client",
                  )}`}
                />
                <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                    {client.name}
                  </CardTitle>
                </div>

                {client.companyName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <Building2 className="size-3.5 shrink-0" />
                    <span className="truncate">{client.companyName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                >
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Client options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer gap-2"
                >
                  <Edit2 className="size-4" />
                  <span>Edit Client</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive cursor-pointer gap-2"
                >
                  <Trash2 className="size-4" />
                  <span>Delete Client</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {client.notes && (
            <CardDescription className="line-clamp-2 text-xs text-muted-foreground mt-2">
              {client.notes}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-5 pt-0 flex-1 flex flex-col justify-between">
          {/* Contact Info */}
          <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
            {client.email ? (
              <div className="flex items-center gap-2 truncate">
                <Mail className="size-3.5 shrink-0 text-primary/70" />
                <span className="truncate">{client.email}</span>
              </div>
            ) : null}

            {client.phone ? (
              <div className="flex items-center gap-2 truncate">
                <Phone className="size-3.5 shrink-0 text-primary/70" />
                <span className="truncate">{client.phone}</span>
              </div>
            ) : null}

            {client.website ? (
              <div className="flex items-center gap-2 truncate">
                <Globe className="size-3.5 shrink-0 text-primary/70" />
                <a
                  href={
                    client.website.startsWith("http")
                      ? client.website
                      : `https://${client.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:underline hover:text-primary transition-colors"
                >
                  {client.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            ) : null}

            {!client.email && !client.phone && !client.website && (
              <span className="italic text-muted-foreground/60">
                No contact info provided
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                <FolderKanban className="size-3.5 text-primary" />
                Projects
              </div>
              <p className="mt-1.5 text-xl font-bold text-foreground">
                {projectsCount}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                <IndianRupee className="size-3.5 text-emerald-600" />
                Revenue
              </div>
              <p className="mt-1.5 text-xl font-bold text-foreground">
                {formattedRevenue}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              asChild
              className="flex-1 font-medium gap-1.5 cursor-pointer shadow-xs"
            >
              <Link href={`/clients/${client.id}`}>
                <span>View Details</span>
                <ExternalLink className="size-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
