import { email, z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().min(8),
});

export const loginScheme = z.object({
  email: z.email(),
  password: z.string().min(8),
});
