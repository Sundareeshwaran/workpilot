import ClientCard from "@/components/clients/client-card";
import ClientHeader from "@/components/clients/client-header";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, SearchX } from "lucide-react";

export default async function ClientPage({ searchParams }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search?.trim();

  const whereClause = {
    user: {
      email: session.user.email,
    },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const clients = await prisma.client.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <ClientHeader totalClients={clients.length} />

      {clients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 place-items-stretch mt-4">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 my-8">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 ring-8 ring-primary/5">
            {search ? (
              <SearchX className="size-7" />
            ) : (
              <Users className="size-7" />
            )}
          </div>
          <h3 className="text-lg font-semibold tracking-tight">
            {search ? `No clients found for "${search}"` : "No clients yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
            {search
              ? "We couldn't find any clients matching your search criteria. Try checking for typos or searching with different keywords."
              : "Get started by adding your first client to organize your projects, invoices, and payments."}
          </p>
        </div>
      )}
    </div>
  );
}
