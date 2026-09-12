import { prisma } from "@/lib/prisma";

/**
 * Fetch all tasks for a specific project after verifying user ownership of the project.
 */
export async function getProjectTasks({
  userId,
  projectId,
  search = "",
  status = "",
  priority = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  // Project ownership check
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    const error = new Error("Project not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  const where = {
    projectId,
    userId,
  };

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (search && search.trim()) {
    const trimmed = search.trim();
    where.OR = [
      {
        title: {
          contains: trimmed,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: trimmed,
          mode: "insensitive",
        },
      },
    ];
  }

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "dueDate",
    "priority",
    "status",
    "title",
  ];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const finalSortOrder = sortOrder === "asc" ? "asc" : "desc";

  return await prisma.task.findMany({
    where,
    orderBy: {
      [finalSortBy]: finalSortOrder,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Fetch a single task by ID and verify user ownership.
 */
export async function getTaskById({ id, userId }) {
  // User ownership check
  return await prisma.task.findFirst({
    where: {
      id,
      userId,
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
}

/**
 * Create a new task within a project after verifying project ownership.
 */
export async function createTask({ userId, projectId, data }) {
  // Project ownership check
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    const error = new Error("Project not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        userId,
        projectId,
        title: data.title.trim(),
        description: data.description ? data.description.trim() : null,
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await tx.activity.create({
      data: {
        userId,
        projectId,
        action: "TASK_CREATED",
        details: {
          taskId: task.id,
          title: task.title,
          taskTitle: task.title,
        },
      },
    });

    return task;
  });
}

/**
 * Update an existing task after verifying user ownership.
 */
export async function updateTask({ id, userId, data }) {
  // User ownership check
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingTask) {
    const error = new Error("Task not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  // If projectId is being changed, verify ownership of destination project
  if (data.projectId && data.projectId !== existingTask.projectId) {
    const targetProject = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId,
      },
    });

    if (!targetProject) {
      const error = new Error("Target project not found or access denied");
      error.statusCode = 404;
      throw error;
    }
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined)
    updateData.description = data.description ? data.description.trim() : null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined)
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.projectId !== undefined) updateData.projectId = data.projectId;

  const isStatusChanged =
    data.status !== undefined && data.status !== existingTask.status;

  const hasOtherChanges =
    (data.title !== undefined && data.title.trim() !== existingTask.title) ||
    (data.description !== undefined &&
      (data.description ? data.description.trim() : null) !==
        existingTask.description) ||
    (data.priority !== undefined && data.priority !== existingTask.priority) ||
    (data.dueDate !== undefined &&
      (data.dueDate ? new Date(data.dueDate).getTime() : null) !==
        (existingTask.dueDate ? new Date(existingTask.dueDate).getTime() : null));

  return await prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (isStatusChanged) {
      await tx.activity.create({
        data: {
          userId,
          projectId: updatedTask.projectId,
          action: "TASK_STATUS_CHANGED",
          details: {
            taskId: id,
            taskTitle: updatedTask.title,
            from: existingTask.status,
            to: data.status,
          },
        },
      });
    }

    if (hasOtherChanges) {
      await tx.activity.create({
        data: {
          userId,
          projectId: updatedTask.projectId,
          action: "TASK_UPDATED",
          details: {
            taskId: id,
            taskTitle: updatedTask.title,
          },
        },
      });
    }

    return updatedTask;
  });
}

/**
 * Delete a task after verifying user ownership.
 */
export async function deleteTask({ id, userId }) {
  // User ownership check
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingTask) {
    const error = new Error("Task not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    const deletedTask = await tx.task.delete({
      where: { id },
    });

    await tx.activity.create({
      data: {
        userId,
        projectId: existingTask.projectId,
        action: "TASK_DELETED",
        details: {
          taskId: id,
          taskTitle: existingTask.title,
        },
      },
    });

    return deletedTask;
  });
}
