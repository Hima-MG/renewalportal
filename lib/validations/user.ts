import { z } from "zod";

import { USER_ROLES } from "@/types/user";

export const assignableRoleSchema = z.enum(["admin", "finance"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Enter the user's full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: assignableRoleSchema,
});

export const setRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});
