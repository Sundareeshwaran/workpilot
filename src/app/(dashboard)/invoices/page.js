import { auth } from "@/auth";
import { redirect } from "next/navigation";
import InvoicesPageClient from "@/components/invoices/invoices-page-client";

export const metadata = {
  title: "Invoices & Billing | WorkPilot CRM",
  description: "Create, track, and manage client invoices, line items, and payments.",
};

export default async function InvoicePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <InvoicesPageClient />;
}
