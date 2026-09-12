import { prisma } from "../lib/prisma.js";

/**
 * Pure calculation helper for invoice line items and totals.
 */
export function calculateInvoiceFinancials({ items = [], tax = 0, discount = 0 }) {
  const itemsWithAmounts = items.map((item, index) => {
    const desc = (item.description || item.service || "").trim();
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const price = Math.max(
      0,
      Number(item.unitPrice !== undefined ? item.unitPrice : item.rate) || 0
    );
    const amount = Number((qty * price).toFixed(2));
    return {
      ...(item.id ? { id: item.id } : {}),
      service: desc,
      description: desc,
      quantity: qty,
      rate: price,
      unitPrice: price,
      amount,
      order: index,
    };
  });

  const subtotal = Number(
    itemsWithAmounts.reduce((acc, item) => acc + item.amount, 0).toFixed(2)
  );

  const numTax = Math.max(0, Number(Number(tax || 0).toFixed(2)));
  const numDiscount = Math.max(0, Number(Number(discount || 0).toFixed(2)));
  const total = Math.max(0, Number((subtotal + numTax - numDiscount).toFixed(2)));

  return {
    itemsWithAmounts,
    subtotal,
    tax: numTax,
    discount: numDiscount,
    total,
  };
}

/**
 * Generate a unique 16-character invoice number containing YYYYMMDD (e.g. INV-20260912-001).
 */
export async function generateInvoiceNumber(userId) {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yyyymmdd = `${yyyy}${mm}${dd}`; // 8 characters
  const prefix = `INV-${yyyymmdd}-`; // 13 characters (INV- + 8 chars + -)

  // Count existing invoices for today to determine sequential number
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
  });

  let seq = count + 1;
  let candidate = `${prefix}${String(seq).padStart(3, "0")}`; // Exactly 16 characters

  // Verify candidate uniqueness in the database
  let attempts = 0;
  while (attempts < 20) {
    const exists = await prisma.invoice.findUnique({
      where: { invoiceNumber: candidate },
    });

    if (!exists && candidate.length === 16) {
      return candidate;
    }

    // Generate random 3-character alphanumeric suffix to ensure exact 16-char length and uniqueness
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomSuffix = "";
    for (let i = 0; i < 3; i++) {
      randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    candidate = `${prefix}${randomSuffix}`;
    attempts++;
  }

  // Fallback guaranteed 16 chars
  const randomEnd = Math.random().toString(36).substring(2, 5).toUpperCase().padStart(3, "0");
  return `${prefix}${randomEnd}`.slice(0, 16);
}

/**
 * Fetch paginated, filtered, and sorted invoices with financial metrics.
 */
