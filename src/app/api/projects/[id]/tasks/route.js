import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createTaskSchema } from "@/validations/task.validation";
import {
  createTask,
  getProjectTasks,
} from "@/services/task.service";

// GET /api/projects/[id]/tasks
export async function GET(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required",
        },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const priority = searchParams.get("priority")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const tasks = await getProjectTasks({
      userId: session.user.id,
      projectId: id,
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
  } catch (error) {
    console.error("GET PROJECT TASKS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch tasks",
      },
      { status: error.statusCode || 500 },
    );
  }
}

// POST /api/projects/[id]/tasks
export async function POST(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required",
        },
        { status: 400 },
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

    const task = await createTask({
      userId: session.user.id,
      projectId: id,
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
