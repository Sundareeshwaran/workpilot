import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createTaskSchema } from "@/validations/task.validation";
import {
  createTask,
  getProjectTasks,
} from "@/services/task.service";
import { prisma } from "@/lib/prisma";

// GET /api/tasks?projectId=...
export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId")?.trim();
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const priority = searchParams.get("priority")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    if (projectId) {
      const tasks = await getProjectTasks({
        userId: session.user.id,
        projectId,
        search,
        status,
        priority,
        sortBy,
        sortOrder,
      });

      return NextResponse.json({
        success: true,
        tasks,
      });
    }

    // If no projectId provided, fetch all user's tasks
    const where = {
      userId: session.user.id,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
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

    const tasks = await prisma.task.findMany({
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

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("FETCH TASKS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch tasks",
      },
      { status: error.statusCode || 500 },
    );
  }
}

// POST /api/tasks
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validateFields = createTaskSchema.safeParse(body);

    if (!validateFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task data",
          errors: validateFields.error.flatten(),
        },
        { status: 400 },
      );
    }

    const projectId = validateFields.data.projectId || body.projectId;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required",
        },
        { status: 400 },
      );
    }

    const task = await createTask({
      userId: session.user.id,
      projectId,
      data: validateFields.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully",
        task,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create task",
      },
      { status: error.statusCode || 500 },
    );
  }
}
