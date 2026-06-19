/**
 * Reusable empty state for the "No Clients"
 */
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import LoadingSkeleton from "./loading-skeleton";

export default function EmptyState() {
  const isClient = true;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Client</h1>
        <Button className="cursor-pointer">
          <Plus />
          Add new client
        </Button>
      </div>
      {isClient ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex items-center justify-center">
          <p>No clients yet</p>
        </div>
      )}
    </div>
  );
}
