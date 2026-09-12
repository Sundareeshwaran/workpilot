import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { paymentCreateSchema, paymentQuerySchema } from "@/validations/payment.validation";
import { getPayments, createPayment } from "@/services/payment.service";

// GET /api/payments
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      invoiceId: searchParams.get("invoiceId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    };

    const parsedQuery = paymentQuerySchema.parse(queryParams);

    const result = await getPayments({
      userId: session.user.id,
      ...parsedQuery,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch payments",
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/payments
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = paymentCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payment = await createPayment({
      userId: session.user.id,
      data: validation.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment recorded successfully",
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to record payment",
      },
      { status: error.statusCode || 500 }
    );
  }
}
