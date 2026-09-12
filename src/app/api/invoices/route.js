import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { invoiceCreateSchema } from "@/validations/invoice.validation";
import {
  getInvoices,
  createInvoice,
} from "@/services/invoice.service";

// GET /api/invoices
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
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const clientId = searchParams.get("clientId") || "";
    const projectId = searchParams.get("projectId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const result = await getInvoices({
      userId: session.user.id,
      page,
      limit,
      search,
      status,
      clientId,
      projectId,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET INVOICES ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch invoices",
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/invoices
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
    const validation = invoiceCreateSchema.safeParse(body);

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

    const invoice = await createInvoice({
      userId: session.user.id,
      data: validation.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invoice created successfully",
        invoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create invoice",
      },
      { status: error.statusCode || 500 }
    );
  }
}
