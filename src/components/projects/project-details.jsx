"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Mail,
  Phone,
  Globe,
  IndianRupee,
  Clock,
  Briefcase,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  FileText,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProjectStatusBadge from "@/components/projects/project-status-badge";
import ProjectPriorityBadge from "@/components/projects/project-priority-badge";
import ProjectForm from "@/components/projects/project-form";
import ProjectActivity from "@/components/projects/project-activity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatCurrency(amount, currency = "INR") {
  if (amount === null || amount === undefined || amount === "")
    return "Not Specified";
  const num = Number(amount);
  if (isNaN(num)) return "Not Specified";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
}

function formatDate(dateString) {
  if (!dateString) return "Not Set";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Not Set";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateDaysRemaining(dueDate) {
  if (!dueDate) return null;
  const target = new Date(dueDate);
  const now = new Date();
  const diffTime = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function ProjectDetails({ project: initialProject }) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const daysRemaining = calculateDaysRemaining(project?.dueDate);
  const isOverdue =
    daysRemaining !== null &&
    daysRemaining < 0 &&
    project?.status !== "COMPLETED" &&
    project?.status !== "CANCELLED";

  const clientInitials = (
    project?.client?.name ||
    project?.client?.companyName ||
    "CL"
  )
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete project");
      }

      toast.success("Project deleted successfully");
      setDeleteOpen(false);
      router.push("/projects");
      router.refresh();
    } catch (err) {
      console.error("DELETE PROJECT ERROR:", err);
      toast.error(err.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === project.status || updatingStatus) return;

    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update project status");
      }

      setProject(data.project);
      setActivityRefreshKey((k) => k + 1);
      toast.success(`Project status changed to ${newStatus.replace("_", " ")}`);
      router.refresh();
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (newPriority === project.priority || updatingPriority) return;

    try {
      setUpdatingPriority(true);
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update project priority");
      }

      setProject(data.project);
      setActivityRefreshKey((k) => k + 1);
      toast.success(`Project priority changed to ${newPriority}`);
      router.refresh();
    } catch (err) {
      console.error("PRIORITY UPDATE ERROR:", err);
      toast.error(err.message || "Failed to update priority");
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleEditSuccess = (updatedProject) => {
    setProject(updatedProject);
    setEditOpen(false);
    setActivityRefreshKey((k) => k + 1);
    router.refresh();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Navigation & Back Link */}
      <div className="flex items-center justify-between gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer -ml-2"
        >
          <Link href="/projects">
            <ArrowLeft className="size-4" />
            <span>Back to Projects</span>
          </Link>
        </Button>
      </div>

      {/* Project Banner Header */}
      <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <Select
                  value={project.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="h-7 text-xs border rounded-full px-2.5 bg-background/50 hover:bg-background cursor-pointer">
                    <SelectValue>
                      <ProjectStatusBadge status={project.status} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="REVIEW">In Review</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {updatingStatus && (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                )}
              </div>

              {/* Priority Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <Select
                  value={project.priority}
                  onValueChange={handlePriorityChange}
                  disabled={updatingPriority}
                >
                  <SelectTrigger className="h-7 text-xs border rounded-full px-2.5 bg-background/50 hover:bg-background cursor-pointer">
                    <SelectValue>
                      <ProjectPriorityBadge priority={project.priority} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {updatingPriority && (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                )}
              </div>

              {isOverdue && (
                <Badge
                  variant="outline"
                  className="gap-1 px-2.5 py-0.5 font-semibold text-xs border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse"
                >
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>Overdue ({Math.abs(daysRemaining)}d)</span>
                </Badge>
              )}
            </div>

            {project.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic">
                No description provided for this project.
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>Created {formatDate(project.createdAt)}</span>
              </span>
              {project.startDate && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>Started {formatDate(project.startDate)}</span>
                </span>
              )}
              {project.dueDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>Due {formatDate(project.dueDate)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="gap-2 cursor-pointer shadow-xs hover:bg-accent"
            >
              <Edit2 className="size-4" />
              <span>Edit Project</span>
            </Button>

            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              className="gap-2 cursor-pointer shadow-xs"
            >
              <Trash2 className="size-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Card */}
        <Card className="shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Project Budget
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {formatCurrency(project.budget, project.currency)}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Due Date Card */}
        <Card className="shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Due Date
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {formatDate(project.dueDate)}
              </p>
              {daysRemaining !== null && (
                <p
                  className={`text-[11px] font-medium ${
                    daysRemaining < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : daysRemaining <= 3
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0
                      ? "Due today"
                      : `${daysRemaining} days remaining`}
                </p>
              )}
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Calendar className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Tasks Summary Card */}
        <Card className="shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tasks</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {project.tasks?.length || 0}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Deliverables & milestones
              </p>
            </div>
            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ListTodo className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Invoices Card */}
        <Card className="shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Invoices
              </p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {project.invoices?.length || 0}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Billed deliverables
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Details Grid: Client Information & Tasks/Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client Profile & Contacts */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Assigned Client
              </CardTitle>
              <CardDescription className="text-xs">
                Client details associated with this project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {project.client ? (
                <>
                  <div className="flex items-center gap-3.5">
                    <Avatar className="size-12 ring-2 ring-primary/10">
                      <AvatarImage
                        src={`https://api.dicebear.com/10.x/notionists/svg?seed=${encodeURIComponent(
                          project.client.name ||
                            project.client.companyName ||
                            "client",
                        )}`}
                      />
                      <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                        {clientInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {project.client.name}
                      </p>
                      {project.client.companyName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                          <Building2 className="size-3 shrink-0" />
                          <span className="truncate">
                            {project.client.companyName}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t text-sm">
                    {project.client.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        <Mail className="size-3.5 shrink-0 text-primary/70" />
                        <a
                          href={`mailto:${project.client.email}`}
                          className="hover:underline hover:text-primary truncate"
                        >
                          {project.client.email}
                        </a>
                      </div>
                    )}
                    {project.client.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        <Phone className="size-3.5 shrink-0 text-primary/70" />
                        <a
                          href={`tel:${project.client.phone}`}
                          className="hover:underline hover:text-primary truncate"
                        >
                          {project.client.phone}
                        </a>
                      </div>
                    )}
                    {project.client.website && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        <Globe className="size-3.5 shrink-0 text-primary/70" />
                        <a
                          href={
                            project.client.website.startsWith("http")
                              ? project.client.website
                              : `https://${project.client.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-primary truncate"
                        >
                          {project.client.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-medium gap-1.5 mt-2"
                  >
                    <Link href={`/clients/${project.client.id}`}>
                      <span>View Client Profile</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground italic">
                  No client linked to this project.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tasks & Invoices */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tasks Section */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Project Tasks
                </CardTitle>
                <CardDescription className="text-xs">
                  Key milestones, deliverables, and to-do items
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {project.tasks && project.tasks.length > 0 ? (
                <div className="divide-y">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase font-semibold"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <ListTodo className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    No tasks added yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tasks and milestones for this project will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Section */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Invoices & Billing
                </CardTitle>
                <CardDescription className="text-xs">
                  Invoices billed against this project
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {project.invoices && project.invoices.length > 0 ? (
                <div className="divide-y">
                  {project.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issued {formatDate(inv.issueDate)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">
                          ₹{Number(inv.total).toLocaleString("en-IN")}
                        </p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <FileText className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    No invoices yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Invoices linked to this project will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline Section */}
          <ProjectActivity
            projectId={project.id}
            refreshTrigger={activityRefreshKey}
          />
        </div>
      </div>

      {/* Edit Project Sheet Drawer */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md md:max-w-lg px-1.5">
          <SheetHeader className="text-left pb-4 border-b">
            <SheetTitle className="text-lg font-semibold">
              Edit Project
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
              Update project specifications, status, budget, or assignees.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <ProjectForm
              initialData={project}
              isEdit={true}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Project Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
            <div className="size-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center ring-8 ring-destructive/5">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Delete Project
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Are you sure you want to permanently delete{" "}
                <strong className="text-foreground font-semibold">
                  {project.name}
                </strong>
                ? This will remove the project and its task history.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