export async function getInvoices({
  userId,
  page = 1,
  limit = 10,
  search = "",
  status = "",
  clientId = "",
  projectId = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  let safeLimit = Math.max(1, parseInt(limit, 10) || 10);
  if (safeLimit > 100) safeLimit = 100;
  const skip = (safePage - 1) * safeLimit;

  const where = {
    userId,
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (clientId && clientId !== "ALL") {
    where.clientId = clientId;
  }

  if (projectId && projectId !== "ALL") {
    where.projectId = projectId;
  }

  if (search && search.trim()) {
    const trimmed = search.trim();
    where.OR = [
      {
        invoiceNumber: {
          contains: trimmed,
          mode: "insensitive",
        },
      },
      {
        client: {
          name: {
            contains: trimmed,
            mode: "insensitive",
          },
        },
      },
      {
        client: {
          companyName: {
            contains: trimmed,
            mode: "insensitive",
          },
        },
      },
      {
        project: {
          name: {
            contains: trimmed,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "issueDate",
    "dueDate",
    "invoiceNumber",
    "total",
    "status",
  ];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const finalSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const [totalInvoices, invoices, allUserInvoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: {
        [finalSortBy]: finalSortOrder,
      },
      skip,
      take: safeLimit,
    }),
    prisma.invoice.findMany({
      where: { userId },
      select: {
        total: true,
        status: true,
        dueDate: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalInvoices / safeLimit) || 1;
  const hasNextPage = safePage < totalPages;
  const hasPreviousPage = safePage > 1;

  // Calculate high-level stats for user
  const now = new Date();
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let draftCount = 0;
  let overdueCount = 0;

  for (const inv of allUserInvoices) {
    const numTotal = Number(inv.total) || 0;
    totalInvoiced += numTotal;

    if (inv.status === "PAID") {
      totalPaid += numTotal;
    } else if (inv.status === "DRAFT") {
      draftCount++;
      totalPending += numTotal;
    } else if (inv.status === "SENT") {
      totalPending += numTotal;
      if (new Date(inv.dueDate) < now) {
        overdueCount++;
      }
    } else if (inv.status === "OVERDUE") {
      totalPending += numTotal;
      overdueCount++;
    }
  }

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      subtotal: Number(inv.subtotal),
      tax: Number(inv.tax),
      discount: Number(inv.discount),
      total: Number(inv.total),
      items: (inv.items || []).map((it, idx) => ({
        id: it.id,
        invoiceId: it.invoiceId,
        service: it.service,
        description: it.service,
        quantity: it.quantity,
        rate: Number(it.rate),
        unitPrice: Number(it.rate),
        amount: Number(it.amount),
        order: idx,
      })),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalInvoices,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    stats: {
      totalInvoices: allUserInvoices.length,
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalPending: Number(totalPending.toFixed(2)),
      draftCount,
      overdueCount,
    },
  };
}

/**
 * Fetch a single invoice by ID with items, client, and project.
 */
export async function getInvoiceById({ id, userId }) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      client: true,
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      items: {
        orderBy: { createdAt: "asc" },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax),
    discount: Number(invoice.discount),
    total: Number(invoice.total),
    items: (invoice.items || []).map((it, idx) => ({
      id: it.id,
      invoiceId: it.invoiceId,
      service: it.service,
      description: it.service,
      quantity: it.quantity,
      rate: Number(it.rate),
      unitPrice: Number(it.rate),
      amount: Number(it.amount),
      order: idx,
      createdAt: it.createdAt,
    })),
  };
}

/**
 * Create a new invoice for a user with client/project ownership verification.
 */
export async function createInvoice({ userId, data }) {
  // 1. Verify Client Ownership
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      userId,
    },
  });

  if (!client) {
    const error = new Error("Client not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify Project Ownership (if projectId is specified)
  let project = null;
  if (data.projectId && data.projectId.trim() !== "") {
    project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId,
      },
    });

    if (!project) {
      const error = new Error("Project not found or access denied");
      error.statusCode = 404;
      throw error;
    }
  }

  // 3. Resolve Invoice Number
  let finalInvoiceNumber = (data.invoiceNumber || "").trim();
  if (!finalInvoiceNumber) {
    finalInvoiceNumber = await generateInvoiceNumber(userId);
  } else {
    // Check uniqueness
    const duplicate = await prisma.invoice.findUnique({
      where: { invoiceNumber: finalInvoiceNumber },
    });
    if (duplicate) {
      const error = new Error(`Invoice number "${finalInvoiceNumber}" already exists.`);
      error.statusCode = 409;
      throw error;
    }
  }

  // 4. Calculate financials
  const { itemsWithAmounts, subtotal, tax, discount, total } =
    calculateInvoiceFinancials({
      items: data.items,
      tax: data.tax,
      discount: data.discount,
    });

  // 5. Transactional Creation & Activity Log
  return await prisma.$transaction(async (tx) => {
    const newInvoice = await tx.invoice.create({
      data: {
        userId,
        clientId: data.clientId,
        projectId: project ? project.id : null,
        invoiceNumber: finalInvoiceNumber,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        subtotal,
        tax,
        discount,
        total,
        notes: data.notes ? data.notes.trim() : null,
        status: data.status || "DRAFT",
        items: {
          create: itemsWithAmounts.map((it) => ({
            service: it.service,
            quantity: it.quantity,
            rate: it.rate,
            amount: it.amount,
          })),
        },
      },
      include: {
        client: true,
        project: true,
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Log Activity to unified audit system
    await tx.activity.create({
      data: {
        userId,
        projectId: project ? project.id : null,
        action: "INVOICE_CREATED",
        details: {
          invoiceId: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber,
          clientName: client.name,
          total,
          status: newInvoice.status,
          itemCount: itemsWithAmounts.length,
        },
      },
    });

    return {
      ...newInvoice,
      subtotal: Number(newInvoice.subtotal),
      tax: Number(newInvoice.tax),
      discount: Number(newInvoice.discount),
      total: Number(newInvoice.total),
      items: (newInvoice.items || []).map((it, idx) => ({
        id: it.id,
        invoiceId: it.invoiceId,
        service: it.service,
        description: it.service,
        quantity: it.quantity,
        rate: Number(it.rate),
        unitPrice: Number(it.rate),
        amount: Number(it.amount),
        order: idx,
        createdAt: it.createdAt,
      })),
    };
  });
}

/**
 * Update an existing invoice for a user.
 */
export async function updateInvoice({ id, userId, data }) {
  // 1. Verify Invoice Ownership
  const existing = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      items: true,
      client: true,
      project: true,
    },
  });

  if (!existing) {
    const error = new Error("Invoice not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify Client Ownership if changed
  if (data.clientId && data.clientId !== existing.clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        userId,
      },
    });
    if (!client) {
      const error = new Error("Client not found or access denied");
      error.statusCode = 404;
      throw error;
    }
  }

  // 3. Verify Project Ownership if changed
  if (data.projectId !== undefined && data.projectId !== existing.projectId) {
    if (data.projectId && data.projectId.trim() !== "") {
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          userId,
        },
      });
      if (!project) {
        const error = new Error("Project not found or access denied");
        error.statusCode = 404;
        throw error;
      }
    }
  }

  // 4. Verify Invoice Number uniqueness if changed
  if (
    data.invoiceNumber &&
    data.invoiceNumber.trim() !== "" &&
    data.invoiceNumber.trim() !== existing.invoiceNumber
  ) {
    const duplicate = await prisma.invoice.findUnique({
      where: { invoiceNumber: data.invoiceNumber.trim() },
    });
    if (duplicate && duplicate.id !== id) {
      const error = new Error(`Invoice number "${data.invoiceNumber.trim()}" already exists.`);
      error.statusCode = 409;
      throw error;
    }
  }

  // 5. Calculate financials if items or tax or discount updated
  const itemsToUse = data.items || existing.items;
  const taxToUse = data.tax !== undefined ? data.tax : Number(existing.tax);
  const discountToUse =
    data.discount !== undefined ? data.discount : Number(existing.discount);

  const { itemsWithAmounts, subtotal, tax, discount, total } =
    calculateInvoiceFinancials({
      items: itemsToUse,
      tax: taxToUse,
      discount: discountToUse,
    });

  const isStatusChanged =
    data.status !== undefined && data.status !== existing.status;

  return await prisma.$transaction(async (tx) => {
    // If items were explicitly provided in update, replace them
    if (data.items) {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });
    }

    const updated = await tx.invoice.update({
      where: { id },
      data: {
        ...(data.clientId ? { clientId: data.clientId } : {}),
        ...(data.projectId !== undefined
          ? { projectId: data.projectId && data.projectId.trim() !== "" ? data.projectId : null }
          : {}),
        ...(data.invoiceNumber ? { invoiceNumber: data.invoiceNumber.trim() } : {}),
        ...(data.issueDate ? { issueDate: new Date(data.issueDate) } : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
        subtotal,
        tax,
        discount,
        total,
        ...(data.notes !== undefined ? { notes: data.notes ? data.notes.trim() : null } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.items
          ? {
              items: {
                create: itemsWithAmounts.map((it) => ({
                  service: it.service,
                  quantity: it.quantity,
                  rate: it.rate,
                  amount: it.amount,
                })),
              },
            }
          : {}),
      },
      include: {
        client: true,
        project: true,
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Log Activity
    if (isStatusChanged) {
      await tx.activity.create({
        data: {
          userId,
          projectId: updated.projectId,
          action: "INVOICE_STATUS_CHANGED",
          details: {
            invoiceId: id,
            invoiceNumber: updated.invoiceNumber,
            from: existing.status,
            to: data.status,
          },
        },
      });
    } else {
      await tx.activity.create({
        data: {
          userId,
          projectId: updated.projectId,
          action: "INVOICE_UPDATED",
          details: {
            invoiceId: id,
            invoiceNumber: updated.invoiceNumber,
            total,
            itemCount: itemsWithAmounts.length,
          },
        },
      });
    }

    return {
      ...updated,
      subtotal: Number(updated.subtotal),
      tax: Number(updated.tax),
      discount: Number(updated.discount),
      total: Number(updated.total),
      items: (updated.items || []).map((it, idx) => ({
        id: it.id,
        invoiceId: it.invoiceId,
        service: it.service,
        description: it.service,
        quantity: it.quantity,
        rate: Number(it.rate),
        unitPrice: Number(it.rate),
        amount: Number(it.amount),
        order: idx,
        createdAt: it.createdAt,
      })),
    };
  });
}

/**
 * Delete an invoice after verifying ownership.
 */
export async function deleteInvoice({ id, userId }) {
  const existing = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existing) {
    const error = new Error("Invoice not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    const deleted = await tx.invoice.delete({
      where: { id },
    });

    await tx.activity.create({
      data: {
        userId,
        projectId: existing.projectId,
        action: "INVOICE_DELETED",
        details: {
          invoiceId: id,
          invoiceNumber: existing.invoiceNumber,
        },
      },
    });

    return deleted;
  });
}
