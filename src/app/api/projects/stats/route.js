import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const userId = session.user.id;

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

    return NextResponse.json({
      success: true,
      stats: {
        totalProjects,
        inProgressProjects,
        completedProjects,
        overdueProjects,
        statusCounts,
      },
    });
  } catch (error) {
    console.error("GET PROJECT STATS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch project statistics",
      },
      {
        status: 500,
      },
    );
  }
}
