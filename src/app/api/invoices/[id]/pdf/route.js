import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInvoiceById } from "@/services/invoice.service";
import { generateInvoicePdfBuffer } from "@/services/invoice-pdf.service";
import { createActivity } from "@/services/activity.service";

/**
 * GET /api/invoices/[id]/pdf
 * Generates and returns a server-rendered PDF document for the specified invoice.
 * Enforces authenticated multi-tenant ownership verification.
 */
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

    // Secure multi-tenant invoice fetch
    const invoice = await getInvoiceById({
      id,
      userId: session.user.id,
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found or access denied" },
        { status: 404 }
      );
    }

    // Generate PDF buffer using trusted backend data
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, {
      name: session.user.name,
      email: session.user.email,
    });

    // Record audit activity if associated with a project (or standalone)
    try {
      await createActivity({
        userId: session.user.id,
        projectId: invoice.projectId || null,
        action: "INVOICE_PDF_GENERATED",
        details: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client?.name || null,
          total: invoice.total,
        },
      });
    } catch (actErr) {
      // Non-blocking for PDF generation
      console.warn("Could not record INVOICE_PDF_GENERATED activity:", actErr);
    }

    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "true" || searchParams.get("download") === "1";
    const filename = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
    const dispositionType = isDownload ? "attachment" : "inline";

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${dispositionType}; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET INVOICE PDF ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate invoice PDF",
      },
      { status: error.statusCode || 500 }
    );
  }
}
