import { z } from "zod";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const createTaskSchema = z.object({
  title: z
    .string({
      required_error: "Task title is required",
      invalid_type_error: "Task title must be a string",
    })
    .trim()
    .min(1, "Task title is required")
    .max(200, "Task title must not exceed 200 characters"),

  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  status: z
    .enum(TASK_STATUSES, {
      errorMap: () => ({ message: "Invalid task status" }),
    })
    .default("TODO")
    .optional(),

  priority: z
    .enum(TASK_PRIORITIES, {
      errorMap: () => ({ message: "Invalid task priority" }),
    })
    .default("MEDIUM")
    .optional(),

  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid due date format",
    })
    .optional()
    .nullable()
    .or(z.literal("")),

  projectId: z
    .string({
      invalid_type_error: "Project ID must be a string",
    })
    .min(1, "Project ID is required")
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string({
      invalid_type_error: "Task title must be a string",
    })
    .trim()
    .min(1, "Task title cannot be empty")
    .max(200, "Task title must not exceed 200 characters")
    .optional(),

  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  status: z
    .enum(TASK_STATUSES, {
      errorMap: () => ({ message: "Invalid task status" }),
    })
    .optional(),

  priority: z
    .enum(TASK_PRIORITIES, {
      errorMap: () => ({ message: "Invalid task priority" }),
    })
    .optional(),

  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid due date format",
    })
    .optional()
    .nullable()
    .or(z.literal("")),

  projectId: z
    .string({
      invalid_type_error: "Project ID must be a string",
    })
    .min(1, "Project ID cannot be empty")
    .optional(),
});
