import PDFDocument from "pdfkit";

/**
 * Format currency nicely for printable PDF documents (e.g. INR 12,450.00)
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "INR " + num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date for invoice headers
 */
function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Generate a high quality, clean, printable, single-page professional invoice PDF buffer.
 *
 * @param {Object} invoice - Invoice object fetched with Prisma (including client, project, items)
 * @param {Object} user - Authenticated user / business owner info
 * @returns {Promise<Buffer>}
 */
export function generateInvoicePdfBuffer(invoice, user = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Invoice ${invoice.invoiceNumber || "Draft"}`,
          Author: "Work Pilot",
          Subject: "Invoice Document",
          Creator: "Work Pilot Invoice Generator",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      doc.on("error", (err) => reject(err));

      const pageWidth = doc.page.width; // 595.28 pt
      const pageHeight = doc.page.height; // 841.89 pt
      const margin = 36;
      const contentWidth = pageWidth - margin * 2; // 523.28 pt

      // Work Pilot Design System Tokens (matching globals.css)
      const primaryDark = "#1C1917"; // Deep Warm Charcoal / Stone 900
      const brandAccent = "#D95B27"; // Work Pilot Terracotta / Brand Primary
      const textDark = "#1C1917"; // Deep Stone 900
      const textBody = "#443E38"; // Warm Stone 700
      const textMuted = "#78716C"; // Warm Stone 500
      const lightBg = "#FAF8F5"; // Warm Sand / Canvas 50
      const borderSlate = "#E7E5E4"; // Warm Stone 200

      // 1. Header Banner
      const headerY = 36;
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor(primaryDark)
        .text("WORK PILOT", margin, headerY);

      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(textMuted)
        .text("Project & Billing Management", margin, headerY + 24);

      // Right Header: INVOICE & #
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor(brandAccent)
        .text("INVOICE", margin, headerY, { align: "right", width: contentWidth });

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(textDark)
        .text(`#${invoice.invoiceNumber || "DRAFT"}`, margin, headerY + 22, {
          align: "right",
          width: contentWidth,
        });

      // Status Badge on Right
      const status = (invoice.status || "DRAFT").toUpperCase();
      let statusBg = "#E7E5E4";
      let statusColor = "#443E38";
      if (status === "PAID") {
        statusBg = "#DCFCE7";
        statusColor = "#166534";
      } else if (status === "SENT") {
        statusBg = "#E0F2FE";
        statusColor = "#0369A1";
      } else if (status === "OVERDUE") {
        statusBg = "#FEE2E2";
        statusColor = "#991B1B";
      } else if (status === "CANCELLED") {
        statusBg = "#F5F5F4";
        statusColor = "#78716C";
      }

      const statusWidth = 68;
      const statusHeight = 16;
      const statusX = margin + contentWidth - statusWidth;
      const statusY = headerY + 38;

      doc
        .roundedRect(statusX, statusY, statusWidth, statusHeight, 3)
        .fill(statusBg);

      doc
        .fontSize(7.5)
        .font("Helvetica-Bold")
        .fillColor(statusColor)
        .text(status, statusX, statusY + 3.5, {
          width: statusWidth,
          align: "center",
        });

      // Divider Line
      const dividerY = 100;
      doc
        .strokeColor(borderSlate)
        .lineWidth(1)
        .moveTo(margin, dividerY)
        .lineTo(margin + contentWidth, dividerY)
        .stroke();

      // 2. Metadata Grid (3 columns: Issued By, Billed To, Invoice Details)
      const gridY = 112;
      const colWidth = contentWidth / 3;

      // Col 1: Issued By
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(textMuted)
        .text("ISSUED BY", margin, gridY);

      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor(textDark)
        .text(user.name || "Work Pilot Account", margin, gridY + 12);

      if (user.email) {
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(textMuted)
          .text(user.email, margin, gridY + 25);
      }

      // Col 2: Billed To (Client)
      const col2X = margin + colWidth;
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(textMuted)
        .text("BILLED TO", col2X, gridY);

      const clientName = invoice.client?.name || "Valued Client";
      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor(textDark)
        .text(clientName, col2X, gridY + 12);

      let clientDetailsY = gridY + 25;
      if (invoice.client?.companyName || invoice.client?.company) {
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(textBody)
          .text(invoice.client.companyName || invoice.client.company, col2X, clientDetailsY);
        clientDetailsY += 11;
      }
      if (invoice.client?.email) {
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(textMuted)
          .text(invoice.client.email, col2X, clientDetailsY);
        clientDetailsY += 11;
      }
      if (invoice.client?.phone) {
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(textMuted)
          .text(invoice.client.phone, col2X, clientDetailsY);
      }

      // Col 3: Invoice Dates & Project
      const col3X = margin + colWidth * 2;
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(textMuted)
        .text("INVOICE DETAILS", col3X, gridY);

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(textDark)
        .text("Issue Date: ", col3X, gridY + 12, { continued: true })
        .font("Helvetica")
        .fillColor(textBody)
        .text(formatDate(invoice.issueDate));

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(textDark)
        .text("Due Date: ", col3X, gridY + 24, { continued: true })
        .font("Helvetica-Bold")
        .fillColor(invoice.isOverdue ? "#DC2626" : textBody)
        .text(formatDate(invoice.dueDate));

      if (invoice.project?.name) {
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(textDark)
          .text("Project: ", col3X, gridY + 36, { continued: true })
          .font("Helvetica")
          .fillColor(textBody)
          .text(invoice.project.name);
      }

      // 3. Line Items Table
      let tableY = Math.max(clientDetailsY + 14, gridY + 54, 178);

      const colNoW = 28;
      const colDescW = 245;
      const colQtyW = 45;
      const colRateW = 95;
      const colAmountW = 110;

      const xNo = margin;
      const xDesc = xNo + colNoW;
      const xQty = xDesc + colDescW;
      const xRate = xQty + colQtyW;
      const xAmount = xRate + colRateW;

      // Table Header Row
      const tableHeaderHeight = 22;
      doc.rect(margin, tableY, contentWidth, tableHeaderHeight).fill(primaryDark);

      doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("#", xNo + 6, tableY + 6);
      doc.text("ITEM & DESCRIPTION", xDesc + 6, tableY + 6);
      doc.text("QTY", xQty, tableY + 6, { width: colQtyW - 8, align: "right" });
      doc.text("RATE", xRate, tableY + 6, { width: colRateW - 8, align: "right" });
      doc.text("AMOUNT", xAmount, tableY + 6, { width: colAmountW - 8, align: "right" });

      tableY += tableHeaderHeight;

      const items = invoice.items || [];
      const rowHeight = 22;

      items.forEach((item, index) => {
        // Only paginate if item overflow exceeds physical page limits
        if (tableY + rowHeight > pageHeight - 150) {
          doc.addPage();
          tableY = 36;
          doc.rect(margin, tableY, contentWidth, tableHeaderHeight).fill(primaryDark);
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
          doc.text("#", xNo + 6, tableY + 6);
          doc.text("ITEM & DESCRIPTION", xDesc + 6, tableY + 6);
          doc.text("QTY", xQty, tableY + 6, { width: colQtyW - 8, align: "right" });
          doc.text("RATE", xRate, tableY + 6, { width: colRateW - 8, align: "right" });
          doc.text("AMOUNT", xAmount, tableY + 6, { width: colAmountW - 8, align: "right" });
          tableY += tableHeaderHeight;
        }

        if (index % 2 === 1) {
          doc.rect(margin, tableY, contentWidth, rowHeight).fill(lightBg);
        }

        doc
          .strokeColor(borderSlate)
          .lineWidth(0.5)
          .moveTo(margin, tableY + rowHeight)
          .lineTo(margin + contentWidth, tableY + rowHeight)
          .stroke();

        const desc = item.service || item.description || "Service deliverable";
        const qty = item.quantity || 1;
        const rate = Number(item.rate !== undefined ? item.rate : item.unitPrice) || 0;
        const amount = Number(item.amount !== undefined ? item.amount : qty * rate) || 0;

        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(textMuted)
          .text(String(index + 1), xNo + 6, tableY + 6);

        doc
          .font("Helvetica-Bold")
          .fillColor(textDark)
          .text(desc, xDesc + 6, tableY + 6, { width: colDescW - 12, ellipsis: true });

        doc
          .font("Helvetica")
          .fillColor(textMuted)
          .text(String(qty), xQty, tableY + 6, { width: colQtyW - 8, align: "right" });

        doc
          .text(formatCurrency(rate), xRate, tableY + 6, { width: colRateW - 8, align: "right" });

        doc
          .font("Helvetica-Bold")
          .fillColor(textDark)
          .text(formatCurrency(amount), xAmount, tableY + 6, { width: colAmountW - 8, align: "right" });

        tableY += rowHeight;
      });

      // 4. Financial Summary & Notes (Side by Side)
      const summaryStartY = tableY + 12;
      const summaryBoxWidth = 210;
      const summaryBoxX = margin + contentWidth - summaryBoxWidth;
      const notesWidth = contentWidth - summaryBoxWidth - 20;

      const subtotal = Number(invoice.subtotal) || 0;
      const tax = Number(invoice.tax) || 0;
      const discount = Number(invoice.discount) || 0;
      const total = Number(invoice.total) || 0;

      let curSummaryY = summaryStartY;

      // Subtotal Line
      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(textMuted)
        .text("Subtotal:", summaryBoxX, curSummaryY)
        .font("Helvetica-Bold")
        .fillColor(textDark)
        .text(formatCurrency(subtotal), summaryBoxX, curSummaryY, {
          width: summaryBoxWidth - 8,
          align: "right",
        });

      curSummaryY += 15;

      // Discount (if any)
      if (discount > 0) {
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor("#DC2626")
          .text("Discount:", summaryBoxX, curSummaryY)
          .text(`-${formatCurrency(discount)}`, summaryBoxX, curSummaryY, {
            width: summaryBoxWidth - 8,
            align: "right",
          });
        curSummaryY += 15;
      }

      // Tax (if any)
      if (tax > 0) {
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor(textMuted)
          .text("Tax / GST:", summaryBoxX, curSummaryY)
          .font("Helvetica")
          .fillColor(textDark)
          .text(`+${formatCurrency(tax)}`, summaryBoxX, curSummaryY, {
            width: summaryBoxWidth - 8,
            align: "right",
          });
        curSummaryY += 15;
      }

      // Total Amount Box
      curSummaryY += 4;
      const totalBoxHeight = 28;
      doc
        .roundedRect(summaryBoxX - 6, curSummaryY, summaryBoxWidth + 6, totalBoxHeight, 3)
        .fill(primaryDark);

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#FFFFFF")
        .text("Total Due:", summaryBoxX + 4, curSummaryY + 8)
        .fontSize(10.5)
        .fillColor(brandAccent)
        .text(formatCurrency(total), summaryBoxX, curSummaryY + 7, {
          width: summaryBoxWidth - 8,
          align: "right",
        });

      // Notes on Left
      if (invoice.notes) {
        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .fillColor(textDark)
          .text("NOTES & PAYMENT INSTRUCTIONS", margin, summaryStartY);

        doc
          .fontSize(7.5)
          .font("Helvetica")
          .fillColor(textMuted)
          .text(invoice.notes, margin, summaryStartY + 10, {
            width: notesWidth,
            lineGap: 1.5,
          });
      }

      // 5. Fixed Page Footer
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0; // Prevent PDFKit auto-page overflow on footer
        const footerY = pageHeight - 28;

        doc
          .strokeColor(borderSlate)
          .lineWidth(0.5)
          .moveTo(margin, footerY - 6)
          .lineTo(margin + contentWidth, footerY - 6)
          .stroke();

        doc
          .fontSize(7.5)
          .font("Helvetica")
          .fillColor(textMuted)
          .text(
            "Thank you for your business. Generated securely via Work Pilot.",
            margin,
            footerY,
            { align: "left", width: contentWidth / 2, lineBreak: false }
          );

        doc
          .fontSize(7.5)
          .font("Helvetica")
          .fillColor(textMuted)
          .text(
            totalPages > 1 ? `Page ${i + 1} of ${totalPages}` : "Page 1 of 1",
            margin + contentWidth / 2,
            footerY,
            { align: "right", width: contentWidth / 2, lineBreak: false }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
