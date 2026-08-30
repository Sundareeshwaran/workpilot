import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectStats } from "@/services/project.service";

// GET /api/projects/stats
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

    const stats = await getProjectStats({ userId: session.user.id });

    return NextResponse.json({
      success: true,
      stats,
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
