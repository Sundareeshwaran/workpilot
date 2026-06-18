"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardRoutes } from "@/constants/routes";

const menuItems = [...dashboardRoutes];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 border-r bg-background flex-col">
      <div className="h-16 border-b flex items-center px-6">
        <h1 className="font-bold text-xl">WorkPilot</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all
                ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mb-6 flex items-center justify-center"></div>
    </aside>
  );
}
