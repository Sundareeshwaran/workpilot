import ClientCard from "@/components/clients/client-card";
import ClientHeader from "@/components/clients/client-header";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ClientPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    where: {
      user: {
        email: session.user.email,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-4">
      <ClientHeader />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 place-items-center mt-4">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  );
}
