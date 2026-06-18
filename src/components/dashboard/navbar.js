import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserNav from "./user-nav";

export default function Navbar() {
  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
      <h2 className="text-lg font-semibold">Dashboard</h2>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
