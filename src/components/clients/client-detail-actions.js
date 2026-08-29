"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import AddClient from "@/components/shared/add-client";
import DeleteClientDialog from "./delete-client-dialog";

export default function ClientDetailActions({ client }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
        redirectTo="/clients"
      />

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          onClick={() => setEditOpen(true)}
          className="gap-2 cursor-pointer shadow-xs hover:bg-accent"
        >
          <Edit2 className="size-4" />
          <span>Edit Client</span>
        </Button>

        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          className="gap-2 cursor-pointer shadow-xs"
        >
          <Trash2 className="size-4" />
          <span>Delete</span>
        </Button>
      </div>
    </>
  );
}
