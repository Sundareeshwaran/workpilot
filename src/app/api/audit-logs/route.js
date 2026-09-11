import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audit-logs
export async function GET() {
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

    const rawLogs = await prisma.activity.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const logs = rawLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      projectId: log.projectId,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      project: log.project
        ? {
            id: log.project.id,
            name: log.project.name,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("GET AUDIT LOGS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch audit logs",
      },
      { status: error.statusCode || 500 },
    );
  }
}
