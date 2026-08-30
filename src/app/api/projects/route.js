import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { projectSchema } from "@/validations/project.validation";

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

    const userId = session.user.id;
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

    const data = validateFields.data;

    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        userId,
      },
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 404 },
      );
    }

    const project = await prisma.project.create({
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
        message: "Failed to create project",
      },
      {
        status: 500,
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
        {
          status: 401,
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const priority = searchParams.get("priority")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Pagination query parameters
    const rawPage = parseInt(searchParams.get("page"), 10);
    const rawLimit = parseInt(searchParams.get("limit"), 10);

    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;
    let limit = !isNaN(rawLimit) && rawLimit >= 1 ? rawLimit : 10;
    if (limit > 100) {
      limit = 100;
    }

    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          client: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          client: {
            companyName: {
              contains: search,
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

    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

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
            },
          },
        },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalProjects / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      budget: project.budget,
      currency: project.currency,
      startDate: project.startDate,
      dueDate: project.dueDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      client: project.client,
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        totalProjects,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      page,
      limit,
      totalProjects,
      totalPages,
      hasNextPage,
      hasPreviousPage,
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
