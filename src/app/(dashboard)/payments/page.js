import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPayments } from "@/services/payment.service";
import PaymentsPageClient from "@/components/payments/payments-page-client";

export const metadata = {
  title: "Payments & Settlements | Work Pilot",
  description: "Track, inspect, and reconcile client invoice payments, transactions, and settlement histories.",
};

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const initialData = await getPayments({
    userId: session.user.id,
    page: 1,
    limit: 10,
    sortBy: "paymentDate",
    sortOrder: "desc",
  });

  // Serialize Prisma dates and decimals
  const serializedPayments = (initialData.payments || []).map((p) => ({
    ...p,
    amount: Number(p.amount || 0),
    paymentDate: p.paymentDate ? p.paymentDate.toISOString() : null,
    createdAt: p.createdAt ? p.createdAt.toISOString() : null,
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
    invoice: p.invoice
      ? {
          ...p.invoice,
          total: Number(p.invoice.total || 0),
          dueDate: p.invoice.dueDate ? p.invoice.dueDate.toISOString() : null,
        }
      : null,
  }));

  const serializedData = {
    ...initialData,
    payments: serializedPayments,
  };

  return <PaymentsPageClient initialData={serializedData} />;
}
