import { prisma } from "../lib/prisma.js";

/**
 * Pure calculation helper to compute payment metrics for an invoice.
 */
export function calculatePaymentBreakdown({ total = 0, payments = [] }) {
  const numTotal = Math.max(0, Number(Number(total || 0).toFixed(2)));
  const totalPaid = Number(
    payments
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      .toFixed(2)
  );
  const remainingBalance = Math.max(0, Number((numTotal - totalPaid).toFixed(2)));

  let paymentStatus = "UNPAID";
  if (totalPaid >= numTotal && numTotal > 0) {
    paymentStatus = "PAID";
  } else if (totalPaid > 0) {
    paymentStatus = "PARTIALLY_PAID";
  }

  return {
    invoiceTotal: numTotal,
    totalPaid,
    remainingBalance,
    paymentCount: payments.length,
    paymentStatus,
    isFullyPaid: totalPaid >= numTotal && numTotal > 0,
    isPartiallyPaid: totalPaid > 0 && totalPaid < numTotal,
    isUnpaid: totalPaid === 0,
  };
}

/**
 * Calculate payment summary for a specific invoice.
 */
export async function getInvoicePaymentSummary({ invoiceId, userId, tx = null }) {
  const client = tx || prisma;
  const invoice = await client.invoice.findFirst({
    where: { id: invoiceId, userId },
    select: {
      id: true,
      total: true,
      status: true,
      dueDate: true,
      payments: {
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          referenceNumber: true,
        },
      },
    },
  });

  if (!invoice) return null;

  const breakdown = calculatePaymentBreakdown({
    total: Number(invoice.total),
    payments: invoice.payments || [],
  });

  return {
    ...breakdown,
    currentStatus: invoice.status,
  };
}

/**
 * Record a new payment for an invoice with strict ownership, amount, and lifecycle validation.
 */
