import { cn } from "@/lib/utils";
import { KanbanSquare } from "lucide-react";
import { User2Icon } from "lucide-react";
import { TrendingUp } from "lucide-react";

export default function ActivityContent() {
  return (
    <div className={cn("border rounded-md h-full overflow-y-clip")}>
      <h2 className="border-b py-4 px-5 font-semibold text-lg">
        Recent Activity
      </h2>
      <div className="p-4">
        <ul className="space-y-6">
          {/* List 1 */}
          <li>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Revenue increased</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Revenue increased by 5.2% this month
                </p>
              </div>
            </div>
          </li>
          {/* List 2 */}
          <li>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User2Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">New client added</p>
                  <p className="text-xs text-muted-foreground">10 hours ago</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  The client <span className="font-semibold">{"Acme Inc"}</span>{" "}
                  was added to your database
                </p>
              </div>
            </div>
          </li>
          {/* List 3 */}
          <li>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <KanbanSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Project Added</p>
                  <p className="text-xs text-muted-foreground">18 hours ago</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Project <span className="font-semibold">{"Acme Inc"}</span>{" "}
                  was added to your database
                </p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
