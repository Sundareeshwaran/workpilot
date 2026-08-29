import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Building2,
  FolderKanban,
  FileText,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import ClientDetailActions from "@/components/clients/client-detail-actions";

export default async function ClientDetailPage({ params }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: {
          items: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Ensure client exists and belongs to current user
  if (!client || client.userId !== session.user.id) {
    notFound();
  }

  // Compute revenue and financials
  const paidInvoices = client.invoices.filter((inv) => inv.status === "PAID");
  const pendingInvoices = client.invoices.filter(
    (inv) => inv.status === "SENT" || inv.status === "OVERDUE"
  );

  const totalPaidRevenue = paidInvoices.reduce(
    (sum, inv) => sum + Number(inv.total || 0),
    0
  );
  const totalPendingRevenue = pendingInvoices.reduce(
    (sum, inv) => sum + Number(inv.total || 0),
    0
  );

  const initials = (client.name || client.companyName || "CL")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(client.createdAt));

  return (
    <div className="space-y-8 pb-12">
      {/* Top Navigation & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer -ml-2"
        >
          <Link href="/clients">
            <ArrowLeft className="size-4" />
            <span>Back to Clients</span>
          </Link>
        </Button>
      </div>

      {/* Client Profile Header Banner */}
      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="size-20 sm:size-24 ring-4 ring-primary/10 shadow-md">
              <AvatarImage
                src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(
                  client.name || client.companyName || "client"
                )}`}
              />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {client.name}
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium text-xs"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Active Client
                </Badge>
              </div>

              {client.companyName && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Building2 className="size-4 shrink-0 text-primary" />
                  <span>{client.companyName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <Calendar className="size-3.5" />
                <span>Client since {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <ClientDetailActions client={client} />
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Paid Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                ₹{totalPaidRevenue.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Pending Invoices</p>
              <p className="text-2xl font-bold text-foreground">
                ₹{totalPendingRevenue.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold text-foreground">{client.projects.length}</p>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <FolderKanban className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold text-foreground">{client.invoices.length}</p>
            </div>
            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Contact & Notes + Projects & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contact & Information */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    {client.email ? (
                      <a
                        href={`mailto:${client.email}`}
                        className="text-foreground font-medium hover:text-primary hover:underline truncate block"
                      >
                        {client.email}
                      </a>
                    ) : (
                      <p className="text-muted-foreground/60 italic text-xs">Not provided</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="text-foreground font-medium hover:text-primary hover:underline truncate block"
                      >
                        {client.phone}
                      </a>
                    ) : (
                      <p className="text-muted-foreground/60 italic text-xs">Not provided</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Website</p>
                    {client.website ? (
                      <a
                        href={
                          client.website.startsWith("http")
                            ? client.website
                            : `https://${client.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-medium hover:underline truncate block"
                      >
                        {client.website}
                      </a>
                    ) : (
                      <p className="text-muted-foreground/60 italic text-xs">Not provided</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Address</p>
                    {client.address ? (
                      <p className="text-foreground font-medium whitespace-pre-line">
                        {client.address}
                      </p>
                    ) : (
                      <p className="text-muted-foreground/60 italic text-xs">Not provided</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Notes & Background</CardTitle>
            </CardHeader>
            <CardContent>
              {client.notes ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {client.notes}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">
                  No notes recorded for this client. Click &quot;Edit Client&quot; to add notes.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Projects & Invoices */}
        <div className="space-y-6 lg:col-span-2">
          {/* Projects Section */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Projects</CardTitle>
                <CardDescription className="text-xs">
                  Active and completed projects for this client
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {client.projects.length > 0 ? (
                <div className="divide-y">
                  {client.projects.map((project) => (
                    <div
                      key={project.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {project.name}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal uppercase"
                          >
                            {project.status}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {project.budget && (
                          <p className="text-sm font-bold text-foreground">
                            ₹{Number(project.budget).toLocaleString("en-IN")}
                          </p>
                        )}
                        {project.dueDate && (
                          <p className="text-[11px] text-muted-foreground">
                            Due {new Date(project.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Briefcase className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">No projects yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No projects have been linked to this client yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Section */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Invoices & Billing</CardTitle>
                <CardDescription className="text-xs">
                  Invoice history and payment status
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {client.invoices.length > 0 ? (
                <div className="divide-y">
                  {client.invoices.map((inv) => {
                    const statusColor =
                      inv.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : inv.status === "OVERDUE"
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                        : inv.status === "SENT"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                        : "bg-muted text-muted-foreground";

                    return (
                      <div
                        key={inv.id}
                        className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {inv.invoiceNumber}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-medium ${statusColor}`}
                            >
                              {inv.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Issued {new Date(inv.issueDate).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">
                            ₹{Number(inv.total).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Due {new Date(inv.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">No invoices yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No invoices generated for this client yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
