"use client";

import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialClient = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  notes: "",
};

export default function AddClient({ open, onOpenChange }) {
  const [client, setClient] = useState(initialClient);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setClient((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create client");
      }

      // Reset form
      setClient(initialClient);

      // Close sheet
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col mx-4">
          <SheetHeader>
            <SheetTitle>Add Client</SheetTitle>
            <SheetDescription>
              Add a new client to your database.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Client Name"
                value={client.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Company Name"
                value={client.companyName}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                value={client.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="Phone Number"
                value={client.phone}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                placeholder="Website"
                value={client.website}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Address"
                value={client.address}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notes"
                value={client.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
