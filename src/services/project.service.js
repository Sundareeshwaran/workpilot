import { prisma } from "@/lib/prisma";

/**
 * Fetch paginated, filtered, and sorted projects for a specific user.
 */
export async function getProjects({
  userId,
  page = 1,
  limit = 10,
  search = "",
  status = "",
  priority = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  let safeLimit = Math.max(1, parseInt(limit, 10) || 10);
  if (safeLimit > 100) safeLimit = 100;
  const skip = (safePage - 1) * safeLimit;

  const where = {
    userId,
  };

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (search && search.trim()) {
    const trimmedSearch = search.trim();
    where.OR = [
      {
        name: {
          contains: trimmedSearch,
          mode: "insensitive",
        },
      },
      {
        client: {
          name: {
            contains: trimmedSearch,
            mode: "insensitive",
          },
        },
      },
      {
        client: {
          companyName: {
            contains: trimmedSearch,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "name",
    "budget",
    "startDate",
    "dueDate",
  ];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const finalSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const [totalProjects, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
          },
        },
      },
      orderBy: {
        [finalSortBy]: finalSortOrder,
      },
      skip,
      take: safeLimit,
    }),
  ]);

  const totalPages = Math.ceil(totalProjects / safeLimit) || 1;
  const hasNextPage = safePage < totalPages;
  const hasPreviousPage = safePage > 1;

  const formattedProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    budget: project.budget,
    startDate: project.startDate,
    dueDate: project.dueDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    client: project.client,
  }));

  return {
    projects: formattedProjects,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalProjects,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    page: safePage,
    limit: safeLimit,
    totalProjects,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Fetch project statistics for a specific user.
 */
export async function getProjectStats({ userId }) {
  const now = new Date();

  const [
    totalProjects,
    inProgressProjects,
    completedProjects,
    overdueProjects,
    statusDistribution,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        userId,
      },
    }),

    prisma.project.count({
      where: {
        userId,
        status: "IN_PROGRESS",
      },
    }),

    prisma.project.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    }),

    prisma.project.count({
      where: {
        userId,
        dueDate: {
          lt: now,
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
    }),

    prisma.project.groupBy({
      by: ["status"],
      where: {
        userId,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  const statusCounts = {
    DRAFT: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  for (const item of statusDistribution) {
    statusCounts[item.status] = item._count.id;
  }

  return {
    totalProjects,
    inProgressProjects,
    completedProjects,
    overdueProjects,
    statusCounts,
  };
}

/**
 * Fetch a single project by ID and user ID with client, tasks, and invoices.
 */
export async function getProjectById({ id, userId }) {
  return await prisma.project.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          website: true,
        },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Create a new project for a user after verifying client ownership.
 */
export async function createProject({ userId, data }) {
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      userId,
    },
  });

  if (!client) {
    const error = new Error("Client not found");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.project.create({
    data: {
      userId,
      clientId: data.clientId,
      name: data.name,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      budget: data.budget ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          website: true,
        },
      },
    },
  });
}

/**
 * Update an existing project for a user after verifying ownership.
 */
export async function updateProject({ id, userId, data }) {
  const existingProject = await prisma.project.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingProject) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        userId,
      },
    });

    if (!client) {
      const error = new Error("Client not found or access denied");
      error.statusCode = 404;
      throw error;
    }
  }

  return await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      clientId: data.clientId,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      budget: data.budget ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          website: true,
        },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Delete a project for a user after verifying ownership.
 */
export async function deleteProject({ id, userId }) {
  const existingProject = await prisma.project.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingProject) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.project.delete({
    where: { id },
  });
}
