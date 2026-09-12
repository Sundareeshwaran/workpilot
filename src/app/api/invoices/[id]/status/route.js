import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { invoiceStatusSchema } from "@/validations/invoice.validation";
import { updateInvoice } from "@/services/invoice.service";

// PATCH /api/invoices/[id]/status
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
        { success: false, message: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = invoiceStatusSchema.safeParse(body);

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

    const invoice = await updateInvoice({
      id,
      userId: session.user.id,
      data: { status: validation.data.status },
    });

    return NextResponse.json({
      success: true,
      message: `Invoice status updated to ${validation.data.status}`,
      invoice,
    });
  } catch (error) {
    console.error("UPDATE INVOICE STATUS ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update invoice status",
      },
      { status: error.statusCode || 500 }
    );
  }
}