export async function createPayment({ userId, data }) {
  const paymentAmount = Number(Number(data.amount).toFixed(2));
  if (paymentAmount <= 0) {
    const error = new Error("Payment amount must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Verify Invoice Ownership
    const invoice = await tx.invoice.findFirst({
      where: {
        id: data.invoiceId,
        userId,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        payments: {
          select: { id: true, amount: true },
        },
      },
    });

    if (!invoice) {
      const error = new Error("Invoice not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    if (invoice.status === "CANCELLED") {
      const error = new Error("Cannot record payments for a cancelled or voided invoice");
      error.statusCode = 400;
      throw error;
    }

    // 2. Financial & Balance Calculation
    const invoiceTotal = Number(invoice.total);
    const existingPaid = Number(
      (invoice.payments || [])
        .reduce((sum, p) => sum + Number(p.amount), 0)
        .toFixed(2)
    );
    const remainingBalance = Math.max(0, Number((invoiceTotal - existingPaid).toFixed(2)));

    // Prevent overpayments exceeding balance
    if (paymentAmount > remainingBalance + 0.001) {
      const error = new Error(
        `Payment amount (₹${paymentAmount.toLocaleString("en-IN")}) exceeds the remaining balance of ₹${remainingBalance.toLocaleString("en-IN")}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 3. Create Payment Record
    const newPayment = await tx.payment.create({
      data: {
        userId,
        invoiceId: invoice.id,
        amount: paymentAmount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber ? data.referenceNumber.trim() : null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        notes: data.notes ? data.notes.trim() : null,
      },
    });

    const newTotalPaid = Number((existingPaid + paymentAmount).toFixed(2));
    const newRemainingBalance = Math.max(0, Number((invoiceTotal - newTotalPaid).toFixed(2)));
    const isNowFullyPaid = newRemainingBalance <= 0;

    // 4. Update Invoice Status Transition
    let updatedInvoice = invoice;
    if (isNowFullyPaid && invoice.status !== "PAID") {
      updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID" },
      });
    } else if (!isNowFullyPaid && invoice.status === "DRAFT") {
      // Transition from Draft to Sent once a payment is made
      updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT" },
      });
    }

    // 5. Audit Log: Log Payment Created Activity
    await tx.activity.create({
      data: {
        userId,
        projectId: invoice.projectId,
        action: "PAYMENT_CREATED",
        details: {
          paymentId: newPayment.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client?.name || "Client",
          amount: paymentAmount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || null,
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
          invoiceTotal,
        },
      },
    });

    // 6. Audit Log: Log Invoice Paid Activity if fully settled
    if (isNowFullyPaid && invoice.status !== "PAID") {
      await tx.activity.create({
        data: {
          userId,
          projectId: invoice.projectId,
          action: "INVOICE_PAID",
          details: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.client?.name || "Client",
            total: invoiceTotal,
            settledAt: new Date(),
          },
        },
      });
    }

    return {
      ...newPayment,
      amount: Number(newPayment.amount),
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
        total: invoiceTotal,
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        client: invoice.client,
        project: invoice.project,
      },
    };
  });
}

/**
 * Fetch paginated, filtered payments for the authenticated user.
 */
export async function getPayments({
  userId,
  invoiceId = "",
  clientId = "",
  paymentMethod = "",
  search = "",
  startDate = "",
  endDate = "",
  page = 1,
  limit = 10,
  sortBy = "paymentDate",
  sortOrder = "desc",
}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  let safeLimit = Math.max(1, parseInt(limit, 10) || 10);
  if (safeLimit > 100) safeLimit = 100;
  const skip = (safePage - 1) * safeLimit;

  const where = {
    userId,
  };

  if (invoiceId && invoiceId.trim() !== "" && invoiceId !== "ALL") {
    where.invoiceId = invoiceId;
  }

  if (clientId && clientId.trim() !== "" && clientId !== "ALL") {
    where.invoice = {
      ...(where.invoice || {}),
      clientId,
    };
  }

  if (paymentMethod && paymentMethod.trim() !== "" && paymentMethod !== "ALL") {
    where.paymentMethod = paymentMethod;
  }

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.paymentDate.lte = end;
    }
  }

  if (search && search.trim()) {
    const trimmed = search.trim();
    where.OR = [
      {
        referenceNumber: {
          contains: trimmed,
          mode: "insensitive",
        },
      },
      {
        notes: {
          contains: trimmed,
          mode: "insensitive",
        },
      },
      {
        invoice: {
          invoiceNumber: {
            contains: trimmed,
            mode: "insensitive",
          },
        },
      },
      {
        invoice: {
          client: {
            name: {
              contains: trimmed,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const allowedSortFields = ["paymentDate", "amount", "createdAt", "updatedAt"];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "paymentDate";
  const finalSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const [totalPayments, payments, allUserPayments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
            dueDate: true,
            client: {
              select: {
                id: true,
                name: true,
                companyName: true,
                email: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        [finalSortBy]: finalSortOrder,
      },
      skip,
      take: safeLimit,
    }),
    prisma.payment.findMany({
      where: { userId },
      select: {
        amount: true,
        paymentMethod: true,
        paymentDate: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalPayments / safeLimit) || 1;
  const hasNextPage = safePage < totalPages;
  const hasPreviousPage = safePage > 1;

  // Compute aggregate stats for user
  let totalCollected = 0;
  const methodStats = {};

  for (const p of allUserPayments) {
    const amt = Number(p.amount) || 0;
    totalCollected += amt;
    methodStats[p.paymentMethod] = (methodStats[p.paymentMethod] || 0) + amt;
  }

  return {
    payments: payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      invoice: p.invoice
        ? {
            ...p.invoice,
            total: Number(p.invoice.total),
          }
        : null,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalPayments,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    stats: {
      totalCollected: Number(totalCollected.toFixed(2)),
      totalCount: allUserPayments.length,
      methodBreakdown: methodStats,
    },
  };
}

/**
 * Fetch single payment by ID.
 */
export async function getPaymentById({ id, userId }) {
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      invoice: {
        include: {
          client: true,
          project: true,
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      },
    },
  });

  if (!payment) return null;

  return {
    ...payment,
    amount: Number(payment.amount),
    invoice: payment.invoice
      ? {
          ...payment.invoice,
          subtotal: Number(payment.invoice.subtotal),
          tax: Number(payment.invoice.tax),
          discount: Number(payment.invoice.discount),
          total: Number(payment.invoice.total),
          payments: (payment.invoice.payments || []).map((p) => ({
            ...p,
            amount: Number(p.amount),
          })),
        }
      : null,
  };
}

/**
 * Update an existing payment record with balance and lifecycle synchronization.
 */
export async function updatePayment({ id, userId, data }) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify Payment & Invoice Ownership
    const existing = await tx.payment.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        invoice: {
          include: {
            client: true,
            payments: true,
          },
        },
      },
    });

    if (!existing) {
      const error = new Error("Payment not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    const invoice = existing.invoice;
    const oldAmount = Number(existing.amount);
    const newAmount = data.amount !== undefined ? Number(Number(data.amount).toFixed(2)) : oldAmount;

    if (newAmount <= 0) {
      const error = new Error("Payment amount must be greater than 0");
      error.statusCode = 400;
      throw error;
    }

    // Calculate other payments (excluding this current payment)
    const otherPaymentsPaid = (invoice.payments || [])
      .filter((p) => p.id !== id)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const invoiceTotal = Number(invoice.total);
    const maxAllowedForThisPayment = Math.max(0, Number((invoiceTotal - otherPaymentsPaid).toFixed(2)));

    // Ensure updated amount does not exceed invoice total
    if (newAmount > maxAllowedForThisPayment + 0.001) {
      const error = new Error(
        `Updated payment amount (₹${newAmount.toLocaleString("en-IN")}) exceeds the remaining balance capacity of ₹${maxAllowedForThisPayment.toLocaleString("en-IN")}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 2. Update Payment
    const updated = await tx.payment.update({
      where: { id },
      data: {
        ...(data.amount !== undefined ? { amount: newAmount } : {}),
        ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
        ...(data.paymentDate ? { paymentDate: new Date(data.paymentDate) } : {}),
        ...(data.referenceNumber !== undefined
          ? { referenceNumber: data.referenceNumber ? data.referenceNumber.trim() : null }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes ? data.notes.trim() : null } : {}),
      },
    });

    // 3. Recalculate Totals & Status Transition
    const newTotalPaid = Number((otherPaymentsPaid + newAmount).toFixed(2));
    const newRemainingBalance = Math.max(0, Number((invoiceTotal - newTotalPaid).toFixed(2)));
    const isFullyPaid = newRemainingBalance <= 0;

    let targetInvoiceStatus = invoice.status;
    const isPastDue = invoice.dueDate && new Date(invoice.dueDate) < new Date();

    if (isFullyPaid) {
      targetInvoiceStatus = "PAID";
    } else if (invoice.status === "PAID") {
      // Revert from PAID to SENT or OVERDUE
      targetInvoiceStatus = isPastDue ? "OVERDUE" : "SENT";
    }

    if (targetInvoiceStatus !== invoice.status) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: targetInvoiceStatus },
      });

      if (targetInvoiceStatus === "PAID") {
        await tx.activity.create({
          data: {
            userId,
            projectId: invoice.projectId,
            action: "INVOICE_PAID",
            details: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              clientName: invoice.client?.name || "Client",
              total: invoiceTotal,
              settledAt: new Date(),
            },
          },
        });
      } else {
        await tx.activity.create({
          data: {
            userId,
            projectId: invoice.projectId,
            action: "INVOICE_STATUS_CHANGED",
            details: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              clientName: invoice.client?.name || "Client",
              total: invoiceTotal,
              from: invoice.status,
              to: targetInvoiceStatus,
              reason: "Payment amount adjusted below invoice total",
            },
          },
        });
      }
    }

    // 4. Log Payment Updated Activity
    await tx.activity.create({
      data: {
        userId,
        projectId: invoice.projectId,
        action: "PAYMENT_UPDATED",
        details: {
          paymentId: id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          oldAmount,
          newAmount,
          paymentMethod: updated.paymentMethod,
          referenceNumber: updated.referenceNumber,
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
        },
      },
    });

    return {
      ...updated,
      amount: Number(updated.amount),
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: targetInvoiceStatus,
        total: invoiceTotal,
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
      },
    };
  });
}

