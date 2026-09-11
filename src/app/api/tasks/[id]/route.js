import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateTaskSchema } from "@/validations/task.validation";
import {
  getTaskById,
  updateTask,
  deleteTask,
} from "@/services/task.service";

// GET /api/tasks/[id]
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
          message: "Task ID is required",
        },
        { status: 400 },
      );
    }

    const task = await getTaskById({
      id,
      userId: session.user.id,
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found or access denied",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("GET TASK ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch task",
      },
      { status: error.statusCode || 500 },
    );
  }
}

// PATCH /api/tasks/[id]
export async function PATCH(request, { params }) {
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
          message: "Task ID is required",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validateFields = updateTaskSchema.safeParse(body);

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

    const updatedTask = await updateTask({
      id,
      userId: session.user.id,
      data: validateFields.data,
    });

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update task",
      },
      { status: error.statusCode || 500 },
    );
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(request, { params }) {
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
          message: "Task ID is required",
        },
        { status: 400 },
      );
    }

    await deleteTask({
      id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete task",
      },
      { status: error.statusCode || 500 },
    );
  }
}
