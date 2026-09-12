import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { paymentUpdateSchema } from "@/validations/payment.validation";
import {
  getPaymentById,
  updatePayment,
  deletePayment,
} from "@/services/payment.service";

// GET /api/payments/[id]
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
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    const payment = await getPaymentById({
      id,
      userId: session.user.id,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("GET PAYMENT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch payment",
      },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH /api/payments/[id]
export async function PATCH(request, { params }) {
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
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = paymentUpdateSchema.safeParse(body);

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

    const payment = await updatePayment({
      id,
      userId: session.user.id,
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    console.error("UPDATE PAYMENT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update payment",
      },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE /api/payments/[id]
export async function DELETE(request, { params }) {
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
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    const result = await deletePayment({
      id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Payment deleted successfully",
      ...result,
    });
  } catch (error) {
    console.error("DELETE PAYMENT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete payment",
      },
      { status: error.statusCode || 500 }
    );
  }
}
