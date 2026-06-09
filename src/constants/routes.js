import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Receipt,
  CreditCard,
} from "lucide-react";

export const dashboardRoutes = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: Receipt,
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
];
