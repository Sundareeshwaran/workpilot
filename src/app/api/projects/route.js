import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { projectSchema } from "@/validations/project.validation";
import {
  createProject,
  getProjects,
} from "@/services/project.service";

// POST /api/projects/
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
    const validateFields = projectSchema.safeParse(body);

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

    const project = await createProject({
      userId: session.user.id,
      data: validateFields.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        project,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create project",
      },
      {
        status: error.statusCode || 500,
      },
    );
  }
}

// GET /api/projects/
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

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const priority = searchParams.get("priority")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = searchParams.get("page") || 1;
    const limit = searchParams.get("limit") || 10;

    const result = await getProjects({
      userId: session.user.id,
      page,
      limit,
      search,
      status,
      priority,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("FETCH PROJECTS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch projects",
      },
      {
        status: 500,
      },
    );
  }
}
