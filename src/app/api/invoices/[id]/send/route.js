import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInvoiceById, updateInvoice } from "@/services/invoice.service";
import { generateInvoicePdfBuffer } from "@/services/invoice-pdf.service";
import { sendInvoiceEmail } from "@/services/email.service";
import { invoiceSendSchema } from "@/validations/invoice.validation";
import { createActivity } from "@/services/activity.service";

/**
 * POST /api/invoices/[id]/send
 * Generates invoice PDF, attaches it to a professional email, and sends it to the client.
 * Transitions status from DRAFT -> SENT and logs INVOICE_SENT audit activity.
 */
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
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

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const validation = invoiceSendSchema.safeParse(body);
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

    // 1. Fetch invoice and verify multi-tenant ownership
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

    // 2. Validate recipient email address
    const recipientEmail =
      validation.data?.recipientEmail?.trim() || invoice.client?.email?.trim();

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Client does not have a valid email address configured. Please provide a recipient email address.",
        },
        { status: 400 }
      );
    }

    // 3. Ensure invoice has line items
    if (!invoice.items || invoice.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot send an invoice without line items.",
        },
        { status: 400 }
      );
    }

    // 4. Generate the trusted server-side PDF buffer
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, {
      name: session.user.name,
      email: session.user.email,
    });

    // 5. Send email with PDF attachment
    const emailResult = await sendInvoiceEmail({
      invoice,
      recipientEmail,
      subject: validation.data?.subject,
      customMessage: validation.data?.message,
      pdfBuffer,
      senderUser: session.user,
    });

    // 6. Transition DRAFT -> SENT if currently in DRAFT status
    let updatedInvoice = invoice;
    if (invoice.status === "DRAFT") {
      updatedInvoice = await updateInvoice({
        id: invoice.id,
        userId: session.user.id,
        data: { status: "SENT" },
      });
    } else {
      // Record explicit INVOICE_SENT activity for resends
      try {
        await createActivity({
          userId: session.user.id,
          projectId: invoice.projectId || null,
          action: "INVOICE_SENT",
          details: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            recipientEmail,
            total: invoice.total,
            isResend: true,
            sentAt: new Date().toISOString(),
          },
        });
      } catch (actErr) {
        console.warn("Activity logging warning for invoice resend:", actErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invoice #${invoice.invoiceNumber || invoice.id} successfully sent to ${recipientEmail}`,
      invoice: updatedInvoice,
      emailInfo: {
        recipient: recipientEmail,
        messageId: emailResult.messageId,
      },
    });
  } catch (error) {
    console.error("SEND INVOICE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send invoice email",
      },
      { status: error.statusCode || 500 }
    );
  }
}