/**
 * Delete a payment and revert invoice status if necessary.
 */
export async function deletePayment({ id, userId }) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify Payment Ownership
    const existing = await tx.payment.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        invoice: {
          include: {
            client: true,
            payments: true,
          },
        },
      },
    });

    if (!existing) {
      const error = new Error("Payment not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    const invoice = existing.invoice;
    const deletedAmount = Number(existing.amount);

    // 2. Delete the payment
    const deleted = await tx.payment.delete({
      where: { id },
    });

    // 3. Recalculate remaining payments
    const remainingPayments = (invoice.payments || []).filter((p) => p.id !== id);
    const newTotalPaid = Number(
      remainingPayments
        .reduce((sum, p) => sum + Number(p.amount), 0)
        .toFixed(2)
    );
    const invoiceTotal = Number(invoice.total);
    const newRemainingBalance = Math.max(0, Number((invoiceTotal - newTotalPaid).toFixed(2)));

    // 4. If invoice was PAID and balance is now due, revert status
    const isPastDue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
    let targetStatus = invoice.status;

    if (invoice.status === "PAID" && newRemainingBalance > 0) {
      targetStatus = isPastDue ? "OVERDUE" : "SENT";
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: targetStatus },
      });

      await tx.activity.create({
        data: {
          userId,
          projectId: invoice.projectId,
          action: "INVOICE_STATUS_CHANGED",
          details: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.client?.name || "Client",
            total: invoiceTotal,
            from: "PAID",
            to: targetStatus,
            reason: `Payment of ₹${deletedAmount.toLocaleString("en-IN")} was removed`,
          },
        },
      });
    }

    // 5. Log Activity: PAYMENT_DELETED
    await tx.activity.create({
      data: {
        userId,
        projectId: invoice.projectId,
        action: "PAYMENT_DELETED",
        details: {
          paymentId: id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: deletedAmount,
          paymentMethod: existing.paymentMethod,
          referenceNumber: existing.referenceNumber,
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
        },
      },
    });

    return {
      success: true,
      deletedId: id,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: targetStatus,
        total: invoiceTotal,
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
      },
    };
  });
}
