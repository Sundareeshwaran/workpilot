import { auth } from "@/auth";
import LogoutButton from "@/components/shared/logout-button";

export default async function ClientPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-3xl font-bold">Client</h1>

      <p className="text-muted-foreground mt-2">Welcome to WorkPilot CRM.</p>
    </div>
  );
}
