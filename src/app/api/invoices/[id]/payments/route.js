import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { paymentCreateSchema } from "@/validations/payment.validation";
import { getPayments, createPayment } from "@/services/payment.service";

// GET /api/invoices/[id]/payments
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const result = await getPayments({
      userId: session.user.id,
      invoiceId: id,
      limit: 100,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET INVOICE PAYMENTS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch invoice payments",
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/invoices/[id]/payments
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = paymentCreateSchema.safeParse({
      ...body,
      invoiceId: id,
    });

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
    console.error("CREATE INVOICE PAYMENT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to record payment",
      },
      { status: error.statusCode || 500 }
    );
  }
}
