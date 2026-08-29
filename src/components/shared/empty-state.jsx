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
