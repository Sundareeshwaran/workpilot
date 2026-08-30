import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { projectUpdateSchema } from "@/validations/project.validation";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/services/project.service";

// GET /api/projects/[id]
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

    const project = await getProjectById({
      id,
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("GET PROJECT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch project",
      },
      { status: error.statusCode || 500 },
    );
  }
}

// PATCH /api/projects/[id]
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
          message: "Project ID is required",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validateFields = projectUpdateSchema.safeParse(body);

    if (!validateFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project data",
          errors: validateFields.error.flatten(),
        },
        { status: 400 },
      );
    }

    const updatedProject = await updateProject({
      id,
      userId: session.user.id,
      data: validateFields.data,
    });

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update project",
      },
      { status: error.statusCode || 500 },
    );
  }
}

// DELETE /api/projects/[id]
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
          message: "Project ID is required",
        },
        { status: 400 },
      );
    }

    await deleteProject({
      id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete project",
      },
      { status: error.statusCode || 500 },
    );
  }
}
