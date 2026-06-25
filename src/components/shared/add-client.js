import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

export default function AddClient({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Client</SheetTitle>
          <SheetDescription>
            Add a new client to your database.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-3 px-4">
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-demo-name">Client Name</Label>
            <Input id="sheet-demo-name" placeholder="Client Name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-demo-email">Email</Label>
            <Input id="sheet-demo-email" placeholder="Email" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-demo-phone">Phone Number</Label>
            <Input id="sheet-demo-phone" placeholder="Phone Number" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-demo-website">Website</Label>
            <Input id="sheet-demo-website" placeholder="Website" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-demo-notes">Notes</Label>
            <Textarea id="sheet-demo-notes" placeholder="Notes" />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onOpenChange}>
            Cancel
          </Button>
          <Button>Create Client</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
