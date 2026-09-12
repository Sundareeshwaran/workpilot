import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

  const [clients, projects] = await Promise.all([
    prisma.client.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, companyName: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, clientId: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <InvoicesPageClient
      initialClients={clients}
      initialProjects={projects}
    />
  );
}
