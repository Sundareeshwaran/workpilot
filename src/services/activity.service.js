import { prisma } from "@/lib/prisma";

export async function createActivity({ userId, projectId, action, details = null, tx = null }) {
  const client = tx || prisma;
  return client.activity.create({
    data: {
      userId,
      projectId,
      action,
      details,
    },
  });
}

export async function getProjectActivities({ userId, projectId }) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.activity.findMany({
    where: {
      userId,
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
