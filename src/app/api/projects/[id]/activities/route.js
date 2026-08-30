import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectActivities } from "@/services/activity.service";

// GET /api/projects/[id]/activities
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

    const activities = await getProjectActivities({
      userId: session.user.id,
      projectId: id,
    });

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("GET PROJECT ACTIVITIES ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch activities",
      },
      { status: error.statusCode || 500 },
    );
  }
}
