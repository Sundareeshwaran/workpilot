import { z } from "zod";

export const projectSchema = z
  .object({
    name: z
      .string({
        required_error: "Project name is required",
        invalid_type_error: "Project name must be a string",
      })
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name must not exceed 100 characters"),

    clientId: z
      .string({
        required_error: "Client is required",
        invalid_type_error: "Client ID must be a string",
      })
      .min(1, "Client is required"),

    description: z
      .string()
      .trim()
      .max(1000, "Description must not exceed 1000 characters")
      .optional()
      .nullable()
      .or(z.literal("")),

    status: z
      .enum(["DRAFT", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"], {
        errorMap: () => ({ message: "Invalid project status" }),
      })
      .default("DRAFT")
      .optional(),

    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
        errorMap: () => ({ message: "Invalid project priority" }),
      })
      .default("MEDIUM")
      .optional(),

    budget: z
      .preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? val : num;
      }, z.number({ invalid_type_error: "Budget must be a valid number" }).nonnegative("Budget cannot be negative").nullable().optional()),

    currency: z
      .string()
      .length(3, "Currency must be a 3-letter code")
      .default("INR")
      .optional(),

    startDate: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid start date format",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    dueDate: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid due date format",
      })
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.dueDate) {
        return true;
      }

      return new Date(data.startDate) <= new Date(data.dueDate);
    },
    {
      message: "Due date cannot be earlier than start date",
      path: ["dueDate"],
    },
  );

export const projectUpdateSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: "Project name must be a string",
      })
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name must not exceed 100 characters")
      .optional(),

    clientId: z
      .string({
        invalid_type_error: "Client ID must be a string",
      })
      .min(1, "Client is required")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description must not exceed 1000 characters")
      .optional()
      .nullable()
      .or(z.literal("")),

    status: z
      .enum(["DRAFT", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"], {
        errorMap: () => ({ message: "Invalid project status" }),
      })
      .optional(),

    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
        errorMap: () => ({ message: "Invalid project priority" }),
      })
      .optional(),

    budget: z
      .preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? val : num;
      }, z.number({ invalid_type_error: "Budget must be a valid number" }).nonnegative("Budget cannot be negative").nullable().optional()),

    currency: z
      .string()
      .length(3, "Currency must be a 3-letter code")
      .optional(),

    startDate: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid start date format",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    dueDate: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid due date format",
      })
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.dueDate) {
        return true;
      }

      return new Date(data.startDate) <= new Date(data.dueDate);
    },
    {
      message: "Due date cannot be earlier than start date",
      path: ["dueDate"],
    },
  );
