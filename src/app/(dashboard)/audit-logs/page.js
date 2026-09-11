import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuditLogs from "@/components/dashboard/audit-logs";

export const metadata = {
  title: "Audit & Logs | WorkPilot",
  description: "Complete chronological audit trail of all project and task activities.",
};

export default async function AuditLogsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <AuditLogs />;
}
