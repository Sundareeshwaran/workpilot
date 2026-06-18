import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  SquareKanban,
  CreditCard,
} from "lucide-react";

export const dashboardRoutes = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Notes",
    href: "/notes",
    icon: SquareKanban,
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
];
