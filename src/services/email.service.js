import nodemailer from "nodemailer";

/**
 * Creates and configures the nodemailer transporter.
 * Supports:
 * 1. Well-known services (e.g. SMTP_SERVICE=gmail, SMTP_USER=..., SMTP_PASS=...)
 * 2. Custom SMTP servers (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE)
 * 3. Graceful fallback to JSON transport in development/test if credentials are not configured.
 */
export function getEmailTransporter() {
  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  // 1. Service-based configuration (e.g., Gmail)
  if (service && user && pass) {
    return nodemailer.createTransport({
      service,
      auth: {
        user,
        pass,
      },
    });
  }

  // 2. Custom SMTP host configuration (e.g. Resend, Brevo, Sendgrid, Postmark)
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // 3. Graceful fallback for local development & testing environments
  // Uses JSON transport that serializes message safely without requiring live SMTP credentials
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

/**
 * Verify transporter connection (useful for diagnostic tests)
 */
export async function verifyEmailTransporter() {
  const transporter = getEmailTransporter();
  if (
    transporter.transporter?.name === "JSONTransport" ||
    transporter.options?.jsonTransport
  ) {
    return {
      configured: false,
      status: "Development Mock (JSON Transport Active)",
    };
  }
  try {
    await transporter.verify();
    return {
      configured: true,
      status: "Connected & Authenticated Successfully",
    };
  } catch (err) {
    return {
      configured: false,
      status: "Verification Failed",
      error: err.message,
    };
  }
}

function formatCurrency(val = 0) {
  return (
    "INR " +
    Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Sends an invoice email with the PDF attached to the client.
 *
 * @param {Object} options
 * @param {Object} options.invoice - Invoice data object (with client, project, items, totals)
 * @param {string} options.recipientEmail - Target recipient email address
 * @param {string} [options.subject] - Optional custom subject
 * @param {string} [options.customMessage] - Optional custom body message
 * @param {Buffer} options.pdfBuffer - Generated PDF buffer
 * @param {Object} [options.senderUser] - Current authenticated user
 * @returns {Promise<{ success: boolean, messageId: string, recipient: string }>}
 */
export async function sendInvoiceEmail({
  invoice,
  recipientEmail,
  subject,
  customMessage,
  pdfBuffer,
  senderUser = {},
}) {
  if (
    !recipientEmail ||
    typeof recipientEmail !== "string" ||
    !recipientEmail.includes("@")
  ) {
    throw new Error(
      "A valid recipient email address is required to send the invoice.",
    );
  }

  const transporter = getEmailTransporter();
  const fromEmail =
    process.env.EMAIL_FROM ||
    (senderUser.email
      ? `"${senderUser.name || "Work Pilot"}" <${senderUser.email}>`
      : '"Work Pilot Invoicing" <billing@workpilot.io>');

  const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.slice(-6)}`;
  const defaultSubject = `Invoice #${invoiceNum} from ${senderUser.name || "Work Pilot"} - ${formatCurrency(invoice.total)}`;
  const emailSubject = subject?.trim() || defaultSubject;

  const clientName = invoice.client?.name || "Valued Client";
  const formattedDueDate = formatDate(invoice.dueDate);
  const formattedIssueDate = formatDate(invoice.issueDate);
  const payments = invoice.payments || [];
  const paidAmount = Number(
    payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)
  );
  const remainingBalance =
    invoice.status === "PAID"
      ? 0
      : Math.max(0, Number((Number(invoice.total || 0) - paidAmount).toFixed(2)));

  const formattedTotal = formatCurrency(invoice.total);
  const formattedPaid = formatCurrency(paidAmount);
  const formattedBalance = formatCurrency(remainingBalance);

  const defaultNote =
    "Thank you for your business. Please find attached the formal PDF invoice for your review and records. Let us know if you have any questions.";
  const noteText =
    customMessage?.trim() || invoice.notes?.trim() || defaultNote;

  // HTML Email Template (styled with Work Pilot theme tokens)
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f6f0; margin: 0; padding: 28px 16px; color: #1c1917; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); }
    .header { background: #1c1917; padding: 26px 32px; color: #ffffff; border-bottom: 3px solid #d95b27; }
    .brand-title { display: flex; align-items: center; gap: 8px; font-size: 19px; font-weight: 800; letter-spacing: -0.3px; color: #ffffff; margin: 0; }
    .brand-tag { display: inline-block; background: #d95b27; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #a8a29e; }
    .content { padding: 32px; }
    .greeting { font-size: 16px; font-weight: 700; color: #1c1917; margin-bottom: 12px; }
    .intro-text { font-size: 14px; line-height: 1.55; color: #443e38; margin: 0 0 18px 0; }
    .message-box { background: #faf8f5; border-left: 4px solid #d95b27; padding: 14px 18px; border-radius: 6px; margin: 18px 0; font-size: 13.5px; line-height: 1.55; color: #443e38; border-top: 1px solid #f5f2eb; border-right: 1px solid #f5f2eb; border-bottom: 1px solid #f5f2eb; }
    .summary-card { background: #faf8f5; border: 1px solid #e7e5e4; border-radius: 10px; padding: 20px; margin: 24px 0; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: #78716c; }
    .summary-row strong { color: #1c1917; font-weight: 600; }
    .summary-total { border-top: 1px solid #e7e5e4; padding-top: 12px; margin-top: 10px; font-size: 16px; font-weight: 800; color: #1c1917; display: flex; justify-content: space-between; align-items: center; }
    .total-amount { color: #d95b27; font-size: 18px; font-weight: 800; }
    .attachment-notice { background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 12px 16px; margin: 22px 0 0 0; font-size: 12.5px; color: #c2410c; display: flex; align-items: center; }
    .footer { padding: 20px 32px; background: #faf8f5; border-top: 1px solid #e7e5e4; text-align: center; font-size: 12px; color: #78716c; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1 class="brand-title">WORK PILOT</h1>
        <span class="brand-tag">INVOICE</span>
      </div>
      <p>Invoice #${invoiceNum}</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${clientName},</div>
      <p class="intro-text">
        You have received a new invoice from <strong>${senderUser.name || "Work Pilot"}</strong>.
      </p>

      <div class="message-box">
        ${noteText.replace(/\n/g, "<br>")}
      </div>

      <div class="summary-card">
        <div class="summary-row">
          <span>Invoice Number:</span>
          <strong>#${invoiceNum}</strong>
        </div>
        <div class="summary-row">
          <span>Issue Date:</span>
          <span>${formattedIssueDate}</span>
        </div>
        <div class="summary-row">
          <span>Due Date:</span>
          <strong style="color: #dc2626;">${formattedDueDate}</strong>
        </div>
        ${
          invoice.project?.name
            ? `<div class="summary-row"><span>Project:</span><strong>${invoice.project.name}</strong></div>`
            : ""
        }
        <div class="summary-row">
          <span>Total Invoiced:</span>
          <strong>${formattedTotal}</strong>
        </div>
        ${
          paidAmount > 0
            ? `<div class="summary-row" style="color: #166534;"><span>Amount Paid:</span><strong>-${formattedPaid}</strong></div>`
            : ""
        }
        <div class="summary-total">
          <span>${paidAmount > 0 ? "Remaining Balance Due:" : "Total Amount Due:"}</span>
          <span class="total-amount">${paidAmount > 0 ? formattedBalance : formattedTotal}</span>
        </div>
      </div>

      <div class="attachment-notice">
        📄 <strong>Attached:</strong> &nbsp; invoice-${invoiceNum}.pdf contains full itemized breakdown and terms.
      </div>
    </div>
    <div class="footer">
      Generated & Sent securely via Work Pilot Invoicing.
    </div>
  </div>
</body>
</html>
`;

  // Plain text fallback
  const textContent = `
WORK PILOT INVOICE
======================================
Invoice: #${invoiceNum}
To: ${clientName}
Issue Date: ${formattedIssueDate}
Due Date: ${formattedDueDate}
${invoice.project?.name ? `Project: ${invoice.project.name}\n` : ""}Total Invoiced: ${formattedTotal}
${paidAmount > 0 ? `Amount Paid: -${formattedPaid}\nRemaining Balance Due: ${formattedBalance}\n` : `Amount Due: ${formattedTotal}\n`}
Message:
${noteText}

A complete PDF copy of invoice #${invoiceNum} has been attached to this email.
======================================
Generated via Work Pilot Invoicing
`;

  const mailOptions = {
    from: fromEmail,
    to: recipientEmail,
    subject: emailSubject,
    text: textContent,
    html: htmlContent,
    attachments: [
      {
        filename: `invoice-${invoiceNum}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);

  return {
    success: true,
    messageId: info.messageId || `msg_${Date.now()}`,
    recipient: recipientEmail,
  };
}
