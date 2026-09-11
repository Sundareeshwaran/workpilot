import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import NotesKanbanView from "@/components/notes/notes-kanban-view";

export const metadata = {
  title: "Notes & Kanban Board | WorkPilot",
  description:
    "Organize and manage your project deliverables, design conversations, and notes in an intuitive Kanban board.",
};

export default async function NotesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all tasks for the logged in user with project details
  const rawTasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  // Fetch user projects for project selector
  const rawProjects = await prisma.project.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Serialize dates to plain ISO strings for client component
  const serializedTasks = rawTasks.map((task) => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));

  const serializedProjects = rawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }));

  return (
    <NotesKanbanView
      initialTasks={serializedTasks}
      projects={serializedProjects}
    />
  );
}
