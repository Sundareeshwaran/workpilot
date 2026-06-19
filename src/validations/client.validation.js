import { z } from "zod";

export const clientSchema = z.object({
  userId: z.string(),

  name: z.string().min(2, "Name must be at least 2 characters"),

  companyName: z.string().optional(),

  email: z.string().email().optional().or(z.literal("")),

  phone: z
    .string()
    .regex(/^[0-9]{10}$/)
    .optional()
    .or(z.literal("")),

  website: z.string().url().optional().or(z.literal("")),

  address: z.string().optional(),

  notes: z.string().optional(),
});
