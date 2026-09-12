import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getInvoiceById } from "@/services/invoice.service";
import InvoiceDetailPageClient from "@/components/invoices/invoice-detail-page-client";

export default async function InvoiceDetailPage({ params }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const [rawInvoice, clients, projects] = await Promise.all([
    getInvoiceById({
      id,
      userId: session.user.id,
    }),
    prisma.client.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!rawInvoice) {
    notFound();
  }

  // Convert Prisma Decimal and Date objects into plain serializable JSON
  const serializedInvoice = {
    ...rawInvoice,
    subtotal: Number(rawInvoice.subtotal || 0),
    tax: Number(rawInvoice.tax || 0),
    discount: Number(rawInvoice.discount || 0),
    total: Number(rawInvoice.total || 0),
    issueDate: rawInvoice.issueDate ? rawInvoice.issueDate.toISOString() : null,
    dueDate: rawInvoice.dueDate ? rawInvoice.dueDate.toISOString() : null,
    createdAt: rawInvoice.createdAt.toISOString(),
    updatedAt: rawInvoice.updatedAt.toISOString(),
    items: (rawInvoice.items || []).map((it) => ({
      ...it,
      rate: Number(it.rate || 0),
      unitPrice: Number(it.unitPrice || it.rate || 0),
      amount: Number(it.amount || 0),
      createdAt: it.createdAt ? it.createdAt.toISOString() : null,
    })),
    payments: (rawInvoice.payments || []).map((p) => ({
      ...p,
      amount: Number(p.amount || 0),
      paymentDate: p.paymentDate ? p.paymentDate.toISOString() : null,
      createdAt: p.createdAt ? p.createdAt.toISOString() : null,
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
    })),
    client: rawInvoice.client
      ? {
          ...rawInvoice.client,
          createdAt: rawInvoice.client.createdAt
            ? rawInvoice.client.createdAt.toISOString()
            : null,
          updatedAt: rawInvoice.client.updatedAt
            ? rawInvoice.client.updatedAt.toISOString()
            : null,
        }
      : null,
    project: rawInvoice.project
      ? {
          ...rawInvoice.project,
        }
      : null,
  };

  return (
    <InvoiceDetailPageClient
      initialInvoice={serializedInvoice}
      clients={clients}
      projects={projects}
    />
  );
}
