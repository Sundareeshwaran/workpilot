"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddClient from "@/components/shared/add-client";

export default function ClientHeader() {
  const [open, setOpen] = useState(false);

  const handleOpenChange = () => setOpen(!open);
  return (
    <div>
      <AddClient open={open} onOpenChange={handleOpenChange} />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Client</h1>
        <Button onClick={() => setOpen(true)} className="cursor-pointer">
          <Plus />
          Add new client
        </Button>
      </div>
    </div>
  );
}
