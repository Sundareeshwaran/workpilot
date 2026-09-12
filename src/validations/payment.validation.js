import { z } from "zod";

export const PAYMENT_METHOD_VALUES = [
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CASH",
  "PAYPAL",
  "OTHER",
];

export const PAYMENT_METHOD_LABELS = {
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Credit / Debit Card",
  CASH: "Cash",
  PAYPAL: "PayPal",
  OTHER: "Other",
};

/**
 * Preprocess amount input from number, string, or form values into a clean rounded decimal number.
 */
const amountSchema = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? val : Number(num.toFixed(2));
}, z
  .number({
    invalid_type_error: "Payment amount must be a valid number",
    required_error: "Payment amount is required",
  })
  .positive("Payment amount must be greater than 0")
  .max(100000000, "Payment amount cannot exceed ₹100,000,000"));

/**
 * Preprocess date inputs into valid Date objects.
 */
const dateSchema = z.preprocess((val) => {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? val : parsed;
}, z.date({
  invalid_type_error: "Payment date must be a valid date",
  required_error: "Payment date is required",
}));

/**
 * Schema for creating a new invoice payment.
 */
export const paymentCreateSchema = z.object({
  invoiceId: z
    .string({
      required_error: "Invoice ID is required",
      invalid_type_error: "Invoice ID must be a string",
    })
    .trim()
    .min(1, "Invoice ID is required"),

  amount: amountSchema,

  paymentMethod: z.enum(PAYMENT_METHOD_VALUES, {
    errorMap: () => ({
      message: `Payment method must be one of: ${PAYMENT_METHOD_VALUES.join(", ")}`,
    }),
  }),

  paymentDate: dateSchema.default(() => new Date()),

  referenceNumber: z
    .string({
      invalid_type_error: "Reference number must be a string",
    })
    .trim()
    .max(100, "Reference number must not exceed 100 characters")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),

  notes: z
    .string({
      invalid_type_error: "Notes must be a string",
    })
    .trim()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
});

/**
 * Schema for updating an existing payment record.
 */
export const paymentUpdateSchema = z.object({
  amount: amountSchema.optional(),

  paymentMethod: z
    .enum(PAYMENT_METHOD_VALUES, {
      errorMap: () => ({
        message: `Payment method must be one of: ${PAYMENT_METHOD_VALUES.join(", ")}`,
      }),
    })
    .optional(),

  paymentDate: dateSchema.optional(),

  referenceNumber: z
    .string({
      invalid_type_error: "Reference number must be a string",
    })
    .trim()
    .max(100, "Reference number must not exceed 100 characters")
    .optional()
    .nullable()
    .transform((val) => (val !== undefined ? (val && val.trim() !== "" ? val.trim() : null) : undefined)),

  notes: z
    .string({
      invalid_type_error: "Notes must be a string",
    })
    .trim()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional()
    .nullable()
    .transform((val) => (val !== undefined ? (val && val.trim() !== "" ? val.trim() : null) : undefined)),
});

/**
 * Schema for querying and filtering payments.
 */
export const paymentQuerySchema = z.object({
  page: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return 1;
    const num = parseInt(val, 10);
    return isNaN(num) ? 1 : Math.max(1, num);
  }, z.number().int().min(1).default(1)),

  limit: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return 10;
    const num = parseInt(val, 10);
    return isNaN(num) ? 10 : Math.min(100, Math.max(1, num));
  }, z.number().int().min(1).max(100).default(10)),

  invoiceId: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
  search: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  sortBy: z.enum(["paymentDate", "amount", "createdAt", "updatedAt"]).default("paymentDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
