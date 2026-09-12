import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { invoiceUpdateSchema } from "@/validations/invoice.validation";
import {
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "@/services/invoice.service";

// GET /api/invoices/[id]
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

    const invoice = await getInvoiceById({
      id,
      userId: session.user.id,
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("GET INVOICE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch invoice",
      },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH /api/invoices/[id]
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
    const validation = invoiceUpdateSchema.safeParse(body);

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
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("UPDATE INVOICE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update invoice",
      },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE /api/invoices/[id]
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
        { success: false, message: "Invoice ID is required" },
        { status: 400 }
      );
    }

    await deleteInvoice({
      id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("DELETE INVOICE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete invoice",
      },
      { status: error.statusCode || 500 }
    );
  }
}
