/**
 * Use Avatar and Dropdown menu in the User Navigation
 * The lists are - > Profile, Settings, Logout
 */
import { User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import LogoutButton from "../shared/logout-button";

export default function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("p-4 min-w-64")}>
        <div className="flex items-center px-2 mb-2">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">johndoe@gmail.com</p>
          </div>
        </div>
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <Link href="/dashboard/profile">
            <p>Profile</p>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <Link href="/dashboard/settings">
            <p>Settings</p>
          </Link>
        </DropdownMenuItem>
        <div className={cn("mt-1")}>
          <LogoutButton className={cn("w-full cursor-pointer")} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
