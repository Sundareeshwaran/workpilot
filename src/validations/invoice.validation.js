import { z } from "zod";

export const INVOICE_STATUS_VALUES = [
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

export const invoiceItemSchema = z
  .object({
    id: z.string().optional(),
    service: z
      .string({
        invalid_type_error: "Service description must be a string",
      })
      .trim()
      .max(255, "Description must not exceed 255 characters")
      .optional(),

    description: z
      .string({
        invalid_type_error: "Description must be a string",
      })
      .trim()
      .max(255, "Description must not exceed 255 characters")
      .optional(),

    quantity: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return 1;
      const num = parseInt(val, 10);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: "Quantity must be a valid integer" }).int("Quantity must be a whole number").min(1, "Quantity must be at least 1")),

    rate: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: "Rate must be a valid number" }).min(0, "Rate cannot be negative").optional()),

    unitPrice: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: "Unit price must be a valid number" }).min(0, "Unit price cannot be negative").optional()),

    amount: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number().min(0).optional()),
  })
  .refine(
    (data) => {
      const desc = data.description || data.service;
      return Boolean(desc && desc.trim().length > 0);
    },
    {
      message: "Item description or service name is required",
      path: ["service"],
    },
  );

export const invoiceCreateSchema = z
  .object({
    invoiceNumber: z
      .string()
      .trim()
      .max(50, "Invoice number must not exceed 50 characters")
      .optional()
      .nullable()
      .or(z.literal("")),

    clientId: z
      .string({
        required_error: "Client is required",
        invalid_type_error: "Client ID must be a string",
      })
      .min(1, "Client is required"),

    projectId: z
      .string()
      .optional()
      .nullable()
      .or(z.literal("")),

    issueDate: z
      .string({
        required_error: "Issue date is required",
      })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid issue date format",
      }),

    dueDate: z
      .string({
        required_error: "Due date is required",
      })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid due date format",
      }),

    items: z
      .array(invoiceItemSchema)
      .min(1, "At least one line item is required on the invoice"),

    tax: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: "Tax must be a valid number" }).min(0, "Tax cannot be negative").default(0).optional()),

    discount: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: "Discount must be a valid number" }).min(0, "Discount cannot be negative").default(0).optional()),

    status: z
      .enum(INVOICE_STATUS_VALUES, {
        errorMap: () => ({ message: "Invalid invoice status" }),
      })
      .default("DRAFT")
      .optional(),

    notes: z
      .string()
      .trim()
      .max(2000, "Notes must not exceed 2000 characters")
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.issueDate || !data.dueDate) return true;
      return new Date(data.dueDate) >= new Date(data.issueDate);
    },
    {
      message: "Due date cannot be earlier than issue date",
      path: ["dueDate"],
    },
  );

export const invoiceUpdateSchema = z
  .object({
    invoiceNumber: z
      .string()
      .trim()
      .max(50, "Invoice number must not exceed 50 characters")
      .optional(),

    clientId: z
      .string({
        invalid_type_error: "Client ID must be a string",
      })
      .min(1, "Client is required")
      .optional(),

    projectId: z
      .string()
      .optional()
      .nullable()
      .or(z.literal("")),

    issueDate: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid issue date format",
      })
      .optional(),

    dueDate: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid due date format",
      })
      .optional(),

    items: z
      .array(invoiceItemSchema)
      .min(1, "At least one line item is required on the invoice")
      .optional(),

    tax: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: "Tax must be a valid number" }).min(0, "Tax cannot be negative").optional()),

    discount: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? val : num;
    }, z.number({ invalid_type_error: "Discount must be a valid number" }).min(0, "Discount cannot be negative").optional()),

    status: z
      .enum(INVOICE_STATUS_VALUES, {
        errorMap: () => ({ message: "Invalid invoice status" }),
      })
      .optional(),

    notes: z
      .string()
      .trim()
      .max(2000, "Notes must not exceed 2000 characters")
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.issueDate || !data.dueDate) return true;
      return new Date(data.dueDate) >= new Date(data.issueDate);
    },
    {
      message: "Due date cannot be earlier than issue date",
      path: ["dueDate"],
    },
  );

export const invoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUS_VALUES, {
    errorMap: () => ({ message: "Invalid invoice status" }),
  }),
});
