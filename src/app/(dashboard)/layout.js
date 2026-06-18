import { auth } from "@/auth";
import Navbar from "@/components/dashboard/navbar";
import Sidebar from "@/components/dashboard/sidebar";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
  title: "WorkPilot - Dashboard",
  description:
    "Welcome to WorkPilot - A free and open source dashboard for freelancers and agencies",
};

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
