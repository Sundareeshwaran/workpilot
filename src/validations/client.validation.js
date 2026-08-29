import { z } from "zod";

export const clientSchema = z.object({
  userId: z.string().optional(),

  name: z.string().min(2, "Name must be at least 2 characters"),

  companyName: z.string().optional().nullable(),

  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),

  phone: z.string().optional().nullable(),

  website: z.string().optional().nullable(),

  address: z.string().optional().nullable(),

  notes: z.string().optional().nullable(),
});
