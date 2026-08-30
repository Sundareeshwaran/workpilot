import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectById } from "@/services/project.service";
import ProjectDetails from "@/components/projects/project-details";

export default async function ProjectDetailPage({ params }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const project = await getProjectById({
    id,
    userId: session.user.id,
  });

  if (!project) {
    notFound();
  }

  // Convert Prisma Decimal and Date objects into plain serializable JSON
  const serializedProject = {
    ...project,
    budget: project.budget !== null && project.budget !== undefined ? Number(project.budget) : null,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    dueDate: project.dueDate ? project.dueDate.toISOString() : null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    invoices: (project.invoices || []).map((inv) => ({
      ...inv,
      total: Number(inv.total || 0),
      subtotal: inv.subtotal ? Number(inv.subtotal) : 0,
      tax: inv.tax ? Number(inv.tax) : 0,
      discount: inv.discount ? Number(inv.discount) : 0,
      issueDate: inv.issueDate ? inv.issueDate.toISOString() : null,
      dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    })),
    tasks: (project.tasks || []).map((task) => ({
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    })),
  };

  return <ProjectDetails project={serializedProject} />;
}
